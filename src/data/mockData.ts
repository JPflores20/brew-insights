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
  timestamp?: string;
  dfmCode?: string;
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
  // Estructura para acumular datos
  const recipes = new Map<string, {
    uniqueBatches: Set<string>, // Para contar lotes únicos (199)
    totalRecords: number,       // Para contar operaciones totales (1065)
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

    // Agregamos al Set (solo guardará IDs únicos)
    r.uniqueBatches.add(d.CHARG_NR);
    // Incrementamos el contador de registros
    r.totalRecords++;

    // Acumulamos tiempos
    r.totalReal += d.real_total_min;
    r.totalExpected += d.esperado_total_min;
    r.totalIdle += d.idle_wall_minus_sumsteps_min;
  });

  return Array.from(recipes.entries()).map(([name, stats]) => {
    const uniqueCount = stats.uniqueBatches.size;

    return {
      name,
      // Promedios calculados por LOTE (más útil para análisis de Recetas)
      avgReal: uniqueCount > 0 ? Math.round(stats.totalReal / uniqueCount) : 0,
      avgExpected: uniqueCount > 0 ? Math.round(stats.totalExpected / uniqueCount) : 0,
      avgIdle: uniqueCount > 0 ? Math.round(stats.totalIdle / uniqueCount) : 0,

      // DEVOLVEMOS AMBOS CONTEOS:
      batchCount: uniqueCount,    // Úsalo para ver "Cantidad de Lotes" (199)
      recordCount: stats.totalRecords // Úsalo si necesitas ver "Cantidad de Pasos/Registros" (1065)
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

// --- GENERADORES DE DATOS DE TEMPERATURA PARA COMPARACIÓN ---

export interface TemperaturePoint {
  time: number; // Minutos desde el inicio
  stepName: string;
  [key: string]: number | string; // batchId1: temp1, batchId2: temp2...
}

export function generateTemperatureComparisonData(
  batchIds: string[],
  data: BatchRecord[],
  parameterName?: string
): TemperaturePoint[] {
  // En un caso real, buscaríamos los 'parameters' reales en 'data' filtrando por 'parameterName'
  // Como esto es un mock, simularemos perfiles ligeramente diferentes según el parámetro elegido

  let baseTemp = 45;
  let peakTemp = 100;

  // Ajustamos el "perfil" según el nombre del parámetro para dar sensación de realismo
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

  // Generamos puntos cada 5 minutos
  standardProfile.forEach(phase => {
    const steps = phase.duration / 5;
    const tempInc = (phase.endTemp - phase.startTemp) / steps;

    for (let i = 0; i <= steps; i++) {
      const point: TemperaturePoint = {
        time: currentTime,
        stepName: phase.step,
      };

      batchIds.forEach(id => {
        // Añadimos variabilidad aleatoria por lote para que las curvas no sean idénticas
        // Usamos el ID del lote para crear una "semilla" determinista simple
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