
import { BatchRecord } from "@/types";

export function isColdBlockRecord(record: BatchRecord): boolean {
  const group = record.TEILANL_GRUPO.toUpperCase();
  const step = record.steps[0]?.stepName?.toUpperCase() || "";
  
  // Equipos comunes de bloque frío
  const coldBlockEquip = [
    'FV', 'TQF', 'TQV', 'BBT', 'TANQUE', 'TQ', 
    'RECIBIR', 'AIREACION', 'LLENAR', 'MADURACION', 'FILTRACION'
  ];
  
  return coldBlockEquip.some(e => group.includes(e)) || 
         group.includes('M1') || group.includes('M2') ||
         step.includes('FERMENTACION') || step.includes('MADURACION') || step.includes('ENFRIAMIENTO');
}

export function getColdBlockData(data: BatchRecord[]): BatchRecord[] {
  return data.filter(isColdBlockRecord);
}

export function getColdBlockMetrics(data: BatchRecord[]) {
  const coldData = getColdBlockData(data);
  const totalBatches = new Set(coldData.map(d => d.CHARG_NR)).size;
  
  // Encontrar tanques ocupados (solo contar aquellos que explícitamente son Tanques o Fermentadores)
  const tankEquips = ['TANQUE', 'FV', 'TQF', 'TQV', 'BBT'];
  const activeTanks = new Set(
    coldData
      .map(d => d.TEILANL_GRUPO)
      .filter(name => tankEquips.some(e => name.toUpperCase().includes(e)))
  ).size;
  
  // Tiempo promedio de enfriamiento/fermentación (donde aplique)
  const coolingSteps = coldData.flatMap(d => d.steps).filter(s => s.stepName.toUpperCase().includes('ENFRIAMIENTO'));
  const avgCoolingTime = coolingSteps.length > 0 
    ? Math.round(coolingSteps.reduce((acc, s) => acc + s.durationMin, 0) / coolingSteps.length)
    : 0;

  return {
    totalBatches,
    activeTanks,
    avgCoolingTime,
    recordCount: coldData.length
  };
}
