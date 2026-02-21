import { BatchRecord } from "@/types";
import { FILTER_ALL } from "@/lib/constants";

const THEME_COLORS = {
  red: "#ef4444",
  blue: "#3b82f6",
  emerald: "#10b981",
  amber: "#f59e0b",
  violet: "#8b5cf6",
  pink: "#ec4899",
  indigo: "#6366f1",
  teal: "#14b8a6",
  rose: "#f43f5e",
  slate: "#64748b",
};
export const COLORS = Object.values(THEME_COLORS);
export function isTemperatureParam(name: string, unit: string): boolean {
  const u = unit.toLowerCase();
  const n = name.toLowerCase();
  return u.includes("°c") || u.includes("temp") || n.includes("temp");
}
const isValidSelection = (val: string): boolean => Boolean(val && val !== FILTER_ALL);
const filterByMachine = (data: BatchRecord[], machine: string) => 
  isValidSelection(machine) ? data.filter((d) => d.TEILANL_GRUPO === machine) : data;
const filterByRecipe = (data: BatchRecord[], recipe: string) => 
  isValidSelection(recipe) ? data.filter((d) => d.productName === recipe) : data;
const getUniqueValues = (data: string[]) => Array.from(new Set(data.filter(Boolean))).sort();
const hasTemperatureParam = (record: BatchRecord) => 
  record.parameters?.some((p) => isTemperatureParam(p.name, p.unit || ""));
export function computeOptions(
  data: BatchRecord[],
  currentRecipe: string,
  currentMachine: string
) {
  const recipeSource = filterByMachine(data, currentMachine);
  const availableRecipes = getUniqueValues(recipeSource.map((d) => d.productName));
  const machineSource = filterByRecipe(data, currentRecipe);
  const availableMachines = getUniqueValues(
    machineSource.filter(hasTemperatureParam).map((d) => d.TEILANL_GRUPO)
  );
  const batchSource = filterByMachine(filterByRecipe(data, currentRecipe), currentMachine);
  const availableBatches = getUniqueValues(
    batchSource.filter(hasTemperatureParam).map((d) => d.CHARG_NR)
  );
  return { availableRecipes, availableMachines, availableBatches };
}
const getParamValue = (record: BatchRecord | undefined, paramName: string) => {
  if (!record?.parameters) return null;
  return (
    record.parameters.find((p) => p.name === paramName) ||
    record.parameters.find((p) => isTemperatureParam(p.name, p.unit || ""))
  );
};
const formatShortDate = (timestamp: string) => {
  return new Date(timestamp).toLocaleString([], { 
    dateStyle: "short", 
    timeStyle: "short" 
  });
};
const extractBatchTrendData = (data: BatchRecord[], machine: string, batchId: string, param: string) => {
  const record = filterByMachine(data, machine).find((d) => d.CHARG_NR === batchId);
  if (!record?.parameters) return [];
  const exactMatches = record.parameters.filter((p) => p.name === param);
  const sourceParams = exactMatches.length > 0 
    ? exactMatches 
    : record.parameters.filter((p) => isTemperatureParam(p.name, p.unit || ""));
  return sourceParams.map((p, index) => ({
    stepName: p.stepName || `Paso ${index + 1}`,
    value: Number(p.value),
    unit: p.unit,
    date: record.timestamp,
  }));
};
const extractHistoricalTrendData = (data: BatchRecord[], machine: string, recipe: string, param: string) => {
  const records = filterByRecipe(filterByMachine(data, machine), recipe);
  return records
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    .map((record) => {
      const pVal = getParamValue(record, param);
      const dateLabel = formatShortDate(record.timestamp);
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
};
export function calculateTrendData(
  data: BatchRecord[],
  tMachine: string,
  tRecipe: string,
  tBatch: string,
  param: string
) {
  if (isValidSelection(tBatch)) {
    return extractBatchTrendData(data, tMachine, tBatch, param);
  }
  return extractHistoricalTrendData(data, tMachine, tRecipe, param);
}
