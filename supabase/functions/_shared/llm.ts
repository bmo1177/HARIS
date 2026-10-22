/**
 * Provider-agnostic structured-output client.
 *
 * The backend used to be pinned to a single proprietary AI gateway and its
 * bespoke API key, which made it impossible to run or deploy without an account
 * on that one service. Configuration is now plain OpenAI-compatible HTTP, so any
 * of OpenRouter, OpenAI, Together, Groq, a self-hosted vLLM, or Ollama works by
 * changing three environment variables.
 *
 * Deliberate change: the old code used `tool_choice` forced to a single
 * function. Forcing a tool call removes the model's ability to decline, which
 * means an injected instruction reliably produces attacker-chosen arguments. We
 * now request a provider-enforced JSON Schema instead, and re-validate the
 * result server-side before it is returned to anyone.
 */

import { getConfig, UpstreamError } from "./env.ts";

export interface StructuredCall {
  system: string;
  user: string;
  schemaName: string;
  schema: Record<string, unknown>;
  /** Overrides the configured token ceiling for unusually long outputs. */
  maxTokens?: number;
}

interface ChatCompletionResponse {
  choices?: Array<{ message?: { content?: string | null } }>;
  error?: { message?: string };
}

const RETRYABLE_STATUSES = new Set([408, 425, 429, 500, 502, 503, 504]);

/**
 * Statuses that mean no other model will do better.
 *
 * 401 and 403 are the provider refusing *our* credentials. Trying the next
 * model would send the same bad key to the same provider and turn one clear
 * error into N confusing ones.
 *
 * Everything else is worth another model: 404 because a free endpoint is
 * provisioned per account and the model may simply not be available to this
 * key; 400 because a model that rejects the strict schema cannot serve this
 * app at all; 5xx and timeouts because they are usually one model's problem.
 */
const TERMINAL_STATUSES = new Set([401, 403]);

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function retryAfterMs(response: Response): number {
  const header = response.headers.get("retry-after");
  if (!header) return 1_500;
  const seconds = Number.parseInt(header, 10);
  return Number.isFinite(seconds) && seconds >= 0 ? Math.min(seconds * 1_000, 10_000) : 1_500;
}

async function requestCompletion(
  body: Record<string, unknown>,
  timeoutMs: number,
): Promise<Response> {
  const { llm } = getConfig();

  return await fetch(`${llm.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${llm.apiKey}`,
      "Content-Type": "application/json",
      // Recommended by OpenRouter for attribution on shared infrastructure.
      "HTTP-Referer": "https://github.com/bmo1177/HARIS",
      "X-Title": "HARIS",
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs),
  });
}

/** The request body, for a specific model. */
function buildBody(
  call: StructuredCall,
  model: string,
  maxTokens: number,
): Record<string, unknown> {
  return {
    model,
    temperature: 0.2,
    max_tokens: maxTokens,
    messages: [
      { role: "system", content: call.system },
      { role: "user", content: call.user },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: call.schemaName,
        strict: true,
        schema: call.schema,
      },
    },
  };
}

/**
 * One attempt at one model.
 *
 * `allowRetry` is true only for the last model in the list. The single retry
 * for transient upstream failures existed because there was one model and a
 * blip should not fail the student. With a list, the *next model* is the
 * better retry: it is a different server, and waiting on the same one twice
 * spends the budget the fallback needed.
 *
 * Returns the parsed JSON object.
 */
async function callOneModel(
  call: StructuredCall,
  model: string,
  maxTokens: number,
  timeoutMs: number,
  allowRetry: boolean,
): Promise<unknown> {
  const body = buildBody(call, model, maxTokens);

  let response: Response | null = null;

  const attempts = allowRetry ? 2 : 1;
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      response = await requestCompletion(body, timeoutMs);
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      const timedOut = error instanceof DOMException &&
        error.name === "TimeoutError";
      if (attempt === 0 && attempts > 1) {
        console.warn(
          `llm request to ${model} failed (${timedOut ? "timeout" : "network"}), retrying:`,
          reason,
        );
        await sleep(600);
        continue;
      }
      throw new UpstreamError(
        `llm transport failure for ${model}: ${reason}`,
        504,
        true,
      );
    }

    if (response.ok) break;

    if (RETRYABLE_STATUSES.has(response.status) && attempt === 0 && attempts > 1) {
      await sleep(retryAfterMs(response));
      continue;
    }

    // Drain the body so the connection can be reused, but only log a prefix:
    // upstream error bodies can echo back the prompt.
    const detail = (await response.text()).slice(0, 500);
    throw new UpstreamError(
      `llm responded ${response.status} for ${model}: ${detail}`,
      response.status,
      RETRYABLE_STATUSES.has(response.status),
    );
  }

  if (response === null) {
    throw new UpstreamError(`llm produced no response for ${model}`, 504, true);
  }

  let payload: ChatCompletionResponse;
  try {
    payload = (await response.json()) as ChatCompletionResponse;
  } catch {
    throw new UpstreamError(`llm returned a non-JSON body for ${model}`, 502, false);
  }

  if (payload.error) {
    throw new UpstreamError(
      `llm error for ${model}: ${payload.error.message ?? "unknown"}`,
      502,
      false,
    );
  }

  const content = payload.choices?.[0]?.message?.content;
  if (typeof content !== "string" || content.trim() === "") {
    // A model that answers with nothing is not usable, and the failure is the
    // model's rather than the student's.
    throw new UpstreamError(`llm returned no content for ${model}`, 502, false);
  }

  try {
    return JSON.parse(content);
  } catch {
    throw new UpstreamError(
      `llm content was not valid JSON for ${model}`,
      502,
      false,
    );
  }
}

/**
 * Calls the model and returns the raw parsed JSON object.
 *
 * Tries each configured model in turn and returns the first usable answer. A
 * model is skipped when it is unavailable to this account, when it rejects the
 * schema, when it times out, or when it answers with something that is not the
 * requested JSON. The last failure is thrown if every model fails.
 *
 * Two rules keep the failover from making things worse:
 *
 *   - A rejected credential (401/403) is not retried on another model. The key
 *     is the problem, and every model is behind the same key.
 *   - The whole list shares one time budget, so a list of slow models cannot
 *     hold a student behind a spinner for longer than one model would have.
 */
export async function generateStructured(
  call: StructuredCall,
): Promise<unknown> {
  const { llm } = getConfig();
  const maxTokens = call.maxTokens ?? llm.maxTokens;
  const deadline = Date.now() + llm.totalTimeoutMs;

  let lastError: UpstreamError | null = null;

  for (let i = 0; i < llm.models.length; i++) {
    const model = llm.models[i];
    const remaining = deadline - Date.now();

    if (remaining <= 0) {
      console.warn(
        `llm total budget of ${llm.totalTimeoutMs}ms exhausted before trying ${model}`,
      );
      break;
    }

    // The last model gets whatever is left, so a slow first model cannot make
    // the fallback impossible.
    const isLast = i === llm.models.length - 1;
    const timeoutMs = isLast ? remaining : Math.min(llm.timeoutMs, remaining);

    try {
      return await callOneModel(call, model, maxTokens, timeoutMs, isLast);
    } catch (error) {
      if (!(error instanceof UpstreamError)) throw error;

      // The provider refused our credentials. No other model will do better.
      if (TERMINAL_STATUSES.has(error.status)) throw error;

      lastError = error;
      console.warn(
        `llm model ${model} failed (${error.message.slice(0, 160)}), ` +
          (isLast ? "no fallback left" : `trying ${llm.models[i + 1]}`),
      );
    }
  }

  throw lastError ?? new UpstreamError("no model configured", 502, false);
}
