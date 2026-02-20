// src/types/index.ts
// Interfaces TypeScript centralizadas para todo el proyecto

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

export interface ProcessCapabilityResult {
  n: number;
  mean: number;
  sigma: number;
  lsl: number;
  usl: number;
  cp: number | null;
  cpk: number | null;
}

export interface TemperaturePoint {
  time: number; // Minutos desde el inicio
  stepName: string;
  [key: string]: number | string;
}

// Tipos de utilidad para la UI
export type ChartType = "bar" | "line" | "area" | "radar";

export interface SeriesItem {
  id: string;
  recipe: string;
  machine: string;
  batch: string;
  color: string;
}
