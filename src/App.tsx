// src/App.tsx
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { DataProvider } from "./context/DataContext";
import { AuthProvider } from "./context/AuthContext"; 
import { ProtectedRoute } from "./components/ProtectedRoute"; 
import Login from "./pages/Login"; 

// Importar nuevas páginas
import MainMenu from "./pages/MainMenu";
import ColdBlock from "./pages/ColdBlock";

import Overview from "./pages/Overview";
import MachineDetail from "./pages/MachineDetail";
import BatchComparison from "./pages/BatchComparison";
import CycleAnalysis from "./pages/CycleAnalysis";
import RecipeAnalysis from "./pages/RecipeAnalysis";
import PredictiveMaintenance from "./pages/PredictiveMaintenance";
import QualityConsistency from "./pages/QualityConsistency";
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

              {/* Ruta Raíz Protegida: Ahora es el Menú Principal */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <MainMenu />
                  </ProtectedRoute>
                }
              />

              {/* Ruta Bloque Frío */}
              <Route
                path="/bloque-frio"
                element={
                  <ProtectedRoute>
                    <ColdBlock />
                  </ProtectedRoute>
                }
              />

              {/* Rutas de Cocimientos (Hot Block) */}
              <Route
                path="/cocimientos"
                element={
                  <ProtectedRoute>
                    <Overview />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/cocimientos/maquinaria"
                element={
                  <ProtectedRoute>
                    <MachineDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/cocimientos/comparacion"
                element={
                  <ProtectedRoute>
                    <BatchComparison />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/cocimientos/ciclos"
                element={
                  <ProtectedRoute>
                    <CycleAnalysis />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/cocimientos/recetas"
                element={
                  <ProtectedRoute>
                    <RecipeAnalysis />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/cocimientos/mantenimiento"
                element={
                  <ProtectedRoute>
                    <PredictiveMaintenance />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/cocimientos/calidad"
                element={
                  <ProtectedRoute>
                    <QualityConsistency />
                  </ProtectedRoute>
                }
              />
              
              {/* Redirecciones de compatibilidad (por si alguien entra con la url vieja) */}
              <Route path="/machine-detail" element={<Navigate to="/cocimientos/maquinaria" replace />} />
              <Route path="/batch-comparison" element={<Navigate to="/cocimientos/comparacion" replace />} />
              <Route path="/cycle-analysis" element={<Navigate to="/cocimientos/ciclos" replace />} />
              <Route path="/machine" element={<Navigate to="/cocimientos/maquinaria" replace />} />
              <Route path="/comparison" element={<Navigate to="/cocimientos/comparacion" replace />} />
              <Route path="/cycles" element={<Navigate to="/cocimientos/ciclos" replace />} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </DataProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;