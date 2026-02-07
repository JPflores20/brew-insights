// Mock brewing production data for BrewCycle Analytics

export interface BatchRecord {
  CHARG_NR: string;
  TEILANL_GRUPO: string;
  real_total_min: number;
  esperado_total_min: number;
  delta_total_min: number;
  idle_wall_minus_sumsteps_min: number;
  timestamp: string;
}

export interface MachineGroup {
  name: string;
  displayName: string;
}

export const machineGroups: MachineGroup[] = [
  { name: "Cocedor 1", displayName: "Cocedor 1" },
  { name: "Cocedor 2", displayName: "Cocedor 2" },
  { name: "Macerador 1", displayName: "Macerador 1" },
  { name: "Macerador 2", displayName: "Macerador 2" },
  { name: "Filtro 1", displayName: "Filtro 1" },
  { name: "Filtro 2", displayName: "Filtro 2" },
];

// Generate realistic batch IDs
const batchIds = [
  "76E15543", "76E15544", "76E15545", "76E15546", "76E15547",
  "76E15548", "76E15549", "76E15550", "76E15551", "76E15552",
  "76E15553", "76E15554", "76E15555", "76E15556", "76E15557",
  "76E15558", "76E15559", "76E15560", "76E15561", "76E15562",
  "76E15563", "76E15564", "76E15565", "76E15566", "76E15567",
];

// Expected times per machine group (in minutes)
const expectedTimes: Record<string, number> = {
  "Cocedor 1": 120,
  "Cocedor 2": 115,
  "Macerador 1": 90,
  "Macerador 2": 85,
  "Filtro 1": 60,
  "Filtro 2": 55,
};

// Generate mock data with realistic variations
function generateMockData(): BatchRecord[] {
  const data: BatchRecord[] = [];
  
  batchIds.forEach((batchId, batchIndex) => {
    machineGroups.forEach((machine) => {
      const expected = expectedTimes[machine.name];
      
      // Add some realistic variation (-15% to +40%)
      // Some batches intentionally have larger delays
      const hasDelay = Math.random() < 0.15; // 15% chance of significant delay
      const variation = hasDelay 
        ? (0.3 + Math.random() * 0.2) // 30-50% over expected
        : (-0.15 + Math.random() * 0.3); // -15% to +15%
      
      const real = Math.round(expected * (1 + variation));
      const delta = real - expected;
      
      // Idle time correlates somewhat with delays
      const idle = hasDelay
        ? Math.round(15 + Math.random() * 35) // 15-50 min idle
        : Math.round(2 + Math.random() * 12); // 2-14 min idle
      
      // Generate timestamp (spread over last 30 days)
      const date = new Date();
      date.setDate(date.getDate() - (batchIds.length - batchIndex));
      date.setHours(6 + Math.floor(Math.random() * 12));
      
      data.push({
        CHARG_NR: batchId,
        TEILANL_GRUPO: machine.name,
        real_total_min: real,
        esperado_total_min: expected,
        delta_total_min: delta,
        idle_wall_minus_sumsteps_min: idle,
        timestamp: date.toISOString(),
      });
    });
  });
  
  return data;
}

export const batchData: BatchRecord[] = generateMockData();

// Helper functions for data aggregation
export function getUniqueBatchIds(): string[] {
  return [...new Set(batchData.map(d => d.CHARG_NR))];
}

export function getUniqueMachineGroups(): string[] {
  return [...new Set(batchData.map(d => d.TEILANL_GRUPO))];
}

export function getBatchById(batchId: string): BatchRecord[] {
  return batchData.filter(d => d.CHARG_NR === batchId);
}

export function getMachineData(machineName: string): BatchRecord[] {
  return batchData.filter(d => d.TEILANL_GRUPO === machineName);
}

export function getAveragesByMachine(): { 
  machine: string; 
  avgReal: number; 
  avgExpected: number; 
  avgDelta: number;
  avgIdle: number;
}[] {
  return machineGroups.map(machine => {
    const machineRecords = getMachineData(machine.name);
    const count = machineRecords.length;
    
    return {
      machine: machine.name,
      avgReal: Math.round(machineRecords.reduce((sum, r) => sum + r.real_total_min, 0) / count),
      avgExpected: Math.round(machineRecords.reduce((sum, r) => sum + r.esperado_total_min, 0) / count),
      avgDelta: Math.round(machineRecords.reduce((sum, r) => sum + r.delta_total_min, 0) / count),
      avgIdle: Math.round(machineRecords.reduce((sum, r) => sum + r.idle_wall_minus_sumsteps_min, 0) / count),
    };
  });
}

export function getDelayAlerts(threshold: number = 30): BatchRecord[] {
  return batchData
    .filter(d => d.delta_total_min > threshold)
    .sort((a, b) => b.delta_total_min - a.delta_total_min);
}

export function getTotalBatches(): number {
  return getUniqueBatchIds().length;
}

export function getAverageCycleDeviation(): number {
  const allDeltas = batchData.map(d => d.delta_total_min);
  const avgDelta = allDeltas.reduce((sum, d) => sum + d, 0) / allDeltas.length;
  const avgExpected = batchData.reduce((sum, d) => sum + d.esperado_total_min, 0) / batchData.length;
  return Math.round((avgDelta / avgExpected) * 100 * 10) / 10;
}

export function getMachineWithHighestIdleTime(): { machine: string; idleTime: number } {
  const averages = getAveragesByMachine();
  const highest = averages.reduce((prev, curr) => 
    curr.avgIdle > prev.avgIdle ? curr : prev
  );
  return { machine: highest.machine, idleTime: highest.avgIdle };
}
