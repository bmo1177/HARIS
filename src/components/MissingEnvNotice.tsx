import { missingEnv } from "@/lib/env";

/**
 * Shown instead of the app when the Supabase environment variables are absent.
 *
 * Without this the app renders a blank page: `createClient(undefined, undefined)`
 * throws while the module graph is still being evaluated, before React mounts,
 * so there is no error boundary in a position to catch it and nothing is logged
 * to the console in a way a newcomer would notice.
 */
const MissingEnvNotice = () => (
  <div className="min-h-screen bg-background flex items-center justify-center px-4 py-10">
    <div className="max-w-xl w-full space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-foreground">HARIS needs its environment variables</h1>
        <p className="text-muted-foreground mt-2">
          The app could not start because these variables are not set:
        </p>
      </div>

      <ul className="space-y-1 font-mono text-sm text-destructive">
        {missingEnv.map((name) => (
          <li key={name}>{name}</li>
        ))}
      </ul>

      <div className="rounded-lg border border-border bg-card p-4 space-y-3 text-sm">
        <p className="text-foreground">To fix it:</p>
        <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
          <li>
            Copy <code className="font-mono text-foreground">.env.example</code> to{" "}
            <code className="font-mono text-foreground">.env</code>
          </li>
          <li>
            Fill in <code className="font-mono text-foreground">VITE_SUPABASE_URL</code> and{" "}
            <code className="font-mono text-foreground">VITE_SUPABASE_PUBLISHABLE_KEY</code> from
            your Supabase project (Project Settings → API)
          </li>
          <li>Restart the dev server</li>
        </ol>
        <p className="text-muted-foreground">
          The backend also needs <code className="font-mono text-foreground">LLM_API_KEY</code> and{" "}
          <code className="font-mono text-foreground">SUPABASE_SERVICE_ROLE_KEY</code> as edge
          function secrets. See <code className="font-mono text-foreground">supabase/README.md</code>.
        </p>
      </div>
    </div>
  </div>
);

export default MissingEnvNotice;
