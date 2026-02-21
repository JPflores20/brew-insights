import { format } from "date-fns";
export type {
  BatchStep,
  BatchMaterial,
  BatchParameter,
  BatchRecord,
  ProcessCapabilityResult,
  TemperaturePoint,
} from "@/types";
import type { BatchRecord, BatchParameter, ProcessCapabilityResult } from "@/types";
export function getUniqueBatchIds(data: BatchRecord[]): string[] {
  return Array.from(new Set(data.map(d => d.CHARG_NR))).sort();
}
export function getUniqueMachineGroups(data: BatchRecord[]): string[] {
  return Array.from(new Set(data.map(d => d.TEILANL_GRUPO))).sort();
}
export function getBatchById(data: BatchRecord[], batchId: string): BatchRecord[] {
  return data.filter(d => d.CHARG_NR === batchId);
}
export function getMachineData(data: BatchRecord[], machineName: string): BatchRecord[] {
  return data.filter(d => d.TEILANL_GRUPO === machineName);
}
export function getAveragesByMachine(data: BatchRecord[]) {
  const groups = getUniqueMachineGroups(data);
  return groups.map(machineName => {
    const records = getMachineData(data, machineName);
    const count = records.length;
    if (count === 0) return { machine: machineName, avgReal: 0, avgExpected: 0, avgDelta: 0, avgIdle: 0 };
    const sumReal = records.reduce((acc, r) => acc + r.real_total_min, 0);
    const sumExp = records.reduce((acc, r) => acc + r.esperado_total_min, 0);
    const sumDelta = records.reduce((acc, r) => acc + r.delta_total_min, 0);
    const sumIdle = records.reduce((acc, r) => acc + r.idle_wall_minus_sumsteps_min, 0);
    return {
      machine: machineName,
      avgReal: Math.round(sumReal / count),
      avgExpected: Math.round(sumExp / count),
      avgDelta: Math.round(sumDelta / count),
      avgIdle: Math.round(sumIdle / count),
    };
  });
}
export function getTotalBatches(data: BatchRecord[]): number {
  return new Set(data.map(d => d.CHARG_NR)).size;
}
export function getAverageCycleDeviation(data: BatchRecord[]): number {
  if (data.length === 0) return 0;
  const validData = data.filter(d => d.esperado_total_min > 0);
  if (validData.length === 0) return 0;
  const totalDelta = validData.reduce((sum, d) => sum + d.delta_total_min, 0);
  const totalExpected = validData.reduce((sum, d) => sum + d.esperado_total_min, 0);
  return Math.round((totalDelta / totalExpected) * 100 * 10) / 10;
}
export function getMachineWithHighestIdleTime(data: BatchRecord[]) {
  const averages = getAveragesByMachine(data);
  if (averages.length === 0) return { machine: "N/A", idleTime: 0 };
  const highest = averages.reduce((prev, curr) => (curr.avgIdle > prev.avgIdle) ? curr : prev);
  return { machine: highest.machine, idleTime: highest.avgIdle };
}
export function getDelayAlerts(data: BatchRecord[], threshold: number = 30): BatchRecord[] {
  return data
    .filter(d => d.delta_total_min > threshold)
    .sort((a, b) => b.delta_total_min - a.delta_total_min);
}
export function getRecipeStats(data: BatchRecord[]) {
  const recipes = new Map<string, {
    uniqueBatches: Set<string>, 
    totalRecords: number,       
    totalReal: number,
    totalExpected: number,
    totalIdle: number
  }>();
  data.forEach(d => {
    const name = d.productName || "Desconocido";
    if (!recipes.has(name)) {
      recipes.set(name, {
        uniqueBatches: new Set(),
        totalRecords: 0,
        totalReal: 0,
        totalExpected: 0,
        totalIdle: 0
      });
    }
    const r = recipes.get(name)!;
    r.uniqueBatches.add(d.CHARG_NR);
    r.totalRecords++;
    r.totalReal += d.real_total_min;
    r.totalExpected += d.esperado_total_min;
    r.totalIdle += d.idle_wall_minus_sumsteps_min;
  });
  return Array.from(recipes.entries()).map(([name, stats]) => {
    const uniqueCount = stats.uniqueBatches.size;
    return {
      name,
      avgReal: uniqueCount > 0 ? Math.round(stats.totalReal / uniqueCount) : 0,
      avgExpected: uniqueCount > 0 ? Math.round(stats.totalExpected / uniqueCount) : 0,
      avgIdle: uniqueCount > 0 ? Math.round(stats.totalIdle / uniqueCount) : 0,
      batchCount: uniqueCount,    
      recordCount: stats.totalRecords 
    };
  }).sort((a, b) => b.batchCount - a.batchCount);
}
export function getShiftStats(data: BatchRecord[]) {
  const shifts = {
    "Turno 1 (Matutino)": { count: 0, totalDelta: 0, totalIdle: 0 },
    "Turno 2 (Vespertino)": { count: 0, totalDelta: 0, totalIdle: 0 },
    "Turno 3 (Nocturno)": { count: 0, totalDelta: 0, totalIdle: 0 },
  };
  data.forEach(d => {
    let shiftKey: keyof typeof shifts;
    if (d.startHour >= 6 && d.startHour < 14) shiftKey = "Turno 1 (Matutino)";
    else if (d.startHour >= 14 && d.startHour < 22) shiftKey = "Turno 2 (Vespertino)";
    else shiftKey = "Turno 3 (Nocturno)";
    shifts[shiftKey].count++;
    shifts[shiftKey].totalDelta += d.delta_total_min;
    shifts[shiftKey].totalIdle += d.idle_wall_minus_sumsteps_min;
  });
  return Object.entries(shifts).map(([name, stats]) => ({
    name,
    batches: stats.count,
    avgDelta: stats.count > 0 ? Math.round(stats.totalDelta / stats.count) : 0,
    avgIdle: stats.count > 0 ? Math.round(stats.totalIdle / stats.count) : 0,
  }));
}
function calculateProcessMean(values: number[]): number {
  if (values.length === 0) return 0;
  const sumOfValues = values.reduce((total, current) => total + current, 0);
  return sumOfValues / values.length;
}
function calculateStandardDeviationSample(values: number[]): number {
  const sampleSize = values.length;
  if (sampleSize < 2) return 0;
  const processMean = calculateProcessMean(values);
  const sumOfSquaredDifferences = values.reduce(
    (accumulator, currentValue) => accumulator + Math.pow(currentValue - processMean, 2), 
    0
  );
  return Math.sqrt(sumOfSquaredDifferences / (sampleSize - 1));
}
export function calculateCpCpk(
  values: number[],
  lowerSpecificationLimit: number,
  upperSpecificationLimit: number
): ProcessCapabilityResult {
  const sampleSize = values.length;
  const processMean = calculateProcessMean(values);
  const standardDeviation = calculateStandardDeviationSample(values);
  const hasInvalidInputs = (
    sampleSize < 2 || 
    standardDeviation <= 0 || 
    !isFinite(standardDeviation) || 
    !isFinite(lowerSpecificationLimit) || 
    !isFinite(upperSpecificationLimit) || 
    upperSpecificationLimit <= lowerSpecificationLimit
  );
  if (hasInvalidInputs) {
    return { 
      sampleSize: sampleSize, 
      processMean: processMean, 
      standardDeviation: standardDeviation, 
      lowerSpecificationLimit: lowerSpecificationLimit, 
      upperSpecificationLimit: upperSpecificationLimit, 
      processCapabilityRatio: null, 
      processCapabilityIndex: null 
    };
  }
  const processCapabilityRatio = (upperSpecificationLimit - lowerSpecificationLimit) / (6 * standardDeviation);
  const capabilityUpper = (upperSpecificationLimit - processMean) / (3 * standardDeviation);
  const capabilityLower = (processMean - lowerSpecificationLimit) / (3 * standardDeviation);
  const processCapabilityIndex = Math.min(capabilityUpper, capabilityLower);
  return { 
    sampleSize: sampleSize, 
    processMean: processMean, 
    standardDeviation: standardDeviation, 
    lowerSpecificationLimit: lowerSpecificationLimit, 
    upperSpecificationLimit: upperSpecificationLimit, 
    processCapabilityRatio: processCapabilityRatio, 
    processCapabilityIndex: processCapabilityIndex 
  };
}
export function getCpCpkForTemperatureDeltaByParameter(
  data: BatchRecord[],
  specMap: Record<string, { lsl: number; usl: number }>,
  options?: {
    machine?: string;
    stepName?: string;
    parameterName?: string;
  }
) {
  const { machine, stepName, parameterName } = options || {};
  const allParams: BatchParameter[] = data
    .filter((r) => (machine ? r.TEILANL_GRUPO === machine : true))
    .flatMap((r) => r.parameters || [])
    .filter((p) => (stepName ? p.stepName === stepName : true))
    .filter((p) => (parameterName ? p.name === parameterName : true));
  const groups = new Map<string, BatchParameter[]>();
  allParams.forEach((p) => {
    if (!groups.has(p.name)) groups.set(p.name, []);
    groups.get(p.name)!.push(p);
  });
  const results = Array.from(groups.entries()).map(([pname, items]) => {
    const spec = specMap[pname];
    const deltas = items
      .map((p) => Number(p.value) - Number(p.target))
      .filter((v) => Number.isFinite(v));
    if (!spec) {
      return {
        parameter: pname,
        unit: items[0]?.unit || "",
        sampleSize: deltas.length,
        processMean: calculateProcessMean(deltas),
        standardDeviation: calculateStandardDeviationSample(deltas),
        lowerSpecificationLimit: null as number | null,
        upperSpecificationLimit: null as number | null,
        processCapabilityRatio: null as number | null,
        processCapabilityIndex: null as number | null,
        missingSpec: true,
      };
    }
    const cap = calculateCpCpk(deltas, spec.lsl, spec.usl);
    return {
      parameter: pname,
      unit: items[0]?.unit || "",
      ...cap,
      missingSpec: false,
    };
  });
  return results.sort((a: any, b: any) => {
    if (a.missingSpec && !b.missingSpec) return 1;
    if (!a.missingSpec && b.missingSpec) return -1;
    const ac = a.processCapabilityIndex ?? -999;
    const bc = b.processCapabilityIndex ?? -999;
    return ac - bc;
  });
}
import type { TemperaturePoint } from "@/types";
export function generateTemperatureComparisonData(
  batchIds: string[],
  data: BatchRecord[],
  parameterName?: string
): TemperaturePoint[] {
  let baseTemp = 45;
  let peakTemp = 100;
  if (parameterName?.includes("Frio") || parameterName?.includes("Salida")) {
    baseTemp = 5;
    peakTemp = 15;
  } else if (parameterName?.includes("Presion")) {
    baseTemp = 1;
    peakTemp = 3;
  }
  const standardProfile = [
    { step: "Arr. Cocedor", startTemp: 25, endTemp: 30, duration: 5 },
    { step: "Recibir Grits 1", startTemp: 30, endTemp: 35, duration: 10 },
    { step: "Recibir Grits 2", startTemp: 35, endTemp: 40, duration: 10 },
    { step: "Calentar 1", startTemp: 40, endTemp: 50, duration: 15 },
    { step: "Calentar 2", startTemp: 50, endTemp: 60, duration: 15 },
    { step: "Calentar 3", startTemp: 60, endTemp: 70, duration: 15 },
    { step: "Pausa 1", startTemp: 70, endTemp: 70, duration: 20 },
    { step: "Calentar 4", startTemp: 70, endTemp: 80, duration: 15 },
    { step: "Arr. Macerador", startTemp: 80, endTemp: 80, duration: 5 },
    { step: "Pausa 2", startTemp: 80, endTemp: 80, duration: 20 },
    { step: "Calentar 5", startTemp: 80, endTemp: 90, duration: 15 },
    { step: "Cerrar Registro", startTemp: 90, endTemp: 90, duration: 5 },
    { step: "Calentar a pre...", startTemp: 90, endTemp: 98, duration: 15 },
    { step: "Hervir", startTemp: 98, endTemp: 100, duration: 60 },
    { step: "Espera Macerad...", startTemp: 100, endTemp: 95, duration: 15 },
    { step: "Bombear Adjunt... 1", startTemp: 95, endTemp: 90, duration: 10 },
    { step: "Bombear Adjunt... 2", startTemp: 90, endTemp: 85, duration: 10 },
    { step: "Agua de Enjuag...", startTemp: 85, endTemp: 80, duration: 10 },
    { step: "Bombeo Enjuague", startTemp: 80, endTemp: 75, duration: 10 },
    { step: "Fin Cocedor", startTemp: 75, endTemp: 25, duration: 10 },
  ];
  const points: TemperaturePoint[] = [];
  let currentTime = 0;
  standardProfile.forEach(phase => {
    const steps = phase.duration / 5;
    const tempInc = (phase.endTemp - phase.startTemp) / steps;
    for (let i = 0; i <= steps; i++) {
      const point: TemperaturePoint = {
        time: currentTime,
        stepName: phase.step,
      };
      batchIds.forEach(id => {
        const seed = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const variance = (Math.sin(currentTime * 0.1 + seed) * 2) + ((seed % 5) - 2.5);
        point[id] = Math.max(0, phase.startTemp + (tempInc * i) + variance);
      });
      points.push(point);
      currentTime += 5;
    }
  });
  return points;
}