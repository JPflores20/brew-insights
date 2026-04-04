import { useState, useMemo, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/dashboard_layout";
import { AnimatedPage } from "@/components/layout/animated_page";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ColdBlockSummary } from "@/components/cold-block/summary_tab";
import { SimpleFermentationChart } from "@/components/cold-block/simple_fermentation_chart";
import { HistoryTab } from "@/components/cold-block/history_tab";
import { LayoutDashboard, Thermometer, History } from "lucide-react";
import { useData } from "@/context/data_context";
import { useFileUpload } from "@/hooks/use_file_upload";
import { EmptyStateUploader } from "@/components/dashboard/empty_state_uploader";

export default function ColdBlock() {
  const { coldBlockData, isLoaded, triggerColdBlockLoad } = useData();
  const { loading, uploadProgress, processFiles, maxFiles } = useFileUpload('cold');

  // Trigger cold block data loading on mount if not already loaded
  useEffect(() => {
    triggerColdBlockLoad();
  }, [triggerColdBlockLoad]);

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

        {isLoaded && coldBlockData.length === 0 ? (
          <EmptyStateUploader 
            loading={loading} 
            uploadProgress={uploadProgress} 
            onFilesSelected={processFiles} 
            maxFiles={maxFiles}
          />
        ) : (
          <Tabs defaultValue="resumen" className="space-y-6">
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
            </TabsList>

            <TabsContent value="resumen" className="mt-0 outline-none">
              <ColdBlockSummary />
            </TabsContent>

            <TabsContent value="fermentacion" className="mt-0 outline-none">
              <SimpleFermentationChart />
            </TabsContent>

            <TabsContent value="historico" className="mt-0 outline-none">
              <HistoryTab />
            </TabsContent>
          </Tabs>
        )}
      </AnimatedPage>
    </DashboardLayout>
  );
}