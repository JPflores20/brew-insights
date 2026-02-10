import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { DataProvider } from "./context/DataContext";
import { AuthProvider } from "./context/AuthContext"; 
import { ProtectedRoute } from "./components/ProtectedRoute"; 
import Login from "./pages/Login"; 

import Overview from "./pages/Overview";
import MachineDetail from "./pages/MachineDetail";
import BatchComparison from "./pages/BatchComparison";
import CycleAnalysis from "./pages/CycleAnalysis";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <DataProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Login Público */}
              <Route path="/login" element={<Login />} />

              {/* Rutas Privadas */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Overview />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/machine-detail"
                element={
                  <ProtectedRoute>
                    <MachineDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/batch-comparison"
                element={
                  <ProtectedRoute>
                    <BatchComparison />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/cycle-analysis"
                element={
                  <ProtectedRoute>
                    <CycleAnalysis />
                  </ProtectedRoute>
                }
              />
              <Route path="/machine" element={<Navigate to="/machine-detail" replace />} />
              <Route path="/comparison" element={<Navigate to="/batch-comparison" replace />} />
              <Route path="/cycles" element={<Navigate to="/cycle-analysis" replace />} />
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </DataProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;