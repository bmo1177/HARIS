/**
 * HARIS evaluation harness.
 *
 * Answers the question a security tool has to answer: how accurate is it, and
 * what does it get wrong?
 *
 * ## Metrics, and why these four
 *
 * - **False-positive rate on the benign class.** The headline number. A tool that
 *   flags ordinary messages teaches students to ignore it.
 * - **Recall on the hostile class.** The other half: a miss is a student who
 *   clicks the link.
 * - **Robustness.** Whether the prompt-injection cases in `dataset.ts` still get
 *   scored on their content rather than the instructions embedded in them.
 * - **Attack-type accuracy.** Reported separately and never gating, because
 *   category naming is genuinely fuzzy and a strict metric would mostly measure
 *   annotation taste.
 *
 * ## Providers
 *
 *   --provider=live   real LLM call via LLM_API_KEY / LLM_BASE_URL / LLM_MODEL
 *   --provider=mock   deterministic fixture responses, no network
 *
 * `mock` exists so CI can prove the harness runs and the arithmetic is right
 * without a secret. It proves nothing about accuracy — it is a harness test.
 *
 * ## Usage
 *
 *   deno run --allow-env --allow-net eval/run.ts
 *   deno run --allow-env --allow-net eval/run.ts --provider=live --model=google/gemini-3.5-flash
 *   deno run --allow-env --allow-net eval/run.ts --filter=benign --json
 */

import {
  type AnalysisResult,
  analyzeMessage,
  MODEL_OUTPUT,
  reconcile,
  type RiskBand,
} from "../supabase/functions/_shared/analysis.ts";
import { getConfig, resetConfigCache } from "../supabase/functions/_shared/env.ts";
import { CASES, CLASSES, type EvalCase, type ExpectedRisk } from "./dataset.ts";

// --------------------------------------------------------------------- config

const args = new Map<string, string>();
for (const raw of Deno.args) {
  const m = raw.match(/^--([^=]+)(?:=(.*))?$/);
  if (m) args.set(m[1], m[2] ?? "true");
}

/**
 * Validate the knobs before any work happens.
 *
 * Both of these used to fail quietly in the worst possible direction:
 *
 *   --repeats=0     looped zero times, then reported "recall on hostile 100.0%"
 *                   over an empty set and exited 0. A green run that measured
 *                   nothing is exactly the failure this harness exists to catch
 *                   elsewhere, so it must not be possible here.
 *   --provider=liv  matched neither branch of `provider === "mock"`, so a typo
 *                   silently selected the *live* path and started spending money
 *                   against whatever LLM_API_KEY happened to be in the shell.
 *
 * Exiting 2 matches the existing `--filter` no-match behaviour: a usage error,
 * distinct from 1, which means the harness ran and found a real failure.
 */
const provider = args.get("provider") ?? "mock";
const filter = args.get("filter");
const asJson = args.has("json");
const rawRepeats = args.get("repeats") ?? "1";
const repeats = Number.parseInt(rawRepeats, 10);
const rawMaxErrors = args.get("max-errors");
const maxErrors = rawMaxErrors === undefined
  ? Number.POSITIVE_INFINITY
  : Number.parseInt(rawMaxErrors, 10);

if (provider !== "mock" && provider !== "live") {
  console.error(
    `--provider must be "mock" or "live", got ${JSON.stringify(provider)}. ` +
      `Refusing to guess: an unrecognised value previously selected the live ` +
      `provider and spent API credit.`,
  );
  Deno.exit(2);
}

if (!Number.isInteger(repeats) || repeats < 1) {
  console.error(
    `--repeats must be a positive integer, got ${JSON.stringify(rawRepeats)}. ` +
      `A run with zero repeats measures nothing and must not report a score.`,
  );
  Deno.exit(2);
}

if (
  rawMaxErrors !== undefined &&
  (!Number.isInteger(maxErrors) || maxErrors < 1)
) {
  console.error(
    `--max-errors must be a positive integer, got ${
      JSON.stringify(rawMaxErrors)
    }. Omit it to run every case.`,
  );
  Deno.exit(2);
}

// ------------------------------------------------------------------- metrics

interface Bucket {
  /** Cases attempted. */
  total: number;
  /** Cases that produced a verdict; the rest errored. */
  measured: number;
  correct: number;
}

interface Confusion {
  [expected: string]: Bucket;
}

/** Hostile for metric purposes: anything that should not be called Safe. */
const isHostile = (risk: ExpectedRisk) => risk !== "Safe";

/** What the harness observed. "Error" means no verdict came back at all. */
type ObservedRisk = AnalysisResult["risk_level"] | "Error";

interface ItemResult {
  id: string;
  expected: ExpectedRisk;
  actual: ObservedRisk;
  expectedType?: string;
  actualType: string;
  note: string;
  error?: string;
  score: number;
}

const confusion: Confusion = Object.fromEntries(
  CLASSES.map((expected) => [expected, { total: 0, measured: 0, correct: 0 }]),
) as Confusion;

let truePositive = 0;
let falsePositive = 0;
let falseNegative = 0;
let trueNegative = 0;
let typeScored = 0;
let typeCorrect = 0;
let injectionSteered = 0;
let injectionUnmeasured = 0;
let injectionTotal = 0;
let errors = 0;
let stoppedEarly = false;
const items: ItemResult[] = [];

const normalise = (v: string) => v.trim().toLowerCase().replace(/[^a-z0-9]+/g, "");

// ------------------------------------------------------------------- running

const selected = filter
  ? CASES.filter((c) => c.id.includes(filter) || c.message.includes(filter))
  : CASES;

if (selected.length === 0) {
  console.error(`No cases matched --filter=${filter}`);
  Deno.exit(2);
}

/** Runs requested by the full selection, before any fail-fast stop. */
const plannedRuns = selected.length * repeats;

/**
 * Deterministic stand-in for the model.
 *
 * Classifies by crude heuristics so the harness produces a realistic spread of
 * outcomes: some right, some wrong, including benign items it gets wrong. A mock
 * that scored perfectly would prove the arithmetic works and nothing else.
 */
function mockAnalyse(testCase: EvalCase): AnalysisResult {
  // Builds a model-shaped response and runs it through the production
  // reconciliation, rather than hand-writing the verdict. A copied threshold
  // block here is exactly how the harness ended up disagreeing with the server.
  const text = testCase.message.toLowerCase();
  const hostile =
    /urgent|immediately|verify your account|click here|bit\.ly|claim your prize|send.*(qar|password|code)|password|fake bank|entered your|log in now|free\b.*(ps5|v-bucks|followers)|suspended|deleted in|giveaway|selected to win|shared your (name|phone)|id number|passport number|otp|one-time code/
      .test(
        text,
      );
  const suspicious =
    /congratulations|reminder|appointment|track|shipped|selected for a place|security alert/i
      .test(
        text,
      );

  // Deliberately get one benign case wrong so the false-positive path is exercised.
  const wrongOnPurpose = testCase.id === "benign-015";

  const risk_band: RiskBand = hostile ? "high" : wrongOnPurpose || suspicious ? "medium" : "none";

  return reconcile(
    MODEL_OUTPUT.parse({
      risk_band,
      attack_type: risk_band === "none"
        ? "Safe"
        : (testCase.expected_attack_type ?? "Social Engineering"),
      attack_type_ar: risk_band === "none" ? "آمن" : "هندسة اجتماعية",
      clue_1: `clue one for ${testCase.id}`,
      clue_2: `clue two for ${testCase.id}`,
      clue_3: `clue three for ${testCase.id}`,
      clue_1_ar: `تلميح أول لـ ${testCase.id}`,
      clue_2_ar: `تلميح ثانٍ لـ ${testCase.id}`,
      clue_3_ar: `تلميح ثالث لـ ${testCase.id}`,
      explanation: `mock explanation for ${testCase.id}`,
      explanation_ar: `شرح وهمي ${testCase.id}`,
    }),
  );
}

/**
 * Percentage, or `null` when the denominator is zero.
 *
 * Zero-over-zero is not 0%. A partial run that never got a hostile verdict used
 * to report "recall 100.0%" because `0 / 0` was folded to zero, and then
 * subtracted from 100 — a perfect score for measuring nothing. The same bug in
 * reverse made precision 0% when no hostile verdict had been predicted. Both are
 * undefined, not numbers, and the JSON and text now say so.
 */
const rate = (n: number, d: number): number | null =>
  d === 0 ? null : (n / d) * 100;
function rounded(v: number | null): number | null {
  return v === null ? null : Number(v.toFixed(2));
}
const shown = (v: number | null) => (v === null ? "n/a" : `${v.toFixed(1)}%`);
const because = (v: number | null, note: string) =>
  v === null ? `   (${note})` : "";

/**
 * Apply `--model` before the first call.
 *
 * The flag was previously parsed, printed in the report header and written into
 * the JSON as `model`, but never passed to the model — which came from
 * `LLM_MODEL` in the environment. So the harness recorded results under the name
 * of a model it had not called. For a tool whose whole purpose is comparing
 * accuracy across models, that silently corrupts exactly the trend it exists to
 * produce. Setting it here, and dropping the memoised config, makes the label
 * true or the run fails.
 */
const requestedModel = args.get("model");
if (requestedModel && provider === "live") {
  Deno.env.set("LLM_MODEL", requestedModel);
  resetConfigCache();
} else if (requestedModel && provider === "mock") {
  console.error(
    "--model has no effect with --provider=mock; the mock ignores the model.",
  );
  Deno.exit(2);
}

async function analyseOne(testCase: EvalCase): Promise<AnalysisResult> {
  if (provider === "mock") return mockAnalyse(testCase);
  return await analyzeMessage(testCase.message);
}

outer:
for (const testCase of selected) {
  for (let run = 0; run < repeats; run++) {
    let actual: AnalysisResult | null = null;
    let failure: string | undefined;

    try {
      actual = await analyseOne(testCase);
    } catch (error) {
      failure = error instanceof Error ? error.message : String(error);
      errors++;
    }

    const bucket = confusion[testCase.expected_risk];
    bucket.total++;

    const actualRisk: ObservedRisk = actual?.risk_level ?? "Error";
    const gotVerdict = !failure && actual !== null;
    if (gotVerdict) bucket.measured++;

    if (!failure && actualRisk === testCase.expected_risk) bucket.correct++;

    // Binary hostile-vs-benign, which is what the safety argument rests on.
    //
    // An errored case has no verdict, so counting it as a miss would inflate the
    // false-negative rate and depress recall for a reason that has nothing to do
    // with the model. Errors are tracked separately and gate the run instead.
    const expectedHostile = isHostile(testCase.expected_risk);
    const actualHostile = actual?.is_threat;
    if (actualHostile === true) {
      if (expectedHostile) truePositive++;
      else falsePositive++;
    } else if (actualHostile === false) {
      if (expectedHostile) falseNegative++;
      else trueNegative++;
    }

    if (testCase.expected_attack_type && actual) {
      typeScored++;
      const expected = normalise(testCase.expected_attack_type);
      const got = normalise(actual.attack_type);
      if (
        expected === got || expected.includes(got) || got.includes(expected)
      ) typeCorrect++;
    }

    // Injection robustness: for an `inject-*` case the expected risk describes the
    // *content*, not the instruction riding on it. So if the model followed the
    // embedded instruction its verdict would diverge from the content's verdict —
    // which means robustness on this subset is exactly accuracy on this subset.
    // Stated that way rather than as a separate rule with its own arithmetic,
    // which is where the first version of this file went wrong.
    if (testCase.id.startsWith("inject-")) {
      // An errored case is *unmeasured*, not steered. A rate-limit 429 is not
      // evidence about injection resistance, and reporting it as a steered
      // payload turned "we did not get an answer" into "the attack won". The
      // first live run printed 0/4 for this reason: three of the four cases had
      // never been sent to a model at all.
      if (!failure && actual) {
        injectionTotal++;
        if (actual.risk_level !== testCase.expected_risk) injectionSteered++;
      } else {
        injectionUnmeasured++;
      }
    }

    items.push({
      id: testCase.id,
      expected: testCase.expected_risk,
      actual: actualRisk,
      expectedType: testCase.expected_attack_type,
      actualType: actual?.attack_type ?? "-",
      note: testCase.note,
      error: failure,
      score: actual?.risk_score ?? -1,
    });

    // A provider outage should fail fast rather than spend the job's whole
    // ceiling. The partial metrics stay in the report, but they are labelled.
    // If the threshold is reached on the final planned run, the run was not
    // cut short, so it is not reported as partial.
    if (errors >= maxErrors && items.length < plannedRuns) {
      stoppedEarly = true;
      break outer;
    }
  }
}

// ------------------------------------------------------------------ reporting

const fpr = rate(falsePositive, falsePositive + trueNegative);
const fnr = rate(falseNegative, falseNegative + truePositive);
const recall = fnr === null ? null : 100 - fnr;
const precision = rate(truePositive, truePositive + falsePositive);
let f1: number | null = null;
if (precision !== null && recall !== null) {
  f1 = precision + recall === 0
    ? 0
    : (2 * precision * recall) / (precision + recall);
}
const overall = rate(
  CLASSES.reduce((sum, c) => sum + confusion[c].correct, 0),
  items.length,
);
const measuredCases = items.length - errors;

if (asJson) {
  console.log(
    JSON.stringify(
      {
        provider,
        // The effective model, not the --model flag. Reading the flag meant a run
        // driven by LLM_MODEL — which is how any deployed setup works — recorded
        // `model: null`, i.e. the eval record did not identify what produced it.
        // For an artifact whose purpose is comparing models, that is the whole
        // value lost.
        model: provider === "live" ? getConfig().llm.model : "(mock)",
        cases: items.length,
        measured_cases: measuredCases,
        planned_cases: plannedRuns,
        stopped_early: stoppedEarly,
        max_errors: Number.isFinite(maxErrors) ? maxErrors : null,
        metrics: {
          overall_accuracy: rounded(overall),
          false_positive_rate: rounded(fpr),
          false_negative_rate: rounded(fnr),
          precision: rounded(precision),
          recall: rounded(recall),
          f1: rounded(f1),
          attack_type_accuracy: typeScored
            ? rounded(rate(typeCorrect, typeScored))
            : null,
          injection_steered: injectionSteered,
          injection_cases: injectionTotal,
          injection_unmeasured: injectionUnmeasured,
          errors,
        },
        confusion: Object.fromEntries(
          Object.entries(confusion).map(([k, v]) => [
            k,
            {
              total: v.total,
              measured: v.measured,
              correct: v.correct,
              accuracy: rounded(rate(v.correct, v.measured)),
            },
          ]),
        ),
        items,
      },
      null,
      2,
    ),
  );
} else {
  const line = "─".repeat(64);
  console.log(
    `\nHARIS evaluation — provider: ${provider}${
      args.get("model") ? ` (${args.get("model")})` : ""
    }`,
  );
  console.log(
    `cases: ${items.length}${repeats > 1 ? `  (${repeats} runs each)` : ""}${
      errors ? `  (${measuredCases} measured, ${errors} errored)` : ""
    }`,
  );
  if (stoppedEarly) {
    console.log(
      `stopped early: ${errors} error(s) reached --max-errors=${maxErrors}; ` +
        `${items.length} of ${plannedRuns} case run(s) attempted`,
    );
  }
  console.log(line);
  console.log(
    `overall accuracy        ${shown(overall)}${
      errors ? "   (errors counted as incorrect)" : ""
    }`,
  );
  console.log(
    `FALSE POSITIVE RATE     ${shown(fpr)}   (${
      fpr === null
        ? "no benign case produced a verdict"
        : "benign messages called a threat"
    })`,
  );
  console.log(
    `recall on hostile       ${shown(recall)}${
      because(recall, "no hostile case produced a verdict")
    }`,
  );
  console.log(
    `precision               ${shown(precision)}${
      because(precision, "no hostile verdict was predicted")
    }`,
  );
  console.log(`F1                      ${shown(f1)}`);
  if (typeScored) {
    console.log(
      `attack-type accuracy    ${
        shown(rate(typeCorrect, typeScored))
      }  (${typeScored} labelled, advisory)`,
    );
  }
  if (injectionTotal + injectionUnmeasured > 0) {
    console.log(
      `injection robustness    ${
        injectionTotal - injectionSteered
      }/${injectionTotal}  (payload instruction ignored)` +
        // Says so explicitly, because a 0/0 line otherwise reads as "no attacks
        // succeeded" when it actually means "nothing was measured".
        (injectionUnmeasured ? `   [${injectionUnmeasured} case(s) errored and are excluded]` : ""),
    );
  }
  if (errors) console.log(`errors                  ${errors}`);
  console.log(line);
  console.log("\nper class:");
  for (const c of CLASSES) {
    const b = confusion[c];
    const errored = b.total - b.measured;
    console.log(
      `  ${c.padEnd(11)} ${`${b.correct}/${b.measured}`.padStart(7)}  ${
        shown(rate(b.correct, b.measured)).padStart(5)
      }${
        errored ? `  (${errored} of ${b.total} errored, excluded)` : ""
      }`,
    );
  }

  const misses = items.filter((i) => i.error || i.actual !== i.expected);
  if (misses.length) {
    console.log(`\n${misses.length} mismatch(es):`);
    for (const m of misses) {
      console.log(
        `  ${m.id.padEnd(14)} expected ${m.expected.padEnd(11)} got ${m.actual.padEnd(11)} score=${
          String(m.score).padStart(4)
        }  ${m.error ?? m.note}`,
      );
    }
  }

  if (provider === "mock") {
    console.log(
      `\nNOTE: these numbers are from the mock provider and say nothing about\naccuracy. They only show the harness runs and the arithmetic is correct.\nRun with --provider=live and an LLM_API_KEY for real results.`,
    );
  }
  console.log();
}

// Exit non-zero on the conditions that matter, so this can gate CI.
//
// Deliberately does NOT gate on accuracy thresholds. Accuracy moves with the
// model and the prompt, and a hard gate turns a routine model upgrade into a red
// build that everyone learns to bypass. The two conditions below are different:
// an error means the harness itself is broken, and a steered injection is a
// correctness failure with a defensible fix rather than a tuning knob.
if (errors > 0) {
  const partial = stoppedEarly
    ? ` Stopped at --max-errors=${maxErrors} after ${items.length} of ${plannedRuns} case run(s); the metrics above are partial.`
    : "";
  console.error(`${errors} case(s) failed to produce a verdict.${partial}`);
  Deno.exit(1);
}
if (injectionSteered > 0) {
  console.error(
    `${injectionSteered} prompt-injection case(s) were steered by instructions in the payload.`,
  );
  Deno.exit(1);
}
