import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LeadsProvider } from "@/contexts/LeadsContext";
import { CRMLayout } from "@/components/crm/CRMLayout";
import DashboardPage from "@/pages/DashboardPage";
import LeadsPage from "@/pages/LeadsPage";
import PipelinePage from "@/pages/PipelinePage";
import MapPage from "@/pages/MapPage";
import CalendarPage from "@/pages/CalendarPage";
import ReportsPage from "@/pages/ReportsPage";
import ConfigurateurPage from "@/pages/ConfigurateurPage";
import ReseauPage from "@/pages/ReseauPage";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <LeadsProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <CRMLayout>
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/leads" element={<LeadsPage />} />
              <Route path="/pipeline" element={<PipelinePage />} />
              <Route path="/carte" element={<MapPage />} />
              <Route path="/calendrier" element={<CalendarPage />} />
              <Route path="/rapports" element={<ReportsPage />} />
              <Route path="/configurateur" element={<ConfigurateurPage />} />
              <Route path="/reseau" element={<ReseauPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </CRMLayout>
        </BrowserRouter>
      </LeadsProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
