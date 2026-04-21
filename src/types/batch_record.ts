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
  emo_iw_dfm8?: number;
  malta_caramelo_clo?: number;
  descarga_am_m2b?: number;
  agua_malta_points?: { aguaHl: number; maltaKg: number; stepName: string }[];
  max_agua_dfm2_hl?: number;
  max_adjuntos_dfm2_kg?: number;
  mosto_volume_hl?: number;
  steps: BatchStep[];
  materials: BatchMaterial[];
  parameters: BatchParameter[];
  alerts: string[];
}
