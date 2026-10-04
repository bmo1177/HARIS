import { assertEquals, assertThrows } from "jsr:@std/assert@1";
import { RequestError } from "./http.ts";
import {
  analyzeMessageRequest,
  parseRequest,
  scenarioFeedbackRequest,
  voiceDebriefRequest,
} from "./schemas.ts";

const parse = <T extends Parameters<typeof parseRequest>[0]>(
  schema: T,
  value: unknown,
) => parseRequest(schema, value);

Deno.test("analyzeMessageRequest trims the message", () => {
  const result = parse(analyzeMessageRequest, { message: "  hello  " });
  assertEquals(result.message, "hello");
});

Deno.test("analyzeMessageRequest rejects an empty or whitespace-only message", () => {
  for (const message of ["", "   ", "\n\t"]) {
    assertThrows(() => parse(analyzeMessageRequest, { message }), RequestError);
  }
});

Deno.test("analyzeMessageRequest rejects a missing message", () => {
  assertThrows(() => parse(analyzeMessageRequest, {}), RequestError);
  assertThrows(
    () => parse(analyzeMessageRequest, { message: 42 }),
    RequestError,
  );
});

Deno.test("analyzeMessageRequest caps message length", () => {
  // An unbounded field on an unmetered endpoint is an unbounded token bill.
  assertThrows(
    () => parse(analyzeMessageRequest, { message: "a".repeat(2_001) }),
    RequestError,
  );
  assertEquals(
    parse(analyzeMessageRequest, { message: "a".repeat(2_000) }).message.length,
    2_000,
  );
});

Deno.test("scenarioFeedbackRequest rejects out-of-range step numbers", () => {
  const base = {
    scenarioTitle: "Test",
    stepNumber: 1,
    attackerMessage: "hello",
    userChoice: "no thanks",
  };

  assertThrows(
    () => parse(scenarioFeedbackRequest, { ...base, stepNumber: 0 }),
    RequestError,
  );
  assertThrows(
    () => parse(scenarioFeedbackRequest, { ...base, stepNumber: 21 }),
    RequestError,
  );
  assertEquals(parse(scenarioFeedbackRequest, base).stepNumber, 1);
});

Deno.test("scenarioFeedbackRequest ignores the removed choiceType field", () => {
  // The old API told the model the answer. The field is no longer part of the
  // contract, and a stale client sending it must not break.
  const result = parse(scenarioFeedbackRequest, {
    scenarioTitle: "Test",
    stepNumber: 1,
    attackerMessage: "hello",
    userChoice: "no thanks",
    choiceType: "safe",
  });

  assertEquals(result, {
    scenarioTitle: "Test",
    stepNumber: 1,
    attackerMessage: "hello",
    userChoice: "no thanks",
  });
});

const debrief = {
  callTitle: "You Won a Free Phone",
  totalFlags: 3,
  caughtFlags: 2,
  missedFlags: 1,
  flagDetails: [
    {
      lineNumber: 1,
      text: "You won a prize",
      isRedFlag: true,
      userFlagged: true,
    },
    { lineNumber: 2, text: "Send 75 QAR", isRedFlag: true, userFlagged: true },
    {
      lineNumber: 3,
      text: "Do not tell anyone",
      isRedFlag: true,
      userFlagged: false,
    },
  ],
};

Deno.test("voiceDebriefRequest accepts internally consistent counters", () => {
  assertEquals(parse(voiceDebriefRequest, debrief).caughtFlags, 2);
});

Deno.test("voiceDebriefRequest rejects caught + missed that do not sum to total", () => {
  assertThrows(
    () =>
      parse(voiceDebriefRequest, {
        ...debrief,
        caughtFlags: 3,
        missedFlags: 3,
      }),
    RequestError,
  );
});

Deno.test("voiceDebriefRequest rejects caughtFlags above totalFlags", () => {
  assertThrows(
    () =>
      parse(voiceDebriefRequest, {
        ...debrief,
        totalFlags: 1,
        caughtFlags: 3,
        missedFlags: 1,
      }),
    RequestError,
  );
});

Deno.test("voiceDebriefRequest rejects counters that contradict the flag details", () => {
  // Previously a caller could claim any score it liked and the model would
  // narrate it back: "caught 3 of 3, flawless instinct".
  assertThrows(
    () =>
      parse(voiceDebriefRequest, {
        ...debrief,
        caughtFlags: 3,
        missedFlags: 0,
      }),
    RequestError,
  );
});

Deno.test("voiceDebriefRequest rejects unbounded flag detail arrays", () => {
  const many = Array.from({ length: 51 }, (_, i) => ({
    lineNumber: i + 1,
    text: "line",
    isRedFlag: false,
    userFlagged: false,
  }));

  assertThrows(
    () => parse(voiceDebriefRequest, { ...debrief, flagDetails: many }),
    RequestError,
  );
});

Deno.test("validation failures never echo the submitted payload", () => {
  const secret = "super-secret-attempt";
  try {
    parse(analyzeMessageRequest, { message: secret.repeat(3_000) });
    throw new Error("expected a RequestError");
  } catch (error) {
    assertEquals(error instanceof RequestError, true);
    assertEquals((error as RequestError).message.includes(secret), false);
  }
});
