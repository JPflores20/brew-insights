import * as XLSX from 'xlsx';
import { BatchRecord, BatchStep } from '@/data/mockData';

// --- FUNCIONES DE LIMPIEZA ---

function normalizeText(s: any): string {
  if (!s) return "";
  let str = String(s).trim();
  if (!str) return "";
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

function buildDate(row: any, prefix: string): Date | null {
  const y = row[`${prefix}_JAHR`];
  const m = row[`${prefix}_MONAT`];
  const d = row[`${prefix}_TAG`];
  const h = row[`${prefix}_STUNDE`];
  const min = row[`${prefix}_MINUTE`];
  const s = row[`${prefix}_SEKUNDE`];
  if (y == null || m == null || d == null) return null;
  const year = y < 100 ? y + 2000 : y;
  return new Date(year, m - 1, d, h || 0, min || 0, s || 0);
}

// --- PROCESADOR PRINCIPAL ---

export async function processExcelFile(file: File): Promise<BatchRecord[]> {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rawData: any[] = XLSX.utils.sheet_to_json(worksheet);

  // 1. Mapear eventos crudos
  const events = rawData.map(row => {
    const chargNr = String(row.CHARG_NR || row.COCIMIENTO || "").trim();
    const teilanl = String(row.TEILANL || "").trim();
    const swMin = (parseFloat(row.SW_ZEIT) || 0) / 60;
    const iwMin = (parseFloat(row.IW_ZEIT) || 0) / 60;
    const start = buildDate(row, "SZ");
    const end = buildDate(row, "EZ");
    
    // Capturamos el nombre y número del paso
    const gopName = String(row.GOP_NAME || "").trim();
    const gopNr = String(row.GOP_NR || "").trim();

    return {
      CHARG_NR: chargNr,
      TEILANL_GRUPO: teilGroup(teilanl),
      GOP_NAME: gopName,
      GOP_NR: gopNr,
      start,
      end,
      swMin,
      iwMin,
    };
  }).filter(e => e.CHARG_NR && e.TEILANL_GRUPO !== "SIN_TEILANL");

  // 2. Agrupar eventos por Lote + Grupo
  const groupedEvents = new Map<string, any[]>();
  events.forEach(evt => {
    const key = `${evt.CHARG_NR}|${evt.TEILANL_GRUPO}`;
    if (!groupedEvents.has(key)) groupedEvents.set(key, []);
    groupedEvents.get(key)?.push(evt);
  });

  // 3. Procesar cada grupo para crear el registro BatchRecord completo
  return Array.from(groupedEvents.values()).map(group => {
    // Ordenar cronológicamente
    group.sort((a, b) => (a.start?.getTime() || 0) - (b.start?.getTime() || 0));

    let real_total = 0;
    let esperado_total = 0;
    let total_idle = 0;
    let max_gap = 0;
    
    // Array para guardar los pasos detallados
    const steps: BatchStep[] = [];
    const alerts: string[] = [];

    let lastEnd = group[0].end ? group[0].end.getTime() : (group[0].start?.getTime() || 0);
    
    // CONTADOR PARA LAS ESPERAS
    let waitCounter = 0;

    group.forEach((evt, index) => {
      real_total += evt.iwMin;
      esperado_total += evt.swMin;

      // DETECCIÓN DE HUECOS (TIEMPOS MUERTOS)
      if (index > 0 && evt.start) {
        const currentStart = evt.start.getTime();
        
        // Si hay un espacio entre el final anterior y el inicio actual
        if (currentStart > lastEnd) {
          const gapMs = currentStart - lastEnd;
          const gapMin = gapMs / 60000;
          
          if (gapMin > 0) {
             total_idle += gapMin;
             if (gapMin > max_gap) max_gap = gapMin;
             
             // Incrementamos el contador de esperas para este lote
             waitCounter++;

             // Insertamos el paso de espera con nombre único
             steps.push({
               stepName: `⏳ Espera ${waitCounter}`,
               stepNr: "", 
               durationMin: Number(gapMin.toFixed(2)),
               expectedDurationMin: 0,
               startTime: new Date(lastEnd).toISOString(),
               endTime: evt.start.toISOString()
             });
             
             // Alerta si es una espera larga (>15 min)
             if (gapMin > 15) {
                alerts.push(`Espera de ${Math.round(gapMin)} min detectada antes de ${evt.GOP_NAME}`);
             }
          }
        }
      }

      // Insertamos el paso real del proceso
      steps.push({
        stepName: evt.GOP_NAME || `Paso ${index + 1}`,
        stepNr: evt.GOP_NR,
        durationMin: Math.round(evt.iwMin * 100) / 100,
        expectedDurationMin: Math.round(evt.swMin * 100) / 100,
        startTime: evt.start ? evt.start.toISOString() : "",
        endTime: evt.end ? evt.end.toISOString() : ""
      });

      // Actualizamos lastEnd
      if (evt.end && evt.end.getTime() > lastEnd) {
        lastEnd = evt.end.getTime();
      }
    });

    return {
      CHARG_NR: group[0].CHARG_NR,
      TEILANL_GRUPO: group[0].TEILANL_GRUPO,
      real_total_min: Math.round(real_total * 100) / 100,
      esperado_total_min: Math.round(esperado_total * 100) / 100,
      delta_total_min: Math.round((real_total - esperado_total) * 100) / 100,
      idle_wall_minus_sumsteps_min: Math.round(total_idle * 100) / 100,
      max_gap_min: Math.round(max_gap * 100) / 100,
      timestamp: group[0].start ? group[0].start.toISOString() : new Date().toISOString(),
      steps: steps,
      alerts: alerts
    };
  });
}