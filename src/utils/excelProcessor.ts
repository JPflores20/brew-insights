import * as XLSX from 'xlsx';
import { BatchRecord } from '@/data/mockData';

// --- FUNCIONES DE LIMPIEZA (Traducción de tu Python) ---

function normalizeText(s: any): string {
  if (!s) return "";
  let str = String(s).trim();
  if (!str) return "";
  
  // Quitar acentos (NFD normalization)
  str = str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  str = str.replace(/_/g, " ").replace(/-/g, " ");
  str = str.replace(/\s+/g, " ").trim();
  return str;
}

function titleKeepAcronyms(base: string): string {
  if (!base) return "SIN_TEILANL";
  return base.split(' ').map(w => w === "ve" ? "VE" : w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function teilGroup(teil: string): string {
  const s = normalizeText(teil);
  if (!s) return "SIN_TEILANL";

  // Extraer base y número (ej. "Cocedor 1" -> base="cocedor", num="1")
  const match = s.match(/^(.*?)(?:\s+0*(\d+))?$/);
  let base = match ? match[1].trim() : s;
  const num = match ? match[2] : null;

  base = base.replace(/\s+/g, " ").trim();

  if (base.startsWith("reclamo ")) return titleKeepAcronyms(base);

  const keepNumPrefixes = [
    "cocedor", "macerador", "enfriador", "rotapool", "olla",
    "tanque", "tq", "filtro", "lavado", "trub", "ve",
    "molienda", "grits", "linea"
  ];

  if (num && keepNumPrefixes.some(p => base.startsWith(p))) {
    return `${titleKeepAcronyms(base)} ${parseInt(num)}`;
  }

  return titleKeepAcronyms(base);
}

// --- CALCULO DE TIEMPOS ---

function buildDate(row: any, prefix: string): Date | null {
  const y = row[`${prefix}_JAHR`];
  const m = row[`${prefix}_MONAT`];
  const d = row[`${prefix}_TAG`];
  const h = row[`${prefix}_STUNDE`];
  const min = row[`${prefix}_MINUTE`];
  const s = row[`${prefix}_SEKUNDE`];

  if (y == null || m == null || d == null) return null;
  
  // Ajuste año 2000 si viene como "23" o "24"
  const year = y < 100 ? y + 2000 : y;
  // Mes en JS es 0-11, Excel suele ser 1-12
  return new Date(year, m - 1, d, h || 0, min || 0, s || 0);
}

// --- PROCESADOR PRINCIPAL ---

export async function processExcelFile(file: File): Promise<BatchRecord[]> {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  // Convertir a JSON crudo
  const rawData: any[] = XLSX.utils.sheet_to_json(worksheet);

  // Mapear y calcular (equivalente a tu DataFrame en Pandas)
  const events = rawData.map(row => {
    const chargNr = String(row.CHARG_NR || row.COCIMIENTO || "").trim();
    const teilanl = String(row.TEILANL || "").trim();
    const swMin = (parseFloat(row.SW_ZEIT) || 0) / 60;
    const iwMin = (parseFloat(row.IW_ZEIT) || 0) / 60;
    
    const start = buildDate(row, "SZ");
    const end = buildDate(row, "EZ");
    
    return {
      CHARG_NR: chargNr,
      TEILANL_GRUPO: teilGroup(teilanl),
      start,
      end,
      swMin,
      iwMin,
      // Duración calculada por timestamps
      durTsMin: (start && end) ? (end.getTime() - start.getTime()) / 60000 : 0
    };
  }).filter(e => e.CHARG_NR && e.TEILANL_GRUPO !== "SIN_TEILANL");

  // Agrupar por Lote + Grupo (Group By)
  const grouped = new Map<string, BatchRecord>();

  events.forEach(evt => {
    const key = `${evt.CHARG_NR}|${evt.TEILANL_GRUPO}`;
    
    if (!grouped.has(key)) {
      grouped.set(key, {
        CHARG_NR: evt.CHARG_NR,
        TEILANL_GRUPO: evt.TEILANL_GRUPO,
        real_total_min: 0,
        esperado_total_min: 0,
        delta_total_min: 0,
        idle_wall_minus_sumsteps_min: 0,
        timestamp: evt.start ? evt.start.toISOString() : new Date().toISOString(),
        _minStart: evt.start,
        _maxEnd: evt.end,
        _sumTs: 0
      } as any);
    }

    const rec = grouped.get(key) as any;
    rec.real_total_min += evt.iwMin;
    rec.esperado_total_min += evt.swMin;
    rec._sumTs += evt.durTsMin;

    if (evt.start && (!rec._minStart || evt.start < rec._minStart)) rec._minStart = evt.start;
    if (evt.end && (!rec._maxEnd || evt.end > rec._maxEnd)) rec._maxEnd = evt.end;
  });

  // Cálculos finales (Deltas e Idle)
  return Array.from(grouped.values()).map((rec: any) => {
    // Tiempo de reloj (pared) = Fin del último paso - Inicio del primer paso
    const wallTime = (rec._minStart && rec._maxEnd) 
      ? (rec._maxEnd.getTime() - rec._minStart.getTime()) / 60000 
      : 0;

    return {
      CHARG_NR: rec.CHARG_NR,
      TEILANL_GRUPO: rec.TEILANL_GRUPO,
      real_total_min: Math.round(rec.real_total_min * 100) / 100,
      esperado_total_min: Math.round(rec.esperado_total_min * 100) / 100,
      delta_total_min: Math.round((rec.real_total_min - rec.esperado_total_min) * 100) / 100,
      // Idle = Tiempo de reloj - Suma de duraciones de pasos
      idle_wall_minus_sumsteps_min: Math.max(0, Math.round((wallTime - rec._sumTs) * 100) / 100),
      timestamp: rec.timestamp
    };
  });
}