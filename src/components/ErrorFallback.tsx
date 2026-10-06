import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/useI18n";

/**
 * Localized fallback UI for {@link ErrorBoundary}.
 *
 * Split out because the boundary itself is a class component and cannot call
 * hooks, and the strings need to come from the dictionary like everything else.
 */
export const ErrorFallback = ({
  onRetry,
  onReload,
}: {
  onRetry: () => void;
  onReload: () => void;
}) => {
  const { t } = useI18n();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-4 text-center">
        <h1 className="text-2xl font-bold text-foreground">{t("error.title")}</h1>
        <p className="text-muted-foreground">{t("error.body")}</p>
        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          <Button onClick={onRetry} variant="outline" className="gap-2">
            <RotateCcw className="w-4 h-4" aria-hidden="true" />
            {t("error.retry")}
          </Button>
          <Button onClick={onReload}>{t("error.reload")}</Button>
        </div>
      </div>
    </div>
  );
};
