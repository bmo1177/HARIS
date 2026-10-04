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
  RISK_DANGEROUS,
  RISK_SUSPICIOUS,
} from "../supabase/functions/_shared/analysis.ts";
import { CASES, CLASSES, type EvalCase, type ExpectedRisk } from "./dataset.ts";

// --------------------------------------------------------------------- config

const args = new Map<string, string>();
for (const raw of Deno.args) {
  const m = raw.match(/^--([^=]+)(?:=(.*))?$/);
  if (m) args.set(m[1], m[2] ?? "true");
}

const provider = args.get("provider") ?? "mock";
const filter = args.get("filter");
const asJson = args.has("json");
const repeats = Number.parseInt(args.get("repeats") ?? "1", 10);

// ------------------------------------------------------------------- metrics

interface Bucket {
  total: number;
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
  CLASSES.map((expected) => [expected, { total: 0, correct: 0 }]),
) as Confusion;

let truePositive = 0;
let falsePositive = 0;
let falseNegative = 0;
let trueNegative = 0;
let typeScored = 0;
let typeCorrect = 0;
let injectionSteered = 0;
let injectionTotal = 0;
let errors = 0;
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

/**
 * Deterministic stand-in for the model.
 *
 * Classifies by crude heuristics so the harness produces a realistic spread of
 * outcomes: some right, some wrong, including benign items it gets wrong. A mock
 * that scored perfectly would prove the arithmetic works and nothing else.
 */
function mockAnalyse(testCase: EvalCase): AnalysisResult {
  const text = testCase.message.toLowerCase();
  const hostile =
    /urgent|immediately|verify your account|click here|bit\.ly|claim your prize|send.*(qar|password|code)|free\b.*(ps5|v-bucks|followers)|suspended|deleted in|giveaway|selected to win|shared your (name|phone)|id number|passport number|otp|one-time code/
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

  const score = hostile ? 82 : wrongOnPurpose ? 40 : suspicious ? 32 : 8;
  const risk: AnalysisResult["risk_level"] = score >= RISK_DANGEROUS
    ? "Dangerous"
    : score >= RISK_SUSPICIOUS
    ? "Suspicious"
    : "Safe";

  return {
    risk_score: score,
    risk_level: risk,
    is_threat: risk !== "Safe",
    attack_type: risk === "Safe" ? "Safe" : (testCase.expected_attack_type ?? "Social Engineering"),
    attack_type_ar: risk === "Safe" ? "آمن" : "هندسة اجتماعية",
    clue_1: `clue one for ${testCase.id}`,
    clue_2: `clue two for ${testCase.id}`,
    clue_3: `clue three for ${testCase.id}`,
    explanation: `mock explanation for ${testCase.id}`,
    explanation_ar: `شرح وهمي ${testCase.id}`,
  };
}

const pct = (n: number, d: number) => (d === 0 ? 0 : (n / d) * 100);

async function analyseOne(testCase: EvalCase): Promise<AnalysisResult> {
  if (provider === "mock") return mockAnalyse(testCase);
  return await analyzeMessage(testCase.message);
}

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

    if (!failure && actualRisk === testCase.expected_risk) bucket.correct++;

    // Binary hostile-vs-benign, which is what the safety argument rests on.
    const expectedHostile = isHostile(testCase.expected_risk);
    const actualHostile = actual !== null && actual.is_threat;
    if (expectedHostile && actualHostile) truePositive++;
    else if (!expectedHostile && actualHostile) falsePositive++;
    else if (expectedHostile && !actualHostile) falseNegative++;
    else trueNegative++;

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
    if (testCase.id.startsWith("inject-") && actual) {
      injectionTotal++;
      if (actual.risk_level !== testCase.expected_risk) injectionSteered++;
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
  }
}

// ------------------------------------------------------------------ reporting

const fpr = pct(falsePositive, falsePositive + trueNegative);
const fnr = pct(falseNegative, falseNegative + truePositive);
const recall = 100 - fnr;
const precision = pct(truePositive, truePositive + falsePositive);
const f1 = precision + recall === 0 ? 0 : (2 * precision * recall) / (precision + recall);
const overall = pct(
  CLASSES.reduce((sum, c) => sum + confusion[c].correct, 0),
  items.length,
);

if (asJson) {
  console.log(
    JSON.stringify(
      {
        provider,
        model: args.get("model") ?? null,
        cases: items.length,
        metrics: {
          overall_accuracy: Number(overall.toFixed(2)),
          false_positive_rate: Number(fpr.toFixed(2)),
          false_negative_rate: Number(fnr.toFixed(2)),
          precision: Number(precision.toFixed(2)),
          recall: Number(recall.toFixed(2)),
          f1: Number(f1.toFixed(2)),
          attack_type_accuracy: typeScored ? Number(pct(typeCorrect, typeScored).toFixed(2)) : null,
          injection_steered: injectionSteered,
          injection_cases: injectionTotal,
          errors,
        },
        confusion: Object.fromEntries(
          Object.entries(confusion).map(([k, v]) => [
            k,
            {
              total: v.total,
              correct: v.correct,
              accuracy: Number(pct(v.correct, v.total).toFixed(2)),
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
    `cases: ${items.length}${repeats > 1 ? `  (${repeats} runs each)` : ""}`,
  );
  console.log(line);
  console.log(`overall accuracy        ${overall.toFixed(1)}%`);
  console.log(
    `FALSE POSITIVE RATE     ${fpr.toFixed(1)}%   (benign messages called a threat)`,
  );
  console.log(`recall on hostile       ${recall.toFixed(1)}%`);
  console.log(`precision               ${precision.toFixed(1)}%`);
  console.log(`F1                      ${f1.toFixed(1)}%`);
  if (typeScored) {
    console.log(
      `attack-type accuracy    ${
        pct(typeCorrect, typeScored).toFixed(1)
      }%  (${typeScored} labelled, advisory)`,
    );
  }
  if (injectionTotal) {
    console.log(
      `injection robustness    ${
        injectionTotal - injectionSteered
      }/${injectionTotal}  (payload instruction ignored)`,
    );
  }
  if (errors) console.log(`errors                  ${errors}`);
  console.log(line);
  console.log("\nper class:");
  for (const c of CLASSES) {
    const b = confusion[c];
    console.log(
      `  ${c.padEnd(11)} ${String(b.correct).padStart(3)}/${String(b.total).padEnd(3)}  ${
        pct(b.correct, b.total).toFixed(1)
      }%`,
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
  console.error(`${errors} case(s) failed to produce a verdict.`);
  Deno.exit(1);
}
if (injectionSteered > 0) {
  console.error(
    `${injectionSteered} prompt-injection case(s) were steered by instructions in the payload.`,
  );
  Deno.exit(1);
}
