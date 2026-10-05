/**
 * Provider-agnostic structured-output client.
 *
 * Replaces the hardcoded `https://ai.gateway.lovable.dev` + `LOVABLE_API_KEY`
 * pair, which made the backend impossible to run or deploy without a Lovable
 * account. The new configuration is plain OpenAI-compatible HTTP, so any of
 * OpenRouter, OpenAI, Together, Groq, a self-hosted vLLM, or Ollama works by
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

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function retryAfterMs(response: Response): number {
  const header = response.headers.get("retry-after");
  if (!header) return 1_500;
  const seconds = Number.parseInt(header, 10);
  return Number.isFinite(seconds) && seconds >= 0 ? Math.min(seconds * 1_000, 10_000) : 1_500;
}

async function requestCompletion(body: Record<string, unknown>): Promise<Response> {
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
    signal: AbortSignal.timeout(llm.timeoutMs),
  });
}

/**
 * Calls the model and returns the raw parsed JSON object.
 *
 * Throws `UpstreamError` for every failure mode; callers should not attempt to
 * distinguish provider-specific codes.
 */
export async function generateStructured(call: StructuredCall): Promise<unknown> {
  const { llm } = getConfig();

  const body: Record<string, unknown> = {
    model: llm.model,
    temperature: 0.2,
    max_tokens: call.maxTokens ?? llm.maxTokens,
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

  let response: Response | null = null;

  // One retry for transient upstream failures. Not more: a student staring at
  // a spinner for 40 seconds is a worse outcome than an error message.
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      response = await requestCompletion(body);
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      const timedOut = error instanceof DOMException && error.name === "TimeoutError";
      if (attempt === 0) {
        console.warn(`llm request failed (${timedOut ? "timeout" : "network"}), retrying:`, reason);
        await sleep(600);
        continue;
      }
      throw new UpstreamError(`llm transport failure: ${reason}`, 504, true);
    }

    if (response.ok) break;

    if (RETRYABLE_STATUSES.has(response.status) && attempt === 0) {
      await sleep(retryAfterMs(response));
      continue;
    }

    // Drain the body so the connection can be reused, but only log a prefix:
    // upstream error bodies can echo back the prompt.
    const detail = (await response.text()).slice(0, 500);
    throw new UpstreamError(
      `llm responded ${response.status}: ${detail}`,
      response.status,
      RETRYABLE_STATUSES.has(response.status),
    );
  }

  if (response === null) {
    throw new UpstreamError("llm produced no response", 504, true);
  }

  let payload: ChatCompletionResponse;
  try {
    payload = (await response.json()) as ChatCompletionResponse;
  } catch {
    throw new UpstreamError("llm returned a non-JSON body", 502, false);
  }

  if (payload.error) {
    throw new UpstreamError(`llm error: ${payload.error.message ?? "unknown"}`, 502, false);
  }

  const content = payload.choices?.[0]?.message?.content;
  if (typeof content !== "string" || content.trim() === "") {
    throw new UpstreamError("llm returned no content", 502, false);
  }

  try {
    return JSON.parse(content);
  } catch {
    throw new UpstreamError("llm content was not valid JSON", 502, false);
  }
}
