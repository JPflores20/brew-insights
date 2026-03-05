
import { BatchRecord } from "@/types";

const now = new Date();
const subHours = (d: Date, h: number) => new Date(d.getTime() - h * 60 * 60 * 1000);

export const DEMO_DATA: BatchRecord[] = [
  {
    CHARG_NR: "DEMO-001",
    TEILANL_GRUPO: "Macerador A",
    productName: "Corona Extra",
    real_total_min: 135,
    esperado_total_min: 120,
    delta_total_min: 15,
    idle_wall_minus_sumsteps_min: 5,
    max_gap_min: 2,
    timestamp: subHours(now, 48).toISOString(),
    startHour: 8,
    steps: [
      {
        stepName: "Calentar_Flujo",
        stepNr: "001",
        durationMin: 20,
        expectedDurationMin: 15,
        startTime: subHours(now, 48).toISOString(),
        endTime: new Date(subHours(now, 48).getTime() + 20 * 60000).toISOString(),
      },
      {
        stepName: "Agua Mosto",
        stepNr: "002",
        durationMin: 45,
        expectedDurationMin: 40,
        startTime: new Date(subHours(now, 48).getTime() + 30 * 60000).toISOString(),
        endTime: new Date(subHours(now, 48).getTime() + 75 * 60000).toISOString(),
      },
      {
        stepName: "Hervido",
        stepNr: "003",
        durationMin: 60,
        expectedDurationMin: 60,
        startTime: new Date(subHours(now, 48).getTime() + 80 * 60000).toISOString(),
        endTime: new Date(subHours(now, 48).getTime() + 140 * 60000).toISOString(),
      },
      {
        stepName: "Reclamo de malta 1",
        stepNr: "004",
        durationMin: 15,
        expectedDurationMin: 10,
        startTime: new Date(subHours(now, 48).getTime() + 140 * 60000).toISOString(),
        endTime: new Date(subHours(now, 48).getTime() + 155 * 60000).toISOString(),
      }
    ],
    malta_caramelo_clo: 450,
    descarga_am_m2b: 980,
    materials: [
      { name: "Agua", totalReal: 480, totalExpected: 500, unit: "hl" },
      { name: "Arroz", totalReal: 135, totalExpected: 140, unit: "kg" },
      { name: "Malta Caramelo", totalReal: 320, totalExpected: 350, unit: "kg" }
    ],
    parameters: [],
    alerts: []
  },
  {
    CHARG_NR: "DEMO-002",
    TEILANL_GRUPO: "Macerador B",
    productName: "Victoria",
    real_total_min: 140,
    esperado_total_min: 125,
    delta_total_min: 15,
    idle_wall_minus_sumsteps_min: 8,
    max_gap_min: 3,
    timestamp: subHours(now, 45).toISOString(),
    startHour: 11,
    steps: [
      {
        stepName: "Calentar_Flujo",
        stepNr: "001",
        durationMin: 22,
        expectedDurationMin: 15,
        startTime: subHours(now, 45).toISOString(),
        endTime: new Date(subHours(now, 45).getTime() + 22 * 60000).toISOString(),
      },
      {
        stepName: "Agua Mosto",
        stepNr: "002",
        durationMin: 48,
        expectedDurationMin: 40,
        startTime: new Date(subHours(now, 45).getTime() + 40 * 60000).toISOString(),
        endTime: new Date(subHours(now, 45).getTime() + 88 * 60000).toISOString(),
      },
      {
        stepName: "Reclamo de malta 2",
        stepNr: "003",
        durationMin: 20,
        expectedDurationMin: 15,
        startTime: new Date(subHours(now, 45).getTime() + 88 * 60000).toISOString(),
        endTime: new Date(subHours(now, 45).getTime() + 108 * 60000).toISOString(),
      }
    ],
    malta_caramelo_clo: 480,
    descarga_am_m2b: 1045,
    materials: [
      { name: "Agua Fria", totalReal: 520, totalExpected: 500, unit: "hl" },
      { name: "Arroz Extra", totalReal: 140, totalExpected: 140, unit: "kg" },
      { name: "Malta Base", totalReal: 410, totalExpected: 420, unit: "kg" }
    ],
    parameters: [],
    alerts: ["Desviación en Agua Mosto"]
  },
  {
    CHARG_NR: "DEMO-003",
    TEILANL_GRUPO: "Macerador A",
    productName: "Corona Extra",
    real_total_min: 125,
    esperado_total_min: 120,
    delta_total_min: 5,
    idle_wall_minus_sumsteps_min: 2,
    max_gap_min: 1,
    timestamp: subHours(now, 42).toISOString(),
    startHour: 14,
    steps: [
      {
        stepName: "Calentar_Flujo",
        stepNr: "001",
        durationMin: 18,
        expectedDurationMin: 15,
        startTime: subHours(now, 42).toISOString(),
        endTime: new Date(subHours(now, 42).getTime() + 18 * 60000).toISOString(),
      },
      {
        stepName: "Agua Mosto",
        stepNr: "002",
        durationMin: 42,
        expectedDurationMin: 40,
        startTime: new Date(subHours(now, 42).getTime() + 25 * 60000).toISOString(),
        endTime: new Date(subHours(now, 42).getTime() + 67 * 60000).toISOString(),
      }
    ],
    malta_caramelo_clo: 0,
    descarga_am_m2b: 460,
    materials: [
      { name: "Agua Tratada", totalReal: 495, totalExpected: 500, unit: "hl" },
      { name: "Adjunto", totalReal: 138, totalExpected: 140, unit: "kg" }
    ],
    parameters: [],
    alerts: []
  },
  {
    CHARG_NR: "DEMO-004",
    TEILANL_GRUPO: "Macerador B",
    productName: "Modelo Especial",
    real_total_min: 150,
    esperado_total_min: 130,
    delta_total_min: 20,
    idle_wall_minus_sumsteps_min: 12,
    max_gap_min: 5,
    timestamp: subHours(now, 38).toISOString(),
    startHour: 18,
    steps: [
      {
        stepName: "Calentar_Flujo",
        stepNr: "001",
        durationMin: 25,
        expectedDurationMin: 15,
        startTime: subHours(now, 38).toISOString(),
        endTime: new Date(subHours(now, 38).getTime() + 25 * 60000).toISOString(),
      },
      {
        stepName: "Agua Mosto",
        stepNr: "002",
        durationMin: 50,
        expectedDurationMin: 40,
        startTime: new Date(subHours(now, 38).getTime() + 45 * 60000).toISOString(),
        endTime: new Date(subHours(now, 38).getTime() + 95 * 60000).toISOString(),
      }
    ],
    malta_caramelo_clo: 500,
    descarga_am_m2b: 1100,
    materials: [
      { name: "Agua", totalReal: 510, totalExpected: 500, unit: "hl" },
      { name: "Arroz Miga", totalReal: 145, totalExpected: 140, unit: "kg" }
    ],
    parameters: [],
    alerts: ["Tiempo muerto elevado"]
  }
];
