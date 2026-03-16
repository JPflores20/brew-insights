import { BatchRecord } from "@/types";
import { FILTER_ALL } from "@/lib/constants";

export const PARAM_TIME = "Tiempo";

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
const isValidSelection = (val: string): boolean => Boolean(val && val !== FILTER_ALL && val !== "");
const filterByMachine = (data: BatchRecord[], machine: string, emptyReturnsAll: boolean = true) => {
  if (machine === "") return emptyReturnsAll ? data : [];
  return isValidSelection(machine) ? data.filter((d) => d.TEILANL_GRUPO === machine) : data;
};
const filterByRecipe = (data: BatchRecord[], recipe: string, emptyReturnsAll: boolean = true) => {
  if (recipe === "") return emptyReturnsAll ? data : [];
  return isValidSelection(recipe) ? data.filter((d) => d.productName === recipe) : data;
};
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
    machineSource.map((d) => d.TEILANL_GRUPO)
  );
  const batchSource = filterByMachine(filterByRecipe(data, currentRecipe), currentMachine);
  const availableBatches = getUniqueValues(
    batchSource.map((d) => d.CHARG_NR)
  );
  let availableParameters: string[] = [];
  let availableSteps: string[] = [];

  if (isValidSelection(currentMachine)) {
    const sampleRecord = recipeSource.find((r) => r.parameters && r.parameters.length > 0) || machineSource.find((r) => r.parameters && r.parameters.length > 0);
    if (sampleRecord && sampleRecord.parameters) {
      availableParameters = getUniqueValues(
        sampleRecord.parameters.map((p) => p.name)
      );
    }
    
    // Extract available steps for this machine across all matching records
    // to ensure we capture the complete process flow, especially if recipes vary slightly
    const allSteps: string[] = [];
    batchSource.forEach((r) => {
      if (r.steps && r.steps.length > 0) {
        r.steps.forEach(s => {
          if (s.stepName && !allSteps.includes(s.stepName)) {
            allSteps.push(s.stepName);
          }
        });
      }
    });
    
    // We already collected them in order of appearance, so we don't need to re-sort
    availableSteps = allSteps;
    
    // Inject pseudo-parameter for plotting step duration
    if (availableSteps.length > 0 && !availableParameters.includes(PARAM_TIME)) {
      availableParameters.push(PARAM_TIME);
    }
  }

  return { availableRecipes, availableMachines, availableBatches, availableParameters, availableSteps };
}
const getParamValue = (record: BatchRecord | undefined, paramName: string, stepName?: string) => {
  if (!record) return null;

  // Intercept Pseudo-parameter: 'Tiempo'
  if (paramName === PARAM_TIME) {
    if (stepName && stepName !== FILTER_ALL && record.steps) {
      const stepMatch = record.steps.find((s) => s.stepName === stepName);
      if (stepMatch) {
        return { name: PARAM_TIME, value: stepMatch.durationMin, unit: "min" };
      }
    } else {
      // If "Todos los pasos" is selected, return the total batch expected duration or sum of real durations
      const totalMins = record.real_total_min || (record.steps ? record.steps.reduce((sum, s) => sum + (s.durationMin || 0), 0) : 0);
      return { name: PARAM_TIME, value: totalMins, unit: "min" };
    }
    return null;
  }

  if (!record.parameters) return null;
  
  let sourceParams = record.parameters;
  if (stepName && stepName !== FILTER_ALL) {
    sourceParams = sourceParams.filter(p => p.stepName === stepName);
  }

  return (
    sourceParams.find((p) => p.name === paramName) ||
    sourceParams.find((p) => isTemperatureParam(p.name, p.unit || ""))
  );
};
const formatShortDate = (timestamp: string) => {
  return new Date(timestamp).toLocaleString([], { 
    dateStyle: "short", 
    timeStyle: "short" 
  });
};
const extractBatchTrendData = (data: BatchRecord[], machine: string, batchId: string, param: string) => {
  const record = filterByMachine(data, machine, false).find((d) => d.CHARG_NR === batchId);
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
const extractHistoricalTrendData = (data: BatchRecord[], machine: string, recipe: string, param: string, stepName?: string) => {
  const records = filterByRecipe(filterByMachine(data, machine, false), recipe, false);
  return records
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    .map((record) => {
      const pVal = getParamValue(record, param, stepName);
      const dateLabel = formatShortDate(record.timestamp);
      
      let duration = null;
      if (stepName && stepName !== FILTER_ALL && record.steps) {
        const stepMatch = record.steps.find((s) => s.stepName === stepName);
        if (stepMatch) {
          duration = stepMatch.durationMin;
        }
      }

      return {
        batchId: record.CHARG_NR,
        value: pVal ? Number(pVal.value) : null,
        duration: duration,
        date: dateLabel,
        machine: record.TEILANL_GRUPO,
        stepName: dateLabel,
        unit: pVal ? pVal.unit : undefined,
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
  param: string,
  stepName?: string
) {
  if (isValidSelection(tBatch)) {
    return extractBatchTrendData(data, tMachine, tBatch, param);
  }
  return extractHistoricalTrendData(data, tMachine, tRecipe, param, stepName);
}
