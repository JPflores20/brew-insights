import { format } from "date-fns";

// --- INTERFACES ---

export interface BatchStep {
  stepName: string;
  stepNr: string;
  durationMin: number;
  expectedDurationMin: number;
  startTime: string;
  endTime: string;
}

export interface BatchMaterial {
  name: string;
  totalReal: number;
  totalExpected: number;
  unit: string;
}

export interface BatchParameter {
  name: string;
  value: number;
  target: number;
  unit: string;
  stepName: string;
  timestamp?: string; // <--- NUEVO CAMPO: Hora exacta del registro
}

export interface BatchRecord {
  CHARG_NR: string;
  TEILANL_GRUPO: string;
  productName: string;
  real_total_min: number;
  esperado_total_min: number;
  delta_total_min: number;
  idle_wall_minus_sumsteps_min: number;
  max_gap_min: number;
  timestamp: string;
  startHour: number;
  steps: BatchStep[];
  materials: BatchMaterial[];
  parameters: BatchParameter[];
  alerts: string[];
}

// --- HELPERS BÁSICOS ---

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

// --- ESTADÍSTICAS POR MÁQUINA ---

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

// --- OTRAS ESTADÍSTICAS ---

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

// --- NUEVAS FUNCIONES PARA EL DASHBOARD AVANZADO ---

export function getRecipeStats(data: BatchRecord[]) {
  const recipes = new Map<string, { count: number, totalReal: number, totalExpected: number, totalIdle: number }>();

  data.forEach(d => {
    const name = d.productName || "Desconocido";
    if (!recipes.has(name)) {
      recipes.set(name, { count: 0, totalReal: 0, totalExpected: 0, totalIdle: 0 });
    }
    const r = recipes.get(name)!;
    r.count++;
    r.totalReal += d.real_total_min;
    r.totalExpected += d.esperado_total_min;
    r.totalIdle += d.idle_wall_minus_sumsteps_min;
  });

  return Array.from(recipes.entries()).map(([name, stats]) => ({
    name,
    avgReal: Math.round(stats.totalReal / stats.count),
    avgExpected: Math.round(stats.totalExpected / stats.count),
    avgIdle: Math.round(stats.totalIdle / stats.count),
    batchCount: stats.count
  })).sort((a, b) => b.avgIdle - a.avgIdle);
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

// ===============================
//  CAPACIDAD DE PROCESO: Cp / Cpk (UTILIDADES)
// ===============================

export interface ProcessCapabilityResult {
  n: number;
  mean: number;
  sigma: number;
  lsl: number;
  usl: number;
  cp: number | null;
  cpk: number | null;
}

function _mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function _stdDevSample(values: number[]): number {
  const n = values.length;
  if (n < 2) return 0;
  const m = _mean(values);
  const varSum = values.reduce((acc, x) => acc + Math.pow(x - m, 2), 0);
  return Math.sqrt(varSum / (n - 1));
}

export function calculateCpCpk(
  values: number[],
  lsl: number,
  usl: number
): ProcessCapabilityResult {
  const n = values.length;
  const m = _mean(values);
  const s = _stdDevSample(values);

  if (n < 2 || s <= 0 || !isFinite(s) || !isFinite(lsl) || !isFinite(usl) || usl <= lsl) {
    return { n, mean: m, sigma: s, lsl, usl, cp: null, cpk: null };
  }

  const cp = (usl - lsl) / (6 * s);
  const cpu = (usl - m) / (3 * s);
  const cpl = (m - lsl) / (3 * s);
  const cpk = Math.min(cpu, cpl);

  return { n, mean: m, sigma: s, lsl, usl, cp, cpk };
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
        n: deltas.length,
        mean: _mean(deltas),
        sigma: _stdDevSample(deltas),
        lsl: null as number | null,
        usl: null as number | null,
        cp: null as number | null,
        cpk: null as number | null,
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
    const ac = a.cpk ?? -999;
    const bc = b.cpk ?? -999;
    return ac - bc;
  });
}