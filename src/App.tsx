import { Suspense, lazy } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Layout from "@/components/Layout";
import { ThemeProvider } from "@/components/ThemeProvider";
import { XPProvider } from "@/lib/xpContext";
import Index from "@/pages/Index.tsx";

/*
 * Route-level code splitting.
 *
 * The three training modules are independent: a student who only ever analyses
 * messages has no reason to download the voice-lab player, the scenario data, or
 * Arabic scenario content. Splitting on navigation moves that cost off the first
 * paint, which is the load that matters on a school connection.
 */
const Scenarios = lazy(() => import("@/pages/Scenarios.tsx"));
const VoiceLab = lazy(() => import("@/pages/VoiceLab.tsx"));
const About = lazy(() => import("@/pages/About.tsx"));
const NotFound = lazy(() => import("@/pages/NotFound.tsx"));

const RouteFallback = () => (
  <div className="flex min-h-[40vh] items-center justify-center" role="status" aria-live="polite">
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      Loading...
    </div>
  </div>
);

// Only Sonner is mounted. The Radix `<Toaster/>` was mounted alongside it but
// nothing ever called it, dragging in a second toast implementation
// (`ui/toaster.tsx`, `ui/toast.tsx`, `hooks/use-toast.ts`) for nothing.
const App = () => (
  <ErrorBoundary>
    <ThemeProvider>
      <>
        <TooltipProvider>
          <Sonner />
          <BrowserRouter>
            <XPProvider>
              <Routes>
                <Route element={<Layout />}>
                  <Route path="/" element={<Index />} />
                  <Route
                    path="/scenarios"
                    element={
                      <Suspense fallback={<RouteFallback />}>
                        <Scenarios />
                      </Suspense>
                    }
                  />
                  <Route
                    path="/voice-lab"
                    element={
                      <Suspense fallback={<RouteFallback />}>
                        <VoiceLab />
                      </Suspense>
                    }
                  />
                  <Route
                    path="/about"
                    element={
                      <Suspense fallback={<RouteFallback />}>
                        <About />
                      </Suspense>
                    }
                  />
                  <Route
                    path="*"
                    element={
                      <Suspense fallback={<RouteFallback />}>
                        <NotFound />
                      </Suspense>
                    }
                  />
                </Route>
              </Routes>
            </XPProvider>
          </BrowserRouter>
        </TooltipProvider>
      </>
    </ThemeProvider>
  </ErrorBoundary>
);

export default App;
