export interface TemperaturePoint {
  time: number; 
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
