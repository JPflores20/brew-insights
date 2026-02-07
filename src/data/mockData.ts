// src/data/mockData.ts

export interface BatchRecord {
  CHARG_NR: string;
  TEILANL_GRUPO: string;
  real_total_min: number;
  esperado_total_min: number;
  delta_total_min: number;
  idle_wall_minus_sumsteps_min: number;
  timestamp: string;
}

// Obtener lista única de lotes
export function getUniqueBatchIds(data: BatchRecord[]): string[] {
  return Array.from(new Set(data.map(d => d.CHARG_NR))).sort();
}

// Obtener lista única de máquinas/grupos
export function getUniqueMachineGroups(data: BatchRecord[]): string[] {
  return Array.from(new Set(data.map(d => d.TEILANL_GRUPO))).sort();
}

// Filtrar datos por máquina
export function getMachineData(data: BatchRecord[], machineName: string): BatchRecord[] {
  return data.filter(d => d.TEILANL_GRUPO === machineName);
}

// Calcular promedios por máquina para las gráficas
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

// KPI: Total de lotes
export function getTotalBatches(data: BatchRecord[]): number {
  return new Set(data.map(d => d.CHARG_NR)).size;
}

// KPI: Desviación promedio global (%)
export function getAverageCycleDeviation(data: BatchRecord[]): number {
  if (data.length === 0) return 0;
  
  const validData = data.filter(d => d.esperado_total_min > 0);
  if (validData.length === 0) return 0;

  const totalDelta = validData.reduce((sum, d) => sum + d.delta_total_min, 0);
  const totalExpected = validData.reduce((sum, d) => sum + d.esperado_total_min, 0);
  
  return Math.round((totalDelta / totalExpected) * 100 * 10) / 10;
}

// KPI: Máquina con más tiempo muerto promedio (CORREGIDO)
export function getMachineWithHighestIdleTime(data: BatchRecord[]) {
  const averages = getAveragesByMachine(data);
  
  if (averages.length === 0) {
    return { machine: "N/A", idleTime: 0 };
  }
  
  // Usamos el primer elemento como base y comparamos contra él
  const highest = averages.reduce((prev, curr) => 
    (curr.avgIdle > prev.avgIdle) ? curr : prev
  );

  return { machine: highest.machine, idleTime: highest.avgIdle };
}

// Alertas: Lotes con retrasos mayores al umbral (minutos)
export function getDelayAlerts(data: BatchRecord[], threshold: number = 30): BatchRecord[] {
  return data
    .filter(d => d.delta_total_min > threshold)
    .sort((a, b) => b.delta_total_min - a.delta_total_min);
}