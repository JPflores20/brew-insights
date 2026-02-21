import { useState, useEffect, useMemo } from "react";
import { BatchRecord } from "@/types";
import { useLocalStorage } from "@/hooks/use_local_storage";
import { isTemperatureParam } from "./bc_utils";

export function useBcState(data: BatchRecord[], batchIds: string[]) {
  // Estado persistente en localStorage
  const [batchA, setBatchA] = useLocalStorage<string>("batch-comparison-a", "");
  const [batchB, setBatchB] = useLocalStorage<string>("batch-comparison-b", "");
  const [chartType, setChartType] = useLocalStorage<string>("batch-comparison-chart-type", "bar");

  // Estado volátil
  const [selectedTempParam, setSelectedTempParam] = useState<string>("");
  const [selectedTempIndices, setSelectedTempIndices] = useState<number[]>([]);

  // Recetas únicas
  const uniqueRecipes = useMemo(() => {
    const recipes = new Set(data.map((d) => d.productName || "Desconocido"));
    return Array.from(recipes).sort();
  }, [data]);

  // Mapa lote → producto
  const batchProductMap = useMemo(() => {
    const map = new Map<string, string>();
    
    data.forEach((d) => {
      if (d.productName) {
        map.set(d.CHARG_NR, d.productName);
      }
    });
    
    return map;
  }, [data]);

  // Parámetros de temperatura disponibles
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

  // Auto-seleccionar primer parámetro de temperatura
  useEffect(() => {
    if (
      availableTempParams.length > 0 && 
      (!selectedTempParam || !availableTempParams.includes(selectedTempParam))
    ) {
      setSelectedTempParam(availableTempParams[0]);
    }
  }, [availableTempParams, selectedTempParam]);

  // Sincronizar batchA / batchB cuando cambian los IDs
  useEffect(() => {
    if (batchIds.length >= 2) {
      if (!batchA || !batchIds.includes(batchA)) {
        setBatchA(batchIds[0]);
      }
      
      if (!batchB || !batchIds.includes(batchB)) {
        setBatchB(batchIds[1]);
      }
    }
  }, [batchIds, batchA, batchB, setBatchA, setBatchB]);

  return {
    batchA, 
    setBatchA,
    batchB, 
    setBatchB,
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
