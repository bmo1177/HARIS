import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { XPProvider } from "@/lib/xpContext";
import Index from "./pages/Index.tsx";
import About from "./pages/About.tsx";
import Scenarios from "./pages/Scenarios.tsx";
import VoiceLab from "./pages/VoiceLab.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
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
);

export default App;
