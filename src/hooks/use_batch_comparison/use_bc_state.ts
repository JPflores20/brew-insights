import { useState, useEffect, useMemo } from "react";
import { BatchRecord } from "@/types";
import { useLocalStorage } from "@/hooks/use_local_storage";
import { isTemperatureParam } from "./bc_utils";
export function useBcState(data: BatchRecord[], batchIds: string[]) {
  const [selectedBatches, setSelectedBatches] = useLocalStorage<string[]>("selected-batches", []);
  const [selectedMachines, setSelectedMachines] = useLocalStorage<string[]>("selected-machines", []);
  const [chartType, setChartType] = useLocalStorage<string>("batch-comparison-chart-type", "bar");
  const [selectedTempParam, setSelectedTempParam] = useState<string>("");
  const [selectedTempIndices, setSelectedTempIndices] = useState<number[]>([]);
  
  const uniqueRecipes = useMemo(() => {
    const recipes = new Set(data.map((d) => d.productName || "Desconocido"));
    return Array.from(recipes).sort();
  }, [data]);

  const batchProductMap = useMemo(() => {
    const map = new Map<string, string>();
    data.forEach((d) => {
      if (d.productName) {
        map.set(d.CHARG_NR, d.productName);
      }
    });
    return map;
  }, [data]);

  const availableTempParams = useMemo(() => {
    const temps = new Set<string>();
    data.forEach((d) => {
      d.parameters?.forEach((p) => {
        if (isTemperatureParam(p.name, p.unit || "")) {
          temps.add(p.name);
        }
      });
    });
    return Array.from(temps).sort();
  }, [data]);

  const allAvailableMachines = useMemo(() => {
    if (selectedBatches.length === 0) return [];
    const machines = new Set<string>();
    data.forEach(d => {
      if (selectedBatches.includes(d.CHARG_NR)) {
        machines.add(d.TEILANL_GRUPO);
      }
    });
    return Array.from(machines).sort();
  }, [data, selectedBatches]);

  useEffect(() => {
    if (
      availableTempParams.length > 0 && 
      (!selectedTempParam || !availableTempParams.includes(selectedTempParam))
    ) {
      setSelectedTempParam(availableTempParams[0]);
    }
  }, [availableTempParams, selectedTempParam]);

  useEffect(() => {
    // Filter out any selected batches that no longer exist in batchIds
    const validBatches = selectedBatches.filter(id => batchIds.includes(id));
    if (validBatches.length !== selectedBatches.length) {
      setSelectedBatches(validBatches);
    }
  }, [batchIds, selectedBatches, setSelectedBatches]);

  useEffect(() => {
    // Filter out machines that are no longer available in the currently selected batches
    const validMachines = selectedMachines.filter(m => allAvailableMachines.includes(m));
    if (validMachines.length !== selectedMachines.length) {
      setSelectedMachines(validMachines);
    }
  }, [allAvailableMachines, selectedMachines, setSelectedMachines]);

  return {
    selectedBatches,
    setSelectedBatches,
    selectedMachines,
    setSelectedMachines,
    allAvailableMachines,
    chartType, 
    setChartType,
    selectedTempParam, 
    setSelectedTempParam,
    selectedTempIndices, 
    setSelectedTempIndices,
    uniqueRecipes,
    batchProductMap,
    availableTempParams
  };
}
