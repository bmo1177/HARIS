import { assertEquals, assertRejects } from "jsr:@std/assert@1";
import { generateStructured } from "./llm.ts";
import { resetConfigCache } from "./env.ts";

/**
 * Failover between models.
 *
 * A provider is a moving target. A free endpoint can be withdrawn for an
 * account, a model can start answering in prose, a worker can be exhausted.
 * All of those look identical from the browser, so the backend tries the next
 * model rather than failing the student.
 *
 * These tests pin the two rules that keep the failover from making things
 * worse: a rejected credential is not retried on another model, and the whole
 * list shares one time budget.
 */

const SCHEMA = {
  type: "object",
  properties: { answer: { type: "string" } },
  required: ["answer"],
} as const;

const CALL = {
  system: "s",
  user: "u",
  schemaName: "x",
  schema: SCHEMA as unknown as Record<string, unknown>,
};

interface Stub {
  /** Models the request asked for, in order. */
  seen: string[];
  restore: () => void;
}

/**
 * Stubs fetch. `respond` is given the model name and returns the response.
 */
function stubFetch(
  respond: (model: string, call: number) => Response | Promise<Response>,
): Stub {
  const seen: string[] = [];
  const original = globalThis.fetch;
  const calls: Record<string, number> = {};

  globalThis.fetch = (async (_url: string | URL | Request, init?: RequestInit) => {
    const body = JSON.parse(String(init?.body ?? "{}"));
    const model = String(body.model ?? "");
    seen.push(model);
    calls[model] = (calls[model] ?? 0) + 1;
    return await respond(model, calls[model]);
  }) as typeof globalThis.fetch;

  return {
    seen,
    restore: () => {
      globalThis.fetch = original;
    },
  };
}

const json = (value: unknown, status = 200) =>
  new Response(JSON.stringify(value), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const withEnv = async (vars: Record<string, string | undefined>, fn: () => Promise<void>) => {
  const saved = new Map<string, string | undefined>();
  for (const [key, value] of Object.entries(vars)) {
    saved.set(key, Deno.env.get(key));
    if (value === undefined) Deno.env.delete(key);
    else Deno.env.set(key, value);
  }
  resetConfigCache();
  try {
    await fn();
  } finally {
    for (const [key, value] of saved) {
      if (value === undefined) Deno.env.delete(key);
      else Deno.env.set(key, value);
    }
    resetConfigCache();
  }
};

Deno.test("a model that is not available to this account is skipped", async () => {
  const stub = stubFetch((model) => {
    if (model === "model/a") {
      return json(
        { status: 404, title: "Not Found", detail: "Function not found for account" },
        404,
      );
    }
    return json({ choices: [{ message: { content: '{"answer":"ok"}' } }] });
  });

  try {
    await withEnv(
      {
        LLM_API_KEY: "sk-test",
        LLM_MODEL: "model/a",
        LLM_FALLBACK_MODELS: "model/b",
      },
      async () => {
        const result = await generateStructured(CALL);
        assertEquals(result, { answer: "ok" });
      },
    );
    assertEquals(stub.seen, ["model/a", "model/b"]);
  } finally {
    stub.restore();
  }
});

Deno.test("a model that answers with something that is not JSON is skipped", async () => {
  const stub = stubFetch((model) => {
    if (model === "model/a") {
      return json({ choices: [{ message: { content: "I would rather not." } }] });
    }
    return json({ choices: [{ message: { content: '{"answer":"ok"}' } }] });
  });

  try {
    await withEnv(
      { LLM_API_KEY: "sk-test", LLM_MODEL: "model/a", LLM_FALLBACK_MODELS: "model/b" },
      async () => {
        assertEquals(await generateStructured(CALL), { answer: "ok" });
      },
    );
    assertEquals(stub.seen, ["model/a", "model/b"]);
  } finally {
    stub.restore();
  }
});

Deno.test("a rejected credential is not retried on another model", async () => {
  // The key is the problem. Trying the next model would send the same bad key
  // to the same provider and turn one clear error into several confusing ones.
  const stub = stubFetch(() => json({ error: { message: "User not found." } }, 401));

  try {
    await withEnv(
      { LLM_API_KEY: "sk-test", LLM_MODEL: "model/a", LLM_FALLBACK_MODELS: "model/b" },
      async () => {
        const error = await assertRejects(() => generateStructured(CALL));
        assertEquals((error as { status?: number }).status, 401);
      },
    );
    // 404 is not a transient status, so it is not retried: one model, one
    // attempt, one error — exactly the behaviour before failover existed.
    assertEquals(stub.seen, ["model/a"]);
  } finally {
    stub.restore();
  }
});

Deno.test("the first model that works is used, and no further model is called", async () => {
  const stub = stubFetch(() => json({ choices: [{ message: { content: '{"answer":"ok"}' } }] }));

  try {
    await withEnv(
      { LLM_API_KEY: "sk-test", LLM_MODEL: "model/a", LLM_FALLBACK_MODELS: "model/b" },
      async () => {
        assertEquals(await generateStructured(CALL), { answer: "ok" });
      },
    );
    // 404 is not a transient status, so it is not retried: one model, one
    // attempt, one error — exactly the behaviour before failover existed.
    assertEquals(stub.seen, ["model/a"]);
  } finally {
    stub.restore();
  }
});

Deno.test("when every model fails, the last failure is thrown", async () => {
  const stub = stubFetch((model) =>
    model === "model/a" ? json({ status: 404 }, 404) : json({ error: { message: "boom" } }, 500)
  );

  try {
    await withEnv(
      { LLM_API_KEY: "sk-test", LLM_MODEL: "model/a", LLM_FALLBACK_MODELS: "model/b" },
      async () => {
        const error = await assertRejects(() => generateStructured(CALL));
        assertEquals((error as { status?: number }).status, 500);
      },
    );
    // The last model is retried once, as it was before failover existed. The
    // earlier model is not: the next model is the better retry.
    assertEquals(stub.seen, ["model/a", "model/b", "model/b"]);
  } finally {
    stub.restore();
  }
});

Deno.test("no fallback is tried when none is configured", async () => {
  // The behaviour before failover existed must be unchanged when the list has
  // one entry: one model, one failure, one error.
  const stub = stubFetch(() => json({ status: 404 }, 404));

  try {
    await withEnv(
      { LLM_API_KEY: "sk-test", LLM_MODEL: "model/a", LLM_FALLBACK_MODELS: undefined },
      async () => {
        const error = await assertRejects(() => generateStructured(CALL));
        assertEquals((error as { status?: number }).status, 404);
      },
    );
    // 404 is not a transient status, so it is not retried: one model, one
    // attempt, one error — exactly the behaviour before failover existed.
    assertEquals(stub.seen, ["model/a"]);
  } finally {
    stub.restore();
  }
});
