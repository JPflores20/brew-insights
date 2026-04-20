import { motion } from "framer-motion";
import { BatchRecord } from "@/data/mock_data";
import { useMachineryData } from "./machinery-tab/use_machinery_data";
import { FilterCard } from "./machinery-tab/FilterCard";
import { MaceratorCard } from "./machinery-tab/MaceratorCard";
import { GeneralSummaryTable } from "./machinery-tab/GeneralSummaryTable";
import { FluctuationChartCard } from "./machinery-tab/FluctuationChartCard";
import { HistoricalTrendCard } from "./machinery-tab/HistoricalTrendCard";

interface MachineryTabProps {
  data: BatchRecord[];
  selectedBatchId: string;
  compareBatchIds: string[];
  setCompareBatchIds: React.Dispatch<React.SetStateAction<string[]>>;
}

export function MachineryTab({
  data,
  selectedBatchId,
  compareBatchIds,
  setCompareBatchIds
}: MachineryTabProps) {
  const machineryData = useMachineryData({
    data,
    selectedBatchId,
    compareBatchIds,
  });

  if (!selectedBatchId) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center bg-muted/20 rounded-lg border border-dashed">
        <p className="text-muted-foreground">
          Selecciona un lote para ver la información del equipo.
        </p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FilterCard 
          startStepFilter={machineryData.startStepFilter}
          endStepFilter={machineryData.endStepFilter}
          filterTotalTime={machineryData.filterTotalTime}
          startFilterIndex={machineryData.startFilterIndex}
          endFilterIndex={machineryData.endFilterIndex}
        />
        
        <MaceratorCard 
          maceratorRecord={machineryData.maceratorRecord}
          selectedMaceratorStepIndex={machineryData.selectedMaceratorStepIndex}
          setSelectedMaceratorStepIndex={machineryData.setSelectedMaceratorStepIndex}
          maceratorStepOptions={machineryData.maceratorStepOptions}
          maceratorCalculatedTime={machineryData.maceratorCalculatedTime}
          recibirCocedorTime={machineryData.recibirCocedorTime}
          conversionTemp={machineryData.conversionTemp}
        />
      </div>
      
      <GeneralSummaryTable 
        selectedBatchId={selectedBatchId}
        compareBatchIds={compareBatchIds}
        setCompareBatchIds={setCompareBatchIds}
        allBatchIds={machineryData.allBatchIds}
        comparisonData={machineryData.comparisonData}
        selectedMaceratorStepName={machineryData.selectedMaceratorStepName}
      />

      <div className="grid grid-cols-1 gap-6">
        <FluctuationChartCard 
          chartData={machineryData.chartData}
          compareBatchIds={compareBatchIds}
          selectedBatchId={selectedBatchId}
          colors={machineryData.colors}
        />

        <HistoricalTrendCard 
          comparisonData={machineryData.comparisonData}
          evolutionMetrics={machineryData.evolutionMetrics}
        />
      </div>
    </motion.div>
  );
}
