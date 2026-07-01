
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
import { lazy, Suspense } from "react";

// Lazy loading de páginas para no bloquear el hilo principal y mejorar el cambio de ruta
const Login = lazy(() => import("./pages/Login"));
const MainMenu = lazy(() => import("./pages/main_menu"));
const ColdBlock = lazy(() => import("./pages/cold_block"));
const Overview = lazy(() => import("./pages/Overview"));
const MachineDetail = lazy(() => import("./pages/machine_detail"));
const BatchComparison = lazy(() => import("./pages/batch_comparison"));
const CycleAnalysis = lazy(() => import("./pages/cycle_analysis"));
const RecipeAnalysis = lazy(() => import("./pages/recipe_analysis"));
const PredictiveMaintenance = lazy(() => import("./pages/predictive_maintenance"));
const QualityConsistency = lazy(() => import("./pages/quality_consistency"));
const Indicadores = lazy(() => import("./pages/indicadores"));
const NotFound = lazy(() => import("./pages/not_found"));
const Admin = lazy(() => import("./pages/admin"));
// QueryClient se encarga de manejar el caché y las peticiones asíncronas de datos (usando React Query)
const queryClient = new QueryClient();

import { useSecurityRestrictions } from "./hooks/use_security_restrictions";

const SecurityWrapper = ({ children }: { children: React.ReactNode }) => {
  useSecurityRestrictions();
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <DataProvider>
        <TooltipProvider>
          <SecurityWrapper>
            <Toaster />
            <Sonner />
            {/* Inicia la configuración de Rutas (URLs de la app) */}
            <BrowserRouter
              future={{
                v7_startTransition: true,
                v7_relativeSplatPath: true,
              }}
            >
              <Suspense fallback={
                <div className="flex h-screen w-screen items-center justify-center bg-background">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-muted-foreground animate-pulse">Cargando módulo...</p>
                  </div>
                </div>
              }>
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
              </Suspense>
            </BrowserRouter>
          </SecurityWrapper>
        </TooltipProvider>
      </DataProvider>
    </AuthProvider>
  </QueryClientProvider>
);
export default App;