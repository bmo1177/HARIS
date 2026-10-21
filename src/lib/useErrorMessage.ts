import { useCallback } from "react";
import { HarisError, type HarisErrorCode } from "@/lib/api";
import type { MessageKey } from "@/locales/en";
import { useI18n } from "@/lib/useI18n";

/**
 * One locale key per error code the API client can produce.
 *
 * The server returns a fixed English sentence per code (`SAFE_MESSAGE` in
 * `_shared/http.ts`), and the client used to render that sentence verbatim in
 * every locale — so an Arabic student saw an Arabic UI and an English toast.
 * The code is part of the contract, so it is the right thing to translate. The
 * `Record` is exhaustive: adding a code to `HarisErrorCode` without a key here
 * is a compile error.
 */
const KEY_BY_CODE: Record<HarisErrorCode, MessageKey> = {
  invalid_request: "error.invalid_request",
  rate_limited: "error.rate_limited",
  service_unavailable: "error.service_unavailable",
  provider_unauthorized: "error.provider_unauthorized",
  upstream_error: "error.upstream_error",
  internal_error: "error.internal_error",
  network_error: "error.network_error",
  timeout: "error.timeout",
  invalid_response: "error.invalid_response",
};

/**
 * Returns a function that turns anything thrown into a user-facing, localised
 * message. Lives in a hook because it needs the active locale; pure callers can
 * still use `errorMessage` directly.
 */
export function useErrorMessage(): (error: unknown) => string {
  const { t, formatNumber } = useI18n();

  return useCallback(
    (error: unknown) => {
      if (error instanceof HarisError) {
        // A rate limit knows exactly when it lifts. Saying "try again in 20
        // seconds" tells a student to wait; "try again" tells them to give up.
        if (error.code === "rate_limited" && error.retryAfterSeconds) {
          return t("error.rate_limited_wait", {
            seconds: formatNumber(error.retryAfterSeconds),
          });
        }
        return t(KEY_BY_CODE[error.code]);
      }
      // Anything else is a programming mistake rather than a modelled failure.
      // Show the localized generic copy and keep the detail in the console:
      // a raw stack message ("undefined is not a function") is not something a
      // student can act on, and it used to reach them in English.
      console.error("Unexpected error surfaced to the user:", error);
      return t("error.internal_error");
    },
    [t, formatNumber],
  );
}
