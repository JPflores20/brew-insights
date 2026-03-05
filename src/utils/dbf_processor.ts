
import { BatchRecord } from '@/types';
interface DbfField {
  name: string;
  type: string; 
  length: number;
  decimalCount: number;
  offset: number;
}
interface DbfHeader {
  recordCount: number;
  headerLength: number;
  recordLength: number;
  fields: DbfField[];
}
function parseDbfHeader(view: DataView): DbfHeader {
  const recordCount = view.getUint32(4, true);
  const headerLength = view.getUint16(8, true);
  const recordLength = view.getUint16(10, true);
  const fields: DbfField[] = [];
  let offset = 32; 
  let fieldOffset = 1; 
  while (offset < headerLength - 1) {
    if (view.getUint8(offset) === 0x0d) break;
    const nameBytes: number[] = [];
    for (let i = 0; i < 11; i++) {
      const byte = view.getUint8(offset + i);
      if (byte !== 0) nameBytes.push(byte);
    }
    const name = String.fromCharCode(...nameBytes).trim();
    const type = String.fromCharCode(view.getUint8(offset + 11));
    const length = view.getUint8(offset + 16);
    const decimalCount = view.getUint8(offset + 17);
    fields.push({ name, type, length, decimalCount, offset: fieldOffset });
    fieldOffset += length;
    offset += 32;
  }
  return { recordCount, headerLength, recordLength, fields };
}
function parseDbfRecords(
  buffer: ArrayBuffer,
  header: DbfHeader,
  encoding = 'windows-1252'
): Record<string, unknown>[] {
  const decoder = new TextDecoder(encoding);
  const bytes = new Uint8Array(buffer);
  const records: Record<string, unknown>[] = [];
  for (let r = 0; r < header.recordCount; r++) {
    const recordStart = header.headerLength + r * header.recordLength;
    const deleteFlag = bytes[recordStart];
    if (deleteFlag === 0x2a) continue; 
    const row: Record<string, unknown> = {};
    for (const field of header.fields) {
      const start = recordStart + field.offset;
      const fieldBytes = bytes.slice(start, start + field.length);
      const raw = decoder.decode(fieldBytes).trim();
      if (field.type === 'N' || field.type === 'F') {
        const num = parseFloat(raw);
        row[field.name] = isNaN(num) ? null : num;
      } else if (field.type === 'D') {
        if (raw.length === 8) {
          row[field.name] = `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
        } else {
          row[field.name] = null;
        }
      } else if (field.type === 'L') {
        row[field.name] = raw.toUpperCase() === 'T' || raw === '1';
      } else {
        row[field.name] = raw;
      }
    }
    records.push(row);
  }
  return records;
}
function normalizeText(s: unknown): string {
  if (!s) return '';
  let str = String(s).trim();
  if (!str) return '';
  str = str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  str = str.replace(/_/g, ' ').replace(/-/g, ' ');
  str = str.replace(/\s+/g, ' ').trim();
  return str;
}
function titleKeepAcronyms(base: string): string {
  if (!base) return 'SIN_TEILANL';
  return base.split(' ').map((w) => (w === 've' ? 'VE' : w.charAt(0).toUpperCase() + w.slice(1))).join(' ');
}
function teilGroup(teil: string): string {
  const s = normalizeText(teil);
  if (!s) return 'SIN_TEILANL';
  const match = s.match(/^(.*?)(?:\s+0*(\d+))?$/);
  let base = match ? match[1].trim() : s;
  const num = match ? match[2] : null;
  base = base.replace(/\s+/g, ' ').trim();
  
  // Unify any Reclamo, Descarga or Malta related records into a single "Malta [Index]" group
  const lowBase = base.toLowerCase();
  if (lowBase.includes('malta') || lowBase.includes('reclamo') || lowBase.includes('descarga')) {
    const suffix = num ? ` ${num}` : '';
    return `Malta${suffix}`;
  }

  const keepNumPrefixes = ['cocedor', 'macerador', 'enfriador', 'rotapool', 'olla', 'tanque', 'tq', 'filtro', 'lavado', 'trub', 've', 'molienda', 'grits', 'linea'];
  if (num && keepNumPrefixes.some((p) => base.startsWith(p))) {
    return `${titleKeepAcronyms(base)} ${parseInt(num)}`;
  }
  return titleKeepAcronyms(base);
}
function buildDateFromFields(row: Record<string, unknown>, prefix: string): Date | null {
  const y = row[`${prefix}_JAHR`];
  const m = row[`${prefix}_MONAT`];
  const d = row[`${prefix}_TAG`];
  const h = row[`${prefix}_STUNDE`];
  const min = row[`${prefix}_MINUTE`];
  const s = row[`${prefix}_SEKUNDE`];
  if (y == null || m == null || d == null) return null;
  const year = Number(y) < 100 ? Number(y) + 2000 : Number(y);
  return new Date(year, Number(m) - 1, Number(d), Number(h) || 0, Number(min) || 0, Number(s) || 0);
}
export async function processDbfFile(file: File): Promise<BatchRecord[]> {
  const buffer = await file.arrayBuffer();
  return processDbfBuffer(buffer);
}

export async function processDbfBuffer(buffer: ArrayBuffer): Promise<BatchRecord[]> {
  alert('PROCESANDO VERSIÓN 6.0 - SINCRONIZACIÓN DE CRITERIOS');
  console.log('[DBF_PROCESSOR] VERSION 6.0 - SYNC CRITERIA');
  const view = new DataView(buffer);
  let encoding = 'windows-1252';
  try {
    const codePageByte = view.getUint8(29);
    if (codePageByte === 0x4b) encoding = 'cp866';
    else if (codePageByte === 0x77 || codePageByte === 0x78) encoding = 'windows-1252';
  } catch {  }

  const header = parseDbfHeader(view);
  const rawData = parseDbfRecords(buffer, header, encoding);
  console.log(`[DBF] Leídos ${rawData.length} registros. Campos: ${header.fields.map(f => f.name).join(', ')}`);
  
  if (!rawData || rawData.length === 0) return [];
  
  const events = rawData.map((row) => {
    const chargNr = String(row['CHARG_NR'] ?? row['COCIMIENTO'] ?? '').trim();
    const teilanl = String(row['TEILANL'] ?? '').trim();
    const swMin = (parseFloat(String(row['SW_ZEIT'] ?? 0)) || 0) / 60;
    const iwMin = (parseFloat(String(row['IW_ZEIT'] ?? 0)) || 0) / 60;
    const start = buildDateFromFields(row, 'SZ');
    const end = buildDateFromFields(row, 'EZ');
    const startHour = row['SZ_STUNDE'] ? parseInt(String(row['SZ_STUNDE'])) : 0;
    const gopName = String(row['GOP_NAME'] ?? '').trim();
    const gopNr = String(row['GOP_NR'] ?? '').trim();
    const productName = String(row['REZEPT'] ?? row['PRODUCT'] ?? '').trim();
    
    // IW_DFM2 identifies the material/movement type ('CLO' for caramel malt, 'AM M2B' for discharge)
    // IW_DFM3 is the numeric value (kilograms)
    const raw_dfm2_class = String(row['IW_DFM2'] ?? row['IWDFM2'] ?? '').trim().toUpperCase();
    const raw_dfm3_val = parseFloat(String(row['IW_DFM3'] ?? row['IWDFM3'] ?? '')) || 0;
    const gopNameUpper = gopName.toUpperCase();

    let row_clo_val = 0;
    let row_am_m2b_val = 0;
    let row_premacerar_hl = 0;
    let row_descarga_kg = 0;

    // Numerator/Denominator: Caramel Malta Differentiation (Version 5.8)
    // Both CLO, CPLS and AM M2B are valid for numerator if under RECLAMO step
    const codesMalta = ['CLO', 'AM M28', 'CPLS', 'AM M2B'];
    
    if (codesMalta.includes(raw_dfm2_class) && gopNameUpper.includes('RECLAMO')) {
      row_clo_val = raw_dfm3_val;
    }
    if (codesMalta.includes(raw_dfm2_class) && gopNameUpper.includes('DESCARGA')) {
      row_am_m2b_val = raw_dfm3_val;
    }

    // New: Water/Malt Ratio specific extraction
    if (gopNameUpper === 'PREMACERAR MALTA') {
      row_premacerar_hl = raw_dfm3_val;
    }
    // Sincronización: Usar los mismos criterios de Malta Caramelo para los Kg
    if (codesMalta.includes(raw_dfm2_class) && gopNameUpper.includes('DESCARGA')) {
      row_descarga_kg = raw_dfm3_val;
    }

    const rowMaterials: { name: string; val: number; exp: number; unit: string }[] = [];
    const rowParams: { name: string; val: number; target: number; unit: string; dfmCode: string }[] = [];
    for (let i = 1; i <= 24; i++) {
      const name = row[`NAME_DFM${i}`];
      const val = parseFloat(String(row[`IW_DFM${i}`] ?? ''));
      const exp = parseFloat(String(row[`SW_DFM${i}`] ?? ''));
      const unit = String(row[`DIM_DFM${i}`] ?? '').trim().toLowerCase();
      if (name && !isNaN(val)) {
        const isMaterial = ['kg', 'hl', 'l', 'g', 'lbs'].includes(unit);
        const isParam = ['c', '°c', 'bar', 'mbar', 'm3/h', '%', 'rpm', 'hz', 'a'].includes(unit);
        if (isMaterial) {
          rowMaterials.push({ name: String(name).trim(), val: val || 0, exp: exp || 0, unit });
        } else if (isParam || (!isMaterial && val > 0)) {
          rowParams.push({ name: String(name).trim(), val: val || 0, target: exp || 0, unit, dfmCode: `DFM${i}` });
        }
      }
    }
    return { CHARG_NR: chargNr, TEILANL_GRUPO: teilGroup(teilanl), GOP_NAME: gopName, GOP_NR: gopNr, productName, start, end, startHour, swMin, iwMin, row_clo_val, row_am_m2b_val, row_premacerar_hl, row_descarga_kg, materials: rowMaterials, parameters: rowParams };
  }).filter((e) => e.CHARG_NR && e.TEILANL_GRUPO !== 'SIN_TEILANL');

  const groupedEvents = new Map<string, typeof events>();
  events.forEach((evt) => {
    const key = `${evt.CHARG_NR}|${evt.TEILANL_GRUPO}`;
    if (!groupedEvents.has(key)) groupedEvents.set(key, []);
    groupedEvents.get(key)!.push(evt);
  });
  const results = Array.from(groupedEvents.values()).map((group) => {
    group.sort((a, b) => (a.start?.getTime() || 0) - (b.start?.getTime() || 0));
    let real_total = 0, esperado_total = 0, total_idle = 0, max_gap = 0;
    const steps: BatchRecord['steps'] = [];
    const alerts: string[] = [];
    const materialsMap = new Map<string, BatchRecord['materials'][0]>();
    const parametersList: BatchRecord['parameters'] = [];
    let lastEnd = group[0].end?.getTime() ?? group[0].start?.getTime() ?? 0;
    let waitCounter = 0;
    
    let malta_caramelo_clo = 0;
    let descarga_am_m2b = 0;
    let foundNumerator = false;
    let lastPremacerarHl = 0;
    const aguaMaltaPoints: BatchRecord['agua_malta_points'] = [];

    group.forEach((evt, index) => {
      real_total += evt.iwMin;
      esperado_total += evt.swMin;
      if (index > 0 && evt.start) {
        const currentStart = evt.start.getTime();
        if (currentStart > lastEnd) {
          const gapMin = (currentStart - lastEnd) / 60000;
          if (gapMin > 0) {
            total_idle += gapMin;
            if (gapMin > max_gap) max_gap = gapMin;
            waitCounter++;
            steps.push({ stepName: `⏳ Espera ${waitCounter}`, stepNr: '', durationMin: +gapMin.toFixed(2), expectedDurationMin: 0, startTime: new Date(lastEnd).toISOString(), endTime: evt.start.toISOString() });
            if (gapMin > 15) alerts.push(`Espera de ${Math.round(gapMin)} min antes de ${evt.GOP_NAME}`);
          }
        }
      }
      evt.materials.forEach((mat) => {
        const key = `${mat.name}_${mat.unit}`;
        if (!materialsMap.has(key)) materialsMap.set(key, { name: mat.name, totalReal: 0, totalExpected: 0, unit: mat.unit });
        const existing = materialsMap.get(key)!;
        existing.totalReal += mat.val;
        existing.totalExpected += mat.exp;
      });
      evt.parameters.forEach((param) => {
        parametersList.push({ name: param.name, value: param.val, target: param.target, unit: param.unit, stepName: evt.GOP_NAME, timestamp: evt.start?.toISOString(), dfmCode: param.dfmCode });
      });
      steps.push({ stepName: evt.GOP_NAME || `Paso ${index + 1}`, stepNr: evt.GOP_NR, durationMin: +evt.iwMin.toFixed(2), expectedDurationMin: +evt.swMin.toFixed(2), startTime: evt.start?.toISOString() ?? '', endTime: evt.end?.toISOString() ?? '' });
      if (evt.end && evt.end.getTime() > lastEnd) lastEnd = evt.end.getTime();
      
      // RULE: Only take the FIRST non-zero occurrence for Reclamo Malta per group
      if (!foundNumerator && (evt.row_clo_val || 0) > 0) {
        malta_caramelo_clo = evt.row_clo_val;
        foundNumerator = true;
      }
      
      descarga_am_m2b += (evt.row_am_m2b_val || 0);

      // New: Collect Water/Malt Ratio points
      if (evt.row_premacerar_hl > 0) {
        lastPremacerarHl = evt.row_premacerar_hl;
      }
      if (evt.row_descarga_kg > 0 && lastPremacerarHl > 0) {
        aguaMaltaPoints.push({ aguaHl: lastPremacerarHl, maltaKg: evt.row_descarga_kg, stepName: evt.GOP_NAME });
      }
    });
    return {
      CHARG_NR: group[0].CHARG_NR,
      TEILANL_GRUPO: group[0].TEILANL_GRUPO,
      productName: group[0].productName || 'Desconocido',
      real_total_min: +(real_total.toFixed(2)),
      esperado_total_min: +(esperado_total.toFixed(2)),
      delta_total_min: +((real_total - esperado_total).toFixed(2)),
      idle_wall_minus_sumsteps_min: +(total_idle.toFixed(2)),
      max_gap_min: +(max_gap.toFixed(2)),
      timestamp: group[0].start?.toISOString() ?? new Date().toISOString(),
      startHour: group[0].startHour,
      malta_caramelo_clo,
      descarga_am_m2b,
      agua_malta_points: aguaMaltaPoints,
      steps,
      materials: Array.from(materialsMap.values()),
      parameters: parametersList,
      alerts,
    } satisfies BatchRecord;
  });

  const validCount = results.filter(r => (r.malta_caramelo_clo || 0) > 0 && (r.descarga_am_m2b || 0) > 0).length;
  console.log(`[DBF_FINAL] processed=${results.length} withMaltaData=${validCount}`);
  if (validCount > 0) {
    const sample = results.find(r => (r.malta_caramelo_clo || 0) > 0 && (r.descarga_am_m2b || 0) > 0);
    console.log(`[DBF_SAMPLE] Batch=${sample?.CHARG_NR} Recipe=${sample?.productName} CLO=${sample?.malta_caramelo_clo} M2B=${sample?.descarga_am_m2b}`);
  }
  return results;
}
