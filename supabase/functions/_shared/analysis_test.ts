import { assertEquals } from "jsr:@std/assert@1";
import {
  ANALYSIS_SCHEMA,
  BAND_SCORE,
  MODEL_OUTPUT,
  reconcile,
  RISK_BANDS,
  RISK_DANGEROUS,
  RISK_SUSPICIOUS,
  type RiskBand,
} from "./analysis.ts";

/** A well-formed model response that the tests then perturb one field at a time. */
const base = {
  risk_band: "high" as RiskBand,
  attack_type: "Phishing",
  attack_type_ar: "التصيّد",
  clue_1: "Lookalike domain",
  clue_2: "Countdown pressure",
  clue_3: "Asks for personal details",
  explanation: "This is a phishing attempt.",
  explanation_ar: "هذه محاولة تصيّد.",
};

const model = (overrides: Partial<typeof base> = {}) =>
  MODEL_OUTPUT.parse({ ...base, ...overrides });

Deno.test("every band maps to a score that the thresholds read the intended way", () => {
  // The band table is the only place a model's judgement becomes a number, so
  // pin the outcome for all four bands rather than spot-checking one.
  assertEquals(reconcile(model({ risk_band: "none" })).risk_level, "Safe");
  assertEquals(reconcile(model({ risk_band: "low" })).risk_level, "Safe");
  assertEquals(reconcile(model({ risk_band: "medium" })).risk_level, "Suspicious");
  assertEquals(reconcile(model({ risk_band: "high" })).risk_level, "Dangerous");
});

Deno.test("the band table never straddles a threshold by accident", () => {
  for (const [band, score] of Object.entries(BAND_SCORE)) {
    assertEquals(Number.isInteger(score), true, `${band} must be a whole number`);
    assertEquals(score >= 0 && score <= 100, true, `${band} must be displayable`);
  }
  // Only 'high' may reach Dangerous, and only 'medium' and above may be Suspicious.
  // Retuning must never promote 'low' to a threat verdict: the model answers "low"
  // for ordinary messages, so doing that turns the whole benign class into false
  // alarms. That is not hypothetical — it measured at 93%.
  assertEquals(
    Object.entries(BAND_SCORE)
      .filter(([, s]) => s >= RISK_DANGEROUS)
      .map(([b]) => b),
    ["high"],
  );
  assertEquals(
    Object.entries(BAND_SCORE)
      .filter(([, s]) => s < RISK_SUSPICIOUS)
      .map(([b]) => b),
    ["none", "low"],
  );
  // Bands must also stay strictly ordered, or "medium" could score below "low".
  const scores = RISK_BANDS.map((b) => BAND_SCORE[b]);
  assertEquals(scores.every((v, i) => i === 0 || v > (scores[i - 1] ?? 0)), true);
});

Deno.test("risk_level and is_threat are consistent for every band", () => {
  for (const band of RISK_BANDS) {
    const result = reconcile(model({ risk_band: band }));
    assertEquals(result.is_threat, result.risk_level !== "Safe");
    if (result.risk_level === "Safe") {
      assertEquals(result.is_threat, false);
    }
  }
});

Deno.test("a Safe verdict never keeps an attack category", () => {
  // The coherence case: a low score with "Phishing" attached. The derived score
  // wins, because the category is model-authored and the score is not.
  const result = reconcile(model({ risk_band: "none", attack_type: "Phishing" }));
  assertEquals(result.risk_level, "Safe");
  assertEquals(result.is_threat, false);
});

Deno.test("empty narrative fields get a usable fallback, never a blank card", () => {
  const result = reconcile(model({ clue_1: "", clue_2: "   ", explanation: "" }));
  assertEquals(result.clue_1.length > 0, true);
  assertEquals(result.clue_2.length > 0, true);
  assertEquals(result.explanation.length > 0, true);
});

Deno.test("overlong narrative fields are truncated", () => {
  const result = reconcile(model({ explanation: "x".repeat(5_000), clue_1: "y".repeat(1_000) }));
  assertEquals(result.explanation.length <= 900, true);
  assertEquals(result.clue_1.length <= 300, true);
});

Deno.test("a missing required field is rejected at the schema", () => {
  const incomplete = { ...base } as Record<string, unknown>;
  delete incomplete.clue_3;
  assertEquals(MODEL_OUTPUT.safeParse(incomplete).success, false);
});

Deno.test("a non-string risk_band is rejected at the schema", () => {
  assertEquals(MODEL_OUTPUT.safeParse({ ...base, risk_band: 4 }).success, false);
  assertEquals(MODEL_OUTPUT.safeParse({ ...base, risk_band: null }).success, false);
});

// ---------------------------------------------------------------------------
// The 0-1 regression
//
// `risk_score` used to be documented as "0 (safe) to 100 (hostile)" while the
// schema only said `type: number`, leaving the scale undefined. Every real free
// model read it as a probability: an obvious phishing URL came back as 0.9,
// which rounded to 1 and derived "Safe" — the tool confidently telling students
// a live phishing link was harmless, with no error to signal it.
//
// Attempted fixes, and why they are not used:
//   * `minimum: 0, maximum: 100` — 0.9 is inside the range. Does nothing.
//   * `type: integer` — nvidia/nemotron-3-super-120b-a12b:free accepts the
//     schema, returns HTTP 200 and valid JSON, then emits an empty object.
//     Silently wrong output is worse than a loud failure.
//   * Rescaling 0.9 -> 90 server-side — rewrites the evidence on a guess. A model
//     genuinely returning 1/100 would become a false alarm.
//
// Asking for a band instead removes the ambiguity at the source. The score the
// UI shows is now derived, so it is correct by construction and an injection
// payload has no numeric field to forge.
// ---------------------------------------------------------------------------

Deno.test("the model is never asked for a score, only a band", () => {
  const props = ANALYSIS_SCHEMA.properties as Record<string, unknown>;
  assertEquals(
    "risk_score" in props,
    false,
    "requesting a score is what allowed the 0-1 probability to slip through",
  );
  assertEquals("risk_band" in props, true);
  const required: readonly string[] = ANALYSIS_SCHEMA.required;
  assertEquals(required.includes("risk_band"), true);
  assertEquals(required.includes("risk_score"), false);
});

Deno.test("the schema pins the band to a closed set the provider enforces", () => {
  const band = ANALYSIS_SCHEMA.properties.risk_band as Record<string, unknown>;
  assertEquals(band.enum, RISK_BANDS);
});

Deno.test("a numeric score in place of a band is rejected", () => {
  // The shape a model would emit if it ignored the enum entirely.
  assertEquals(MODEL_OUTPUT.safeParse({ ...base, risk_band: 0.9 }).success, false);
  assertEquals(MODEL_OUTPUT.safeParse({ ...base, risk_band: 90 }).success, false);
});

Deno.test("an out-of-range band name is rejected", () => {
  assertEquals(MODEL_OUTPUT.safeParse({ ...base, risk_band: "catastrophic" }).success, false);
  assertEquals(MODEL_OUTPUT.safeParse({ ...base, risk_band: "Safe" }).success, false);
});

Deno.test("every band the schema offers survives validation", () => {
  for (const band of RISK_BANDS) {
    assertEquals(MODEL_OUTPUT.safeParse({ ...base, risk_band: band }).success, true);
  }
});

Deno.test("a missing band is rejected rather than defaulting to safe", () => {
  // Defaulting would be the worst outcome: a response with no verdict at all
  // would read as "Safe".
  const { risk_band: _omitted, ...withoutBand } = base;
  assertEquals(MODEL_OUTPUT.safeParse(withoutBand).success, false);
});
