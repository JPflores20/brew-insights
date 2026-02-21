import { useRef } from "react";
import { DashboardLayout } from "@/components/layout/dashboard_layout";
import { Clock, LayoutDashboard, Layers, Printer } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { exportToCSV } from "@/utils/export_utils";
import { format } from "date-fns";
import { useToast } from "@/hooks/use_toast";
import { useReactToPrint } from "react-to-print";
import { useMachineDetail } from "@/hooks/use_machine_detail";
import { MachineHeader } from "@/components/machine-detail/machine_header";
import { GlobalFilters } from "@/components/machine-detail/global_filters";
import { MachineKPIs } from "@/components/machine-detail/machine_kpis";
import { SequenceChart } from "@/components/machine-detail/sequence_chart";
import { AnomaliesList } from "@/components/machine-detail/anomalies_list";
import { MachineHistoryChart } from "@/components/machine-detail/machine_history_chart";
import { TemperatureTrendChart } from "@/components/machine-detail/temperature_trend_chart";
import { GlobalTimeline } from "@/components/machine-detail/global_timeline";
import { MachineryTab } from "@/components/machine-detail/machinery_tab";
import { AnimatedPage } from "@/components/layout/animated_page";
import { LoadingState } from "@/components/ui/loading_state";
export default function MachineDetail() {
  const {
    data,
    uniqueRecipes,
    selectedRecipe,
    setSelectedRecipe,
    filteredBatches,
    batchProductMap,
    selectedBatchId,
    setSelectedBatchId,
    selectedMachine,
    setSelectedMachine,
    activeTab,
    setActiveTab,
    problematicBatches,
    availableMachinesForBatch,
    currentGap,
    currentIdle,
    selectedRecord,
    stepsData,
    fullProcessData,
    fullProcessChartHeight,
    anomaliesReport,
    machineHistoryData,
    selectedHistoryIndices,
    setSelectedHistoryIndices,
    trendBatch,
    setTrendBatch,
    trendRecipe,
    setTrendRecipe,
    trendMachine,
    setTrendMachine,
    selectedTempParam,
    setSelectedTempParam,
    machinesWithTemps,
    availableTrendBatches,
    availableTempParams,
    tempTrendData,
    selectedTempIndices,
    setSelectedTempIndices,
    loadSuggestion,
    isPending
  } = useMachineDetail();
  const componentRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
      contentRef: componentRef,
      documentTitle: `Detalle_Maquina_${selectedMachine || 'Global'}_${format(new Date(), 'yyyy-MM-dd_HHmm')}`,
      pageStyle: `
        @page { size: auto; margin: 15mm; }
        @media print {
          body { -webkit-print-color-adjust: exact; }
          .print:hidden { display: none !important; }
        }
      `
  });
  const { toast } = useToast();
  const handleExport = () => {
    if (!data || data.length === 0) return;
    const dataToExport = selectedMachine
      ? data.filter(d => d.TEILANL_GRUPO === selectedMachine)
      : data;
    if (dataToExport.length === 0) {
      toast({ title: "Sin datos", description: "No hay datos para la selección actual.", variant: "destructive" });
      return;
    }
    const exportData = dataToExport.map(d => ({
      "Lote": d.CHARG_NR,
      "Grupo Equipo": d.TEILANL_GRUPO,
      "Producto": d.productName,
      "Inicio": d.timestamp ? format(new Date(d.timestamp), 'dd/MM/yyyy HH:mm:ss') : '',
      "Duración Real (min)": d.real_total_min,
      "Duración Esperada (min)": d.esperado_total_min,
      "Delta (min)": d.delta_total_min,
      "Alertas": d.alerts.length
    }));
    exportToCSV(exportData, `BrewCycle_Machine_${selectedMachine || 'All'}_${format(new Date(), 'yyyyMMdd_HHmm')}`);
    toast({ title: "Exportación exitosa", description: "Datos exportados correctamente." });
  };
  if (!data) {
    return (
      <DashboardLayout>
        <LoadingState message="Inicializando análisis..." />
      </DashboardLayout>
    );
  }
  if (data.length === 0) {
    return (
      <DashboardLayout>
        <div className="flex h-[50vh] items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center text-muted-foreground glass p-8 rounded-xl"
          >
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
        <MachineHeader
          selectedBatchId={selectedBatchId}
          selectedMachine={selectedMachine}
          onExport={handleExport}
          onPrint={handlePrint}
        />
        <div className="print:hidden">
            <GlobalFilters
            selectedRecipe={selectedRecipe}
            setSelectedRecipe={setSelectedRecipe}
            uniqueRecipes={uniqueRecipes}
            selectedBatchId={selectedBatchId}
            setSelectedBatchId={setSelectedBatchId}
            filteredBatches={filteredBatches}
            batchProductMap={batchProductMap}
            />
        </div>
        {}
        <div ref={componentRef}>
            {}
            <div className="hidden print:block mb-6">
                <h1 className="text-3xl font-bold text-black mb-2">Reporte de Detalle de Máquina</h1>
                <p className="text-gray-600">Generado el {format(new Date(), "PPP p")}</p>
                {selectedMachine && <p className="text-lg mt-2 text-black">Equipo: <strong>{selectedMachine}</strong></p>}
                {selectedBatchId && <p className="text-lg text-black">Lote: <strong>{selectedBatchId}</strong></p>}
            </div>
            <div className={isPending ? "opacity-50 pointer-events-none transition-opacity duration-200" : "transition-opacity duration-200"}>
            <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="space-y-4"
            >
                <div className="flex items-center justify-between print:hidden">
                <TabsList className="grid w-full max-w-[600px] grid-cols-3 bg-muted/50 p-1 rounded-lg">
                    <TabsTrigger
                    value="machine-view"
                    className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all"
                    >
                    <LayoutDashboard className="h-4 w-4" /> Detalle por Equipo
                    </TabsTrigger>
                    <TabsTrigger
                    value="global-view"
                    className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all"
                    >
                    <Layers className="h-4 w-4" /> Cronología Global
                    </TabsTrigger>
                    <TabsTrigger
                    value="machinery"
                    className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all"
                    >
                    <Layers className="h-4 w-4" /> Maquinaria
                    </TabsTrigger>
                </TabsList>
                </div>
                <TabsContent
                value="machine-view"
                className="space-y-6 outline-none"
                >
                <MachineKPIs
                    selectedMachine={selectedMachine}
                    setSelectedMachine={setSelectedMachine}
                    availableMachinesForBatch={availableMachinesForBatch}
                    currentGap={currentGap}
                    currentIdle={currentIdle}
                />
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                    <motion.div
                    className="xl:col-span-8 space-y-6"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    >
                    <SequenceChart
                        selectedRecord={selectedRecord}
                        stepsData={stepsData}
                        selectedBatchId={selectedBatchId}
                        selectedMachine={selectedMachine}
                    />
                    </motion.div>
                    <motion.div
                    className="xl:col-span-4"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    >
                    <div className="flex flex-col gap-4 xl:sticky xl:top-6 xl:self-start">
                        <AnomaliesList anomaliesReport={anomaliesReport as any} />
                    </div>
                    </motion.div>
                </div>
                <motion.div
                    className="space-y-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <MachineHistoryChart
                    data={machineHistoryData}
                    selectedHistoryIndices={selectedHistoryIndices}
                    setSelectedHistoryIndices={setSelectedHistoryIndices}
                    trendBatch={trendBatch}
                    selectedMachine={selectedMachine}
                    />
                    <TemperatureTrendChart
                    data={tempTrendData}
                    trendBatch={trendBatch}
                    trendRecipe={trendRecipe}
                    trendMachine={trendMachine}
                    selectedTempParam={selectedTempParam}
                    uniqueRecipes={uniqueRecipes}
                    machinesWithTemps={machinesWithTemps}
                    availableTrendBatches={availableTrendBatches}
                    availableTempParams={availableTempParams}
                    setTrendRecipe={setTrendRecipe}
                    setTrendMachine={setTrendMachine}
                    setTrendBatch={setTrendBatch}
                    setSelectedTempParam={setSelectedTempParam}
                    selectedTempIndices={selectedTempIndices}
                    setSelectedTempIndices={setSelectedTempIndices}
                    title="Tendencias de Temperatura"
                    hideParamSelector={true} 
                    />
                </motion.div>
                </TabsContent>
                <TabsContent
                value="global-view"
                className="space-y-6 outline-none"
                >
                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                >
                    <GlobalTimeline
                    fullProcessData={fullProcessData}
                    fullProcessChartHeight={fullProcessChartHeight}
                    />
                </motion.div>
                </TabsContent>
                <TabsContent
                value="machinery"
                className="space-y-6 outline-none"
                >
                  <MachineryTab
                    data={data}
                    selectedBatchId={selectedBatchId}
                  />
                </TabsContent>
            </Tabs>
            </div>
        </div>
      </AnimatedPage>
    </DashboardLayout>
  );
}