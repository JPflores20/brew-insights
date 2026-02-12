import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Clock, LayoutDashboard, Layers } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { motion } from "framer-motion";

// Hook
import { useMachineDetail } from "@/hooks/useMachineDetail";

// Sub-components
import { MachineHeader } from "@/components/machine-detail/MachineHeader";
import { GlobalFilters } from "@/components/machine-detail/GlobalFilters";
import { MachineKPIs } from "@/components/machine-detail/MachineKPIs";
import { SequenceChart } from "@/components/machine-detail/SequenceChart";
import { AnomaliesList } from "@/components/machine-detail/AnomaliesList";
import { MachineHistoryChart } from "@/components/machine-detail/MachineHistoryChart";
import { TemperatureTrendChart } from "@/components/machine-detail/TemperatureTrendChart";
import { GlobalTimeline } from "@/components/machine-detail/GlobalTimeline";
import { ProblemsPanel } from "@/components/machine-detail/ProblemsPanel";

// UI Enhancements
import { AnimatedPage } from "@/components/layout/AnimatedPage";
import { LoadingState } from "@/components/ui/LoadingState";

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
        />

        <GlobalFilters
          selectedRecipe={selectedRecipe}
          setSelectedRecipe={setSelectedRecipe}
          uniqueRecipes={uniqueRecipes}
          selectedBatchId={selectedBatchId}
          setSelectedBatchId={setSelectedBatchId}
          filteredBatches={filteredBatches}
          batchProductMap={batchProductMap}
        />

        <div className={isPending ? "opacity-50 pointer-events-none transition-opacity duration-200" : "transition-opacity duration-200"}>
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <TabsList className="grid w-full max-w-[400px] grid-cols-2 bg-muted/50 p-1 rounded-lg">
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
          </Tabs>

          <ProblemsPanel
            problematicBatches={problematicBatches}
            loadSuggestion={loadSuggestion}
          />
        </div>
      </AnimatedPage>
    </DashboardLayout>
  );
}