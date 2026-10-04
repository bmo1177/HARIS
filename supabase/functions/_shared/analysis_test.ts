import { assertEquals } from "jsr:@std/assert@1";
import { MODEL_OUTPUT, reconcile, RISK_DANGEROUS, RISK_SUSPICIOUS } from "./analysis.ts";

/** A well-formed model response that the tests then perturb one field at a time. */
const base = {
  risk_score: 80,
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

Deno.test("derive risk_level from risk_score at both thresholds", () => {
  assertEquals(reconcile(model({ risk_score: RISK_DANGEROUS })).risk_level, "Dangerous");
  assertEquals(reconcile(model({ risk_score: RISK_DANGEROUS + 1 })).risk_level, "Dangerous");
  assertEquals(reconcile(model({ risk_score: RISK_SUSPICIOUS })).risk_level, "Suspicious");
  assertEquals(reconcile(model({ risk_score: RISK_SUSPICIOUS - 1 })).risk_level, "Safe");
  assertEquals(reconcile(model({ risk_score: 0 })).risk_level, "Safe");
});

Deno.test("risk_level and is_threat are consistent by construction", () => {
  for (const score of [0, 24, 25, 40, 64, 65, 100]) {
    const result = reconcile(model({ risk_score: score }));
    assertEquals(result.is_threat, result.risk_level !== "Safe");
    if (result.risk_level === "Safe") {
      assertEquals(result.is_threat, false);
    }
  }
});

Deno.test("clamp risk_score into 0..100", () => {
  assertEquals(reconcile(model({ risk_score: -50 })).risk_score, 0);
  assertEquals(reconcile(model({ risk_score: 5000 })).risk_score, 100);
});

Deno.test("round fractional scores", () => {
  assertEquals(reconcile(model({ risk_score: 66.4 })).risk_score, 66);
  assertEquals(reconcile(model({ risk_score: 66.6 })).risk_score, 67);
});

Deno.test("a Safe verdict never keeps an attack category", () => {
  // The coherence case: a low score with "Phishing" attached. The derived score
  // wins, because the category is model-authored and the score is not.
  const result = reconcile(model({ risk_score: 5, attack_type: "Phishing" }));
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

Deno.test("a non-numeric risk_score is rejected at the schema", () => {
  assertEquals(MODEL_OUTPUT.safeParse({ ...base, risk_score: "high" }).success, false);
  assertEquals(MODEL_OUTPUT.safeParse({ ...base, risk_score: null }).success, false);
});
