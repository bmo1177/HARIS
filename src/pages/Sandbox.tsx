import { Suspense, lazy } from "react";
import { ShieldAlert } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useI18n } from "@/lib/i18n";

const RedSandbox = lazy(() => import("@/sandbox/RedSandbox"));
const BlueWorkshop = lazy(() => import("@/sandbox/BlueWorkshop"));
const SandboxSpec = lazy(() => import("@/sandbox/SandboxSpec"));

const TabFallback = () => (
  <div className="flex min-h-[20vh] items-center justify-center" role="status" aria-live="polite">
    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
  </div>
);

/**
 * Prompt Injection Sandbox: Red Team offense, Blue Team defense, and the
 * specification both modes implement. The tabs are independent — a student who
 * only attacks never downloads the workshop — so each mode loads on demand.
 */
const Sandbox = () => {
  const { t } = useI18n();

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">{t("sandbox.title")}</h1>
        <p className="text-muted-foreground">{t("sandbox.subtitle")}</p>
        <p className="flex items-start gap-2 rounded-lg border border-border bg-card p-3 text-sm text-muted-foreground">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {t("sandbox.safety")}
        </p>
      </div>

      <Tabs defaultValue="red">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="red">{t("sandbox.redTab")}</TabsTrigger>
          <TabsTrigger value="blue">{t("sandbox.blueTab")}</TabsTrigger>
          <TabsTrigger value="spec">{t("sandbox.specTab")}</TabsTrigger>
        </TabsList>
        <TabsContent value="red">
          <Suspense fallback={<TabFallback />}>
            <RedSandbox />
          </Suspense>
        </TabsContent>
        <TabsContent value="blue">
          <Suspense fallback={<TabFallback />}>
            <BlueWorkshop />
          </Suspense>
        </TabsContent>
        <TabsContent value="spec">
          <Suspense fallback={<TabFallback />}>
            <SandboxSpec />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Sandbox;
