import { Link } from "react-router-dom";
import { Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/useI18n";

const NotFound = () => {
  const { t } = useI18n();
  // Previously a bare flex box with no `<main>`, no header to match the rest of
  // the app, and a raw `<a href="/">` that threw away client-side routing with a
  // full page reload.
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 py-8 text-center animate-fade-up motion-reduce:animate-none">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 shadow-panel">
          <Compass className="h-7 w-7 text-primary" aria-hidden="true" />
        </div>

        <div className="space-y-2">
          <p className="font-mono text-4xl font-semibold tabular-nums tracking-[-0.02em] text-foreground">404</p>
          <h1 className="text-balance text-xl font-semibold tracking-[-0.01em] text-foreground">
            {t("notFound.title")}
          </h1>
          <p className="mx-auto max-w-sm text-pretty text-muted-foreground">
            {t("notFound.body")}
          </p>
        </div>

        <div className="mt-2 flex flex-col gap-3 sm:flex-row">
          <Button asChild>
            <Link to="/">{t("notFound.home")}</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/scenarios">{t("notFound.scenarios")}</Link>
          </Button>
        </div>
    </div>
  );
};

export default NotFound;
