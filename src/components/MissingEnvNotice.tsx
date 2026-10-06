import { missingEnv } from "@/lib/env";
import { useI18n } from "@/lib/useI18n";

/**
 * Shown instead of the app when the Supabase environment variables are absent.
 *
 * Without this the app renders a blank page: `createClient(undefined, undefined)`
 * throws while the module graph is still being evaluated, before React mounts,
 * so there is no error boundary in a position to catch it and nothing is logged
 * to the console in a way a newcomer would notice.
 */
const MissingEnvNotice = () => {
  const { t } = useI18n();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-10">
      <div className="max-w-xl w-full space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("setup.title")}</h1>
          <p className="mt-2 text-muted-foreground">{t("setup.body")}</p>
        </div>

        <ul className="space-y-1 font-mono text-sm text-destructive">
          {missingEnv.map((name) => (
            <li key={name}>{name}</li>
          ))}
        </ul>

        <div className="rounded-lg border border-border bg-card p-4 space-y-3 text-sm">
          <p className="text-foreground">To fix it:</p>
          <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
            <li>{t("setup.step1")}</li>
            <li>{t("setup.step2")}</li>
            <li>{t("setup.step3")}</li>
          </ol>
          <p className="text-muted-foreground">{t("setup.backend")}</p>
        </div>
      </div>
    </div>
  );
};

export default MissingEnvNotice;