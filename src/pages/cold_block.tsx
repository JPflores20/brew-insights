import { useState, useMemo, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/dashboard_layout";
import { AnimatedPage } from "@/components/layout/animated_page";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ColdBlockSummary } from "@/components/cold_block/summary_tab";
import { SimpleFermentationChart } from "@/components/cold_block/simple_fermentation_chart";
import { HistoryTab } from "@/components/cold_block/history_tab";
import { LayoutDashboard, Thermometer, History, BarChart3, Database } from "lucide-react";
import { useData } from "@/context/data_context";
import { useFileUpload } from "@/hooks/use_file_upload";
import { EmptyStateUploader } from "@/components/dashboard/empty_state_uploader";
import { SequenceComparisonTab } from "@/components/machine_detail/sequence_comparison_tab";
import { useLocalStorage } from "@/hooks/use_local_storage";
import { FILTER_ALL } from "@/lib/constants";
import { CapabilityAnalysisManager } from "@/components/cold_block/capability/capability_analysis_manager";

export default function ColdBlock() {
  const { coldBlockData, isLoaded, triggerColdBlockLoad } = useData();
  const { loading, uploadProgress, processFiles, maxFiles } = useFileUpload('cold');

  // Estados persistentes para la pestaña de comparativa en Bloque Frío
  const [compSelectedRecipe, setCompSelectedRecipe] = useLocalStorage<string>(
    "cold-comp-tab-recipe",
    FILTER_ALL
  );
  const [compCompareBatchIds, setCompCompareBatchIds] = useLocalStorage<string[]>(
    "cold-comp-tab-batches",
    []
  );
  const [compSelectedMachineGroup, setCompSelectedMachineGroup] = useLocalStorage<string>(
    "cold-comp-tab-machine-group",
    ""
  );

  // Trigger cold block data loading on mount if not already loaded
  useEffect(() => {
    triggerColdBlockLoad();
  }, [triggerColdBlockLoad]);

  const location = useLocation();
  const navigate = useNavigate();

  // Determinar la pestaña activa basándose en la URL
  const activeTab = useMemo(() => {
    const path = location.pathname;
    if (path.endsWith("/fermentacion")) return "fermentacion";
    if (path.endsWith("/historico")) return "historico";
    if (path.endsWith("/comparativo")) return "comparativo";
    if (path.endsWith("/skapbd")) return "skapbd";
    return "resumen";
  }, [location.pathname]);

  const handleTabChange = (value: string) => {
    if (value === "resumen") navigate("/bloque-frio");
    else navigate(`/bloque-frio/${value}`);
  };

  return (
    <DashboardLayout>
      <AnimatedPage>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight flex items-center gap-3">
              <div className="bg-blue-500/20 p-2 rounded-lg">
                <Thermometer className="h-6 w-6 text-blue-500" />
              </div>
              Bloque Frío
            </h1>
            <p className="text-muted-foreground mt-1">Gestión de fermentación, maduración y filtración.</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList className="bg-slate-900/50 border border-slate-800 p-1 h-12">
            <TabsTrigger value="resumen" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white gap-2 px-6">
              <LayoutDashboard className="h-4 w-4" />
              Resumen
            </TabsTrigger>
            <TabsTrigger value="fermentacion" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white gap-2 px-6">
              <Thermometer className="h-4 w-4" />
              Fermentación
            </TabsTrigger>
            <TabsTrigger value="historico" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white gap-2 px-6">
              <History className="h-4 w-4" />
              Histórico
            </TabsTrigger>
            <TabsTrigger value="comparativo" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white gap-2 px-6">
              <BarChart3 className="h-4 w-4" />
              Comparativo
            </TabsTrigger>
            <TabsTrigger value="skapbd" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white gap-2 px-6">
              <Database className="h-4 w-4" />
              SKAPBD
            </TabsTrigger>
          </TabsList>

          <TabsContent value="resumen" className="mt-0 outline-none">
            {isLoaded && coldBlockData.length === 0 ? (
              <EmptyStateUploader loading={loading} uploadProgress={uploadProgress} onFilesSelected={processFiles} maxFiles={maxFiles} />
            ) : (
              <ColdBlockSummary />
            )}
          </TabsContent>

          <TabsContent value="fermentacion" className="mt-0 outline-none">
            {isLoaded && coldBlockData.length === 0 ? (
              <EmptyStateUploader loading={loading} uploadProgress={uploadProgress} onFilesSelected={processFiles} maxFiles={maxFiles} />
            ) : (
              <SimpleFermentationChart />
            )}
          </TabsContent>

          <TabsContent value="historico" className="mt-0 outline-none">
            {isLoaded && coldBlockData.length === 0 ? (
              <EmptyStateUploader loading={loading} uploadProgress={uploadProgress} onFilesSelected={processFiles} maxFiles={maxFiles} />
            ) : (
              <HistoryTab />
            )}
          </TabsContent>

          <TabsContent value="comparativo" className="mt-0 outline-none space-y-6">
            <Tabs defaultValue="capability" className="w-full">
              <TabsList className="bg-slate-900/40 border border-slate-800 mb-6">
                <TabsTrigger value="sequence" className="text-xs">Comparativa de Secuencias</TabsTrigger>
                <TabsTrigger value="capability" className="text-xs">Análisis de Capacidad (Excel)</TabsTrigger>
              </TabsList>
              
              <TabsContent value="sequence" className="mt-0">
                {isLoaded && coldBlockData.length === 0 ? (
                  <EmptyStateUploader loading={loading} uploadProgress={uploadProgress} onFilesSelected={processFiles} maxFiles={maxFiles} />
                ) : (
                  <SequenceComparisonTab 
                    data={coldBlockData} 
                    initialMachine="" 
                    compSelectedRecipe={compSelectedRecipe} 
                    setCompSelectedRecipe={setCompSelectedRecipe} 
                    compCompareBatchIds={compCompareBatchIds} 
                    setCompCompareBatchIds={setCompCompareBatchIds} 
                    compSelectedMachineGroup={compSelectedMachineGroup} 
                    setCompSelectedMachineGroup={setCompSelectedMachineGroup} 
                  />
                )}
              </TabsContent>
              
              <TabsContent value="capability" className="mt-0">
                <CapabilityAnalysisManager />
              </TabsContent>
            </Tabs>
          </TabsContent>

          <TabsContent value="skapbd" className="mt-0 outline-none">
            <div className="flex flex-col items-center justify-center py-24 bg-slate-900/30 border border-slate-800 rounded-xl">
              <div className="bg-blue-500/10 p-4 rounded-full mb-4">
                <Database className="h-12 w-12 text-blue-500" />
              </div>
              <h3 className="text-xl font-medium text-white mb-2">SKAPBD</h3>
              <p className="text-slate-400 text-center max-w-md">
                Esta sección se encuentra en construcción. Próximamente estarán disponibles las métricas y análisis de SKAPBD.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </AnimatedPage>
    </DashboardLayout>
  );
}