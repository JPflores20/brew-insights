import { useData } from "@/context/data_context";
import { getUniqueBatchIds } from "@/data/mock_data";

// Sub-hooks & Utils
import { useBcState } from "./use_batch_comparison/use_bc_state";
import { useBcSeries } from "./use_batch_comparison/use_bc_series";
import { useBcChart } from "./use_batch_comparison/use_bc_chart";

export function useBatchComparison() {
  const { data } = useData();
  const batchIds = getUniqueBatchIds(data);

  // 1. Estado y selectores
  const {
    batchA, setBatchA,
    batchB, setBatchB,
    chartType, setChartType,
    selectedTempParam, setSelectedTempParam,
    selectedTempIndices, setSelectedTempIndices,
    uniqueRecipes,
    batchProductMap,
    availableTempParams
  } = useBcState(data, batchIds);

  // 2. Gestión de series multi-filtrado
  const { seriesList, addSeries, seriesOptions } = useBcSeries(data);

  // 3. Cálculos de gráficas para análisis multi-tendencias
  const { chartData } = useBcChart(data, seriesList, selectedTempParam);

  return {
    // Datos y Diccionarios
    data,
    batchIds,
    batchProductMap,
    uniqueRecipes,
    availableTempParams,
    
    // Series Chart (Inferior)
    chartData,
    seriesOptions,
    addSeries,
    
    // Estado principal
    batchA, setBatchA,
    batchB, setBatchB,
    chartType, setChartType,
    selectedTempParam, setSelectedTempParam,
    selectedTempIndices, setSelectedTempIndices,
  };
}
