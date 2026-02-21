import { useState, useMemo, useEffect } from "react";
import { BatchRecord } from "@/types";
import { getMachineData } from "@/data/mock_data";
import { FILTER_ALL } from "@/lib/constants";

const isTemp = (p: { unit?: string | null; name: string }) => {
  const u = (p.unit || "").toLowerCase();
  return (
    u.includes("°c") || 
    u.includes("temp") || 
    p.name.toLowerCase().includes("temp")
  );
};
export function useMdTemp(
  data: BatchRecord[], 
  selectedMachine: string, 
  selectedRecipe: string, 
  selectedBatchId: string
) {
  const [trendMachine, setTrendMachine] = useState<string>(FILTER_ALL);
  const [trendRecipe, setTrendRecipe] = useState<string>(FILTER_ALL);
  const [trendBatch, setTrendBatch] = useState<string>(FILTER_ALL);
  const [selectedTempParam, setSelectedTempParam] = useState<string>("");
  useEffect(() => { 
    if (selectedMachine) {
      setTrendMachine(selectedMachine); 
    }
  }, [selectedMachine]);
  useEffect(() => { 
    if (selectedRecipe) {
      setTrendRecipe(selectedRecipe); 
    }
  }, [selectedRecipe]);
  useEffect(() => { 
    setTrendBatch(FILTER_ALL); 
  }, [trendRecipe, trendMachine]);
  const machinesWithTemps = useMemo(() => {
    const machines = new Set<string>();
    const filteredRecords = trendRecipe !== FILTER_ALL 
      ? data.filter((d) => d.productName === trendRecipe) 
      : data;
    filteredRecords.forEach((r) => { 
      if (r.parameters?.some(isTemp)) {
        machines.add(r.TEILANL_GRUPO); 
      }
    });
    return Array.from(machines).sort();
  }, [data, trendRecipe]);
  const availableTrendBatches = useMemo(() => {
    const batches = new Set<string>();
    let filteredRecords = data;
    if (trendRecipe !== FILTER_ALL) {
      filteredRecords = filteredRecords.filter((d) => d.productName === trendRecipe);
    }
    if (trendMachine !== FILTER_ALL) {
      filteredRecords = filteredRecords.filter((d) => d.TEILANL_GRUPO === trendMachine);
    }
    filteredRecords.forEach((r) => { 
      if (r.parameters?.some(isTemp)) {
        batches.add(r.CHARG_NR); 
      }
    });
    return Array.from(batches).sort();
  }, [data, trendRecipe, trendMachine]);
  const availableTempParams = useMemo(() => {
    if (!trendMachine) return [];
    const allParams = data
      .filter((d) => trendMachine === FILTER_ALL || d.TEILANL_GRUPO === trendMachine)
      .flatMap((d) => d.parameters || []);
    return Array.from(
      new Set(allParams.filter(isTemp).map(p => p.name))
    ).sort();
  }, [data, trendMachine]);
  useEffect(() => {
    if (
      availableTempParams.length > 0 && 
      (!selectedTempParam || !availableTempParams.includes(selectedTempParam))
    ) {
      setSelectedTempParam(availableTempParams[0]);
    } else if (availableTempParams.length === 0) {
      setSelectedTempParam("");
    }
  }, [availableTempParams, selectedTempParam]);
  const tempTrendData = useMemo(() => {
    if (!selectedTempParam) return [];
    if (trendBatch !== FILTER_ALL) {
      const record = trendMachine !== FILTER_ALL 
        ? data.find((d) => d.CHARG_NR === trendBatch && d.TEILANL_GRUPO === trendMachine) 
        : data.find((d) => d.CHARG_NR === trendBatch);
      if (!record || !record.parameters) return [];
      return record.parameters
        .filter((p) => p.name === selectedTempParam)
        .map((p, index) => ({
          stepName: p.stepName || `Paso ${index + 1}`, 
          value: Number(p.value), 
          unit: p.unit, 
          batchId: record?.CHARG_NR, 
          date: record?.timestamp, 
          machine: record?.TEILANL_GRUPO, 
          isCurrent: true,
        }));
    }
    let records = trendMachine === FILTER_ALL ? data : getMachineData(data, trendMachine);
    if (trendRecipe !== FILTER_ALL) {
      records = records.filter((d) => d.productName === trendRecipe);
    }
    return records
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .map((record) => {
        const param = record.parameters?.find((p) => p.name === selectedTempParam);
        return { 
          batchId: record.CHARG_NR, 
          value: param ? Number(param.value) : null, 
          date: new Date(record.timestamp).toLocaleString([], { dateStyle: "short", timeStyle: "short" }), 
          machine: record.TEILANL_GRUPO, 
          isCurrent: record.CHARG_NR === selectedBatchId 
        };
      })
      .filter((d): d is { 
        batchId: string; 
        value: number; 
        date: string; 
        machine: string; 
        isCurrent: boolean; 
      } => d.value !== null && Number.isFinite(d.value));
  }, [data, trendMachine, trendRecipe, trendBatch, selectedTempParam, selectedBatchId]);
  return { 
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
    tempTrendData 
  };
}
