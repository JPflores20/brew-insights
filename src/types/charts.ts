export interface TemperaturePoint {
  time: number; // Minutos desde el inicio
  stepName: string;
  [key: string]: number | string;
}

export type ChartType = "bar" | "line" | "area" | "radar" | "composed";

export interface SeriesItem {
  id: string;
  recipe: string;
  machine: string;
  batch: string;
  color: string;
}
