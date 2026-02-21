import { BatchRecord } from "@/types";

export const COLORS = [
  "#ef4444", "#3b82f6", "#10b981", "#f59e0b",
  "#8b5cf6", "#ec4899", "#6366f1", "#14b8a6", "#f43f5e", "#64748b",
];

export function isTemperatureParam(name: string, unit: string): boolean {
  const u = unit.toLowerCase();
  const n = name.toLowerCase();
  
  return (
    u.includes("°c") || 
    u.includes("temp") || 
    n.includes("temp")
  );
}

export function computeOptions(
  data: BatchRecord[],
  currentRecipe: string,
  currentMachine: string
) {
  const recipeSource = currentMachine && currentMachine !== "ALL"
    ? data.filter((d) => d.TEILANL_GRUPO === currentMachine)
    : data;

  const availableRecipes = Array.from(
    new Set(recipeSource.map((d) => d.productName).filter(Boolean))
  ).sort();

  const machineSource = currentRecipe && currentRecipe !== "ALL"
    ? data.filter((d) => d.productName === currentRecipe)
    : data;

  const availableMachines = Array.from(
    new Set(
      machineSource
        .filter((d) => d.parameters?.some((p) => isTemperatureParam(p.name, p.unit || "")))
        .map((d) => d.TEILANL_GRUPO)
    )
  ).sort();

  let batchSource = data;
  
  if (currentRecipe && currentRecipe !== "ALL") {
    batchSource = batchSource.filter((d) => d.productName === currentRecipe);
  }
    
  if (currentMachine && currentMachine !== "ALL") {
    batchSource = batchSource.filter((d) => d.TEILANL_GRUPO === currentMachine);
  }

  const availableBatches = Array.from(
    new Set(
      batchSource
        .filter((d) => d.parameters?.some((p) => isTemperatureParam(p.name, p.unit || "")))
        .map((d) => d.CHARG_NR)
    )
  ).sort();

  return { availableRecipes, availableMachines, availableBatches };
}

export function calculateTrendData(
  data: BatchRecord[],
  tMachine: string,
  tRecipe: string,
  tBatch: string,
  param: string
) {
  const getParamValue = (record: BatchRecord | undefined) => {
    if (!record?.parameters) return null;
    
    const exact = record.parameters.find((p) => p.name === param);
    if (exact) return exact;
    
    return record.parameters.find((p) => isTemperatureParam(p.name, p.unit || ""));
  };

  if (tBatch && tBatch !== "ALL") {
    const record = tMachine && tMachine !== "ALL"
      ? data.find((d) => d.CHARG_NR === tBatch && d.TEILANL_GRUPO === tMachine)
      : data.find((d) => d.CHARG_NR === tBatch);

    if (!record?.parameters) return [];
    
    const exactMatches = record.parameters.filter((p) => p.name === param);
    const source = exactMatches.length > 0 
      ? exactMatches 
      : record.parameters.filter((p) => isTemperatureParam(p.name, p.unit || ""));

    return source.map((p, index) => ({
      stepName: p.stepName || `Paso ${index + 1}`,
      value: Number(p.value),
      unit: p.unit,
      date: record.timestamp,
    }));
  }

  // Modo histórico
  let records = tMachine === "ALL" 
    ? data 
    : data.filter((d) => d.TEILANL_GRUPO === tMachine);
    
  if (tRecipe && tRecipe !== "ALL") {
    records = records.filter((d) => d.productName === tRecipe);
  }

  return records
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    .map((record) => {
      const pVal = getParamValue(record);
      const dateLabel = new Date(record.timestamp).toLocaleString([], { 
        dateStyle: "short", 
        timeStyle: "short" 
      });
      
      return {
        batchId: record.CHARG_NR,
        value: pVal ? Number(pVal.value) : null,
        date: dateLabel,
        machine: record.TEILANL_GRUPO,
        stepName: dateLabel,
      };
    })
    .filter((d): d is typeof d & { value: number } => 
      d.value !== null && Number.isFinite(d.value)
    );
}
