import { format } from "date-fns";
import type { BatchRecord, BatchParameter } from "@/types";
export function getUniqueBatchIds(data: BatchRecord[]): string[] {
  return Array.from(new Set(data.map(d => d.CHARG_NR))).sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
}
function getUniqueMachineGroups(data: BatchRecord[]): string[] {
  return Array.from(new Set(data.map(d => d.TEILANL_GRUPO))).sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
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