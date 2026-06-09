
/**
 * App.tsx
 * -------
 * Punto de entrada principal de React para la aplicación web.
 * Aquí se configuran:
 * 1. Los "Providers" (Proveedores) globales como QueryClient, Auth y Data.
 * 2. El enrutamiento (React Router) definiendo qué componente cargar en cada URL.
 * 3. Las rutas protegidas (ProtectedRoute) basadas en los roles del usuario.
 */
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { DataProvider } from "./context/data_context";
import { AuthProvider } from "./context/auth_context"; 
import { ProtectedRoute } from "./components/protected_route"; 
import Login from "./pages/login"; 
import MainMenu from "./pages/main_menu";
import ColdBlock from "./pages/cold_block";
import Overview from "./pages/overview";
import MachineDetail from "./pages/machine_detail";
import BatchComparison from "./pages/batch_comparison";
import CycleAnalysis from "./pages/cycle_analysis";
import RecipeAnalysis from "./pages/recipe_analysis";
import PredictiveMaintenance from "./pages/predictive_maintenance";
import QualityConsistency from "./pages/quality_consistency";
import Indicadores from "./pages/indicadores";
import NotFound from "./pages/not_found";
import Admin from "./pages/admin";
// QueryClient se encarga de manejar el caché y las peticiones asíncronas de datos (usando React Query)
const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <DataProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          {/* Inicia la configuración de Rutas (URLs de la app) */}
          <BrowserRouter>
            <Routes>
              {/* Ruta de Administración (Solo para rol 'admin') */}
              <Route path="/admin" 
                element={ 
                  <ProtectedRoute allowedRoles={['admin']}> 
                  <Admin /> 
                  </ProtectedRoute> 
                } 
              />
              
              {/* Ruta Pública: Login */}
              <Route path="/login" element={<Login />} />
              
              {/* Ruta Raíz: Menú Principal (Protegida) */}
              <Route
                path="/"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <MainMenu />
                  </ProtectedRoute>
                }
              />
              {}
              <Route
                path="/bloque-frio"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'cold_block']}>
                    <ColdBlock />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/bloque-frio/fermentacion"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'cold_block']}>
                    <ColdBlock />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/bloque-frio/historico"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'cold_block']}>
                    <ColdBlock />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/bloque-frio/comparativo"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'cold_block']}>
                    <ColdBlock />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/bloque-frio/skapbd"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'cold_block']}>
                    <ColdBlock />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/bloque-frio/gobierno"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'cold_block']}>
                    <ColdBlock />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/bloque-frio/digitalizador"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'cold_block']}>
                    <ColdBlock />
                  </ProtectedRoute>
                }
              />
              {}
              <Route
                path="/cocimientos"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'hot_block']}>
                    <Overview />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/cocimientos/maquinaria"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'hot_block']}>
                    <MachineDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/cocimientos/comparacion"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'hot_block']}>
                    <BatchComparison />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/cocimientos/ciclos"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'hot_block']}>
                    <CycleAnalysis />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/cocimientos/recetas"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'hot_block']}>
                    <RecipeAnalysis />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/cocimientos/mantenimiento"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'hot_block']}>
                    <PredictiveMaintenance />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/cocimientos/calidad"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'hot_block']}>
                    <QualityConsistency />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/cocimientos/indicadores"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'hot_block']}>
                    <Indicadores />
                  </ProtectedRoute>
                }
              />
              
              {/* Redirecciones automáticas (Alias de URLs viejas a las nuevas) */}
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