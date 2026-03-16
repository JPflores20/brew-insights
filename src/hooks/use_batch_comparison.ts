import { useData } from "@/context/data_context";
import { getUniqueBatchIds } from "@/data/mock_data";
import { useBcState } from "./use_batch_comparison/use_bc_state";
import { useBcSeries } from "./use_batch_comparison/use_bc_series";
import { useBcChart } from "./use_batch_comparison/use_bc_chart";
export function useBatchComparison() {
  const { data } = useData();
  const batchIds = getUniqueBatchIds(data);
  const {
    selectedBatches, setSelectedBatches,
    selectedMachines, setSelectedMachines,
    allAvailableMachines,
    chartType, setChartType,
    selectedTempParam, setSelectedTempParam,
    selectedTempIndices, setSelectedTempIndices,
    uniqueRecipes,
    batchProductMap,
    availableTempParams
  } = useBcState(data, batchIds);
  const { seriesList, addSeries, seriesOptions } = useBcSeries(data, 1);
  const { chartData } = useBcChart(data, seriesList, selectedTempParam);
  return {
    data,
    batchIds,
    batchProductMap,
    uniqueRecipes,
    availableTempParams,
    chartData,
    seriesOptions,
    addSeries,
    selectedBatches, setSelectedBatches,
    selectedMachines, setSelectedMachines,
    allAvailableMachines,
    chartType, setChartType,
    selectedTempParam, setSelectedTempParam,
    selectedTempIndices, setSelectedTempIndices,
  };
}
