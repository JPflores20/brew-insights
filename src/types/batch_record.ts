import { BatchStep } from "./batch_step";
import { BatchMaterial } from "./batch_material";
import { BatchParameter } from "./batch_parameter";

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
