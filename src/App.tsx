import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ThemeProvider } from "@/components/ThemeProvider";
import { XPProvider } from "@/lib/xpContext";
import Index from "./pages/Index.tsx";
import About from "./pages/About.tsx";
import Scenarios from "./pages/Scenarios.tsx";
import VoiceLab from "./pages/VoiceLab.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

// Only Sonner is mounted. The Radix `<Toaster/>` was mounted alongside it but
// nothing ever called it, dragging in a second toast implementation
// (`ui/toaster.tsx`, `ui/toast.tsx`, `hooks/use-toast.ts`) for nothing.
const App = () => (
  <ErrorBoundary>
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Sonner />
          <BrowserRouter>
            <XPProvider>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/scenarios" element={<Scenarios />} />
                <Route path="/voice-lab" element={<VoiceLab />} />
                <Route path="/about" element={<About />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </XPProvider>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  </ErrorBoundary>
);

export default App;
