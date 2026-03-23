import { DashboardLayout } from "@/components/layout/dashboard_layout";
import { Clock } from "lucide-react";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { useMachineDetail } from "@/hooks/use_machine_detail";
import { MachineHeader } from "@/components/machine-detail/machine_header";
import { GlobalFilters } from "@/components/machine-detail/global_filters";
import { GlobalTimeline } from "@/components/machine-detail/global_timeline";
import { MachineryTab } from "@/components/machine-detail/machinery_tab";
import { AnimatedPage } from "@/components/layout/animated_page";
import { LoadingState } from "@/components/ui/loading_state";
import { SequenceComparisonTab } from "@/components/machine-detail/sequence_comparison_tab";

import { useExportMachineDetail } from "@/hooks/use_export_machine_detail";
import { MachineTabsList } from "@/components/machine-detail/components/machine_tabs_list";
import { MachineViewTab } from "@/components/machine-detail/tabs/machine_view_tab";

export default function MachineDetail() {
  const ctx = useMachineDetail();
  const { componentRef, handlePrint, handleExport } = useExportMachineDetail(ctx.data, ctx.selectedMachine);

  if (!ctx.data) return <DashboardLayout><LoadingState message="Inicializando análisis..." /></DashboardLayout>;
  
  if (ctx.data.length === 0) {
    return (
      <DashboardLayout>
        <div className="flex h-[50vh] items-center justify-center">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center text-muted-foreground glass p-8 rounded-xl">
            <Clock className="mx-auto h-12 w-12 opacity-50 mb-4 text-primary" />
            <h2 className="text-xl font-semibold text-foreground">Sin Datos</h2>
            <p className="mt-2 text-sm text-balance">
              Por favor carga un archivo Excel en la pestaña "Resumen" para comenzar el análisis.
            </p>
          </motion.div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <AnimatedPage className="space-y-6 pb-12">
        <MachineHeader selectedBatchId={ctx.selectedBatchId} selectedMachine={ctx.selectedMachine} onExport={handleExport} onPrint={handlePrint} />
        <div className="print:hidden">
            <GlobalFilters selectedRecipe={ctx.selectedRecipe} setSelectedRecipe={ctx.setSelectedRecipe} uniqueRecipes={ctx.uniqueRecipes} selectedBatchId={ctx.selectedBatchId} setSelectedBatchId={ctx.setSelectedBatchId} filteredBatches={ctx.filteredBatches} batchProductMap={ctx.batchProductMap} />
        </div>
        
        <div ref={componentRef}>
            <div className="hidden print:block mb-6">
                <h1 className="text-3xl font-bold text-black mb-2">Reporte de Detalle de Máquina</h1>
                <p className="text-gray-600">Generado el {format(new Date(), "PPP p")}</p>
                {ctx.selectedMachine && <p className="text-lg mt-2 text-black">Equipo: <strong>{ctx.selectedMachine}</strong></p>}
                {ctx.selectedBatchId && <p className="text-lg text-black">Lote: <strong>{ctx.selectedBatchId}</strong></p>}
            </div>
            
            <div className={ctx.isPending ? "opacity-50 pointer-events-none transition-opacity duration-200" : "transition-opacity duration-200"}>
            <Tabs value={ctx.activeTab} onValueChange={ctx.setActiveTab} className="space-y-4">
                <MachineTabsList />
                
                <TabsContent value="machine-view" className="space-y-6 outline-none">
                    <MachineViewTab 
                        fullData={ctx.data}
                        selectedMachine={ctx.selectedMachine} setSelectedMachine={ctx.setSelectedMachine} availableMachinesForBatch={ctx.availableMachinesForBatch}
                        currentGap={ctx.currentGap} currentIdle={ctx.currentIdle} selectedRecord={ctx.selectedRecord} stepsData={ctx.stepsData}
                        selectedBatchId={ctx.selectedBatchId} machineHistoryData={ctx.machineHistoryData} selectedHistoryIndices={ctx.selectedHistoryIndices}
                        setSelectedHistoryIndices={ctx.setSelectedHistoryIndices} trendBatch={ctx.trendBatch} tempTrendData={ctx.tempTrendData}
                        trendRecipe={ctx.trendRecipe} trendMachine={ctx.trendMachine} selectedTempParam={ctx.selectedTempParam}
                        uniqueRecipes={ctx.uniqueRecipes} machinesWithTemps={ctx.machinesWithTemps} availableTrendBatches={ctx.availableTrendBatches}
                        availableTempParams={ctx.availableTempParams} setTrendRecipe={ctx.setTrendRecipe} setTrendMachine={ctx.setTrendMachine}
                        setTrendBatch={ctx.setTrendBatch} setSelectedTempParam={ctx.setSelectedTempParam} selectedTempIndices={ctx.selectedTempIndices}
                        setSelectedTempIndices={ctx.setSelectedTempIndices}
                    />
                </TabsContent>
                
                <TabsContent value="sequence-compare" className="space-y-6 outline-none">
                  <SequenceComparisonTab data={ctx.data} initialMachine={ctx.selectedMachine} compSelectedRecipe={ctx.compSelectedRecipe} setCompSelectedRecipe={ctx.setCompSelectedRecipe} compCompareBatchIds={ctx.compCompareBatchIds} setCompCompareBatchIds={ctx.setCompCompareBatchIds} compSelectedMachineGroup={ctx.compSelectedMachineGroup} setCompSelectedMachineGroup={ctx.setCompSelectedMachineGroup} />
                </TabsContent>
                
                <TabsContent value="global-view" className="space-y-6 outline-none">
                    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }}>
                        <GlobalTimeline fullProcessData={ctx.fullProcessData} fullProcessChartHeight={ctx.fullProcessChartHeight} />
                    </motion.div>
                </TabsContent>
                
                <TabsContent value="machinery" className="space-y-6 outline-none">
                  <MachineryTab data={ctx.data} selectedBatchId={ctx.selectedBatchId} compareBatchIds={ctx.compareBatchIds} setCompareBatchIds={ctx.setCompareBatchIds} />
                </TabsContent>
            </Tabs>
            </div>
        </div>
      </AnimatedPage>
    </DashboardLayout>
  );
}