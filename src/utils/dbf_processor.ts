
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
  return base
    .split(' ')
    .filter(Boolean)
    .map((w) => (w === 've' ? 'VE' : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(' ');
}
function teilGroup(teil: string, dfm3?: string, rezeptNr?: string): string {
  if (!teil) return 'SIN_TEILANL';
  const rawTeil = String(teil).trim();
  const s = normalizeText(rawTeil);
  if (!s) return 'SIN_TEILANL';

  // Collapse dots and spaces into single spaces for consistency
  const cleaned = s.replace(/\./g, ' ').replace(/\s+/g, ' ').trim();

  // Specific check for Kraeusen tanks to keep them looking like the DBF but readable
  if (cleaned.includes('kraeus')) {
    return titleKeepAcronyms(cleaned);
  }

  return titleKeepAcronyms(cleaned);
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
  console.log('[DBF_PROCESSOR] VERSION 6.1 - TANK NR FROM DFM3');
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
  
  const events = rawData.map((row, idx) => {
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
    
    // IW_DFM3 usually contains the Tank Number in Cold Block
    const raw_dfm3_val_str = String(row['IW_DFM3'] ?? row['IWDFM3'] ?? '').trim();
    
    // IW_DFM2 identifies the material/movement type ('CLO' for caramel malt, 'AM M2B' for discharge)
    // IW_DFM3 is the numeric value (kilograms) in Hot Block, but Tank Nr in some Cold Block records
    const raw_dfm2_class = String(row['IW_DFM2'] ?? row['IWDFM2'] ?? '').trim().toUpperCase();
    const raw_dfm2_num = parseFloat(String(row['IW_DFM2'] ?? row['IWDFM2'] ?? '')) || 0;
    const raw_dim_dfm2 = String(row['DIM_DFM2'] ?? '').trim().toLowerCase();
    const raw_dfm3_val = parseFloat(raw_dfm3_val_str) || 0;
    const gopNameUpper = gopName.toUpperCase();

    let row_clo_val = 0;
    let row_am_m2b_val = 0;
    let row_premacerar_hl = 0;
    let row_descarga_kg = 0;

    const codesMalta = ['CLO', 'AM M28', 'CPLS', 'AM M2B'];
    
    if (codesMalta.includes(raw_dfm2_class) && gopNameUpper.includes('RECLAMO')) {
      row_clo_val = raw_dfm3_val;
    }
    if (codesMalta.includes(raw_dfm2_class) && gopNameUpper.includes('DESCARGA')) {
      row_am_m2b_val = raw_dfm3_val;
    }

    if (gopNameUpper === 'PREMACERAR MALTA') {
      row_premacerar_hl = raw_dfm3_val;
    }
    if (codesMalta.includes(raw_dfm2_class) && gopNameUpper.includes('DESCARGA')) {
      row_descarga_kg = raw_dfm3_val;
    }

    const rowMaterials: { name: string; val: number; exp: number; unit: string }[] = [];
    const rowParams: { name: string; val: number; target: number; unit: string; dfmCode: string }[] = [];
    for (let i = 1; i <= 24; i++) {
      let name = String(row[`NAME_DFM${i}`] ?? '').trim();
      const val = parseFloat(String(row[`IW_DFM${i}`] ?? ''));
      const exp = parseFloat(String(row[`SW_DFM${i}`] ?? ''));
      let unit = String(row[`DIM_DFM${i}`] ?? '').trim().toLowerCase();

      if (name && !isNaN(val)) {
        const nameUpper = name.toUpperCase();
        // Normalize Cold Block parameters
        if (unit === 'gg-%' || nameUpper.includes('EXTRACT')) {
          name = 'Extracto (Plato)';
          unit = '°P';
        } else if (unit.includes('c') || nameUpper.includes('TEM.')) {
          if (nameUpper.includes('REG.')) name = 'Temp. Consigna';
          else name = 'Temp. Tanque';
          unit = '°C';
        } else if (nameUpper.includes('PH')) {
          name = 'pH';
          unit = 'pH';
        }

        const isMaterial = ['kg', 'hl', 'l', 'g', 'lbs'].includes(unit);
        const isParam = ['c', '°c', '°p', 'ph', 'bar', 'mbar', 'm3/h', '%', 'rpm', 'hz', 'a'].includes(unit);
        if (isMaterial) {
          rowMaterials.push({ name: name.trim(), val: val || 0, exp: exp || 0, unit });
        } else if (isParam || (!isMaterial && val > 0)) {
          rowParams.push({ name: name.trim(), val: val || 0, target: exp || 0, unit, dfmCode: `DFM${i}` });
        }
      }
    }
    const rezeptNr = String(row['REZEPT_NR'] ?? '').trim();

    const isMostoStep = gopNameUpper.includes('PRIMER MOSTO') || gopNameUpper.includes('PRIMERO MOST');
    if (isMostoStep && raw_dfm2_num > 0 && idx < 50) {
       console.log(`[DBF_DEBUG] Paso: ${gopName}, Valor: ${raw_dfm2_num}, Lote: ${chargNr}`);
    }

    return { 
      CHARG_NR: chargNr, 
      TEILANL_GRUPO: teilGroup(teilanl, raw_dfm3_val_str, rezeptNr), 
      GOP_NAME: gopName, 
      GOP_NR: gopNr, 
      productName, 
      start, 
      end, 
      startHour, 
      swMin, 
      iwMin, 
      row_clo_val, 
      row_am_m2b_val, 
      row_premacerar_hl, 
      row_descarga_kg, 
      row_dfm2_hl: isMostoStep ? raw_dfm2_num : (raw_dim_dfm2 === 'hl' ? raw_dfm2_num : 0), 
      row_dfm2_kg: raw_dim_dfm2 === 'kg' ? raw_dfm2_num : 0, 
      materials: rowMaterials, 
      parameters: rowParams 
    };
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
    const stepOccurrences = new Map<string, number>();
    
    let malta_caramelo_clo = 0;
    let descarga_am_m2b = 0;
    let foundNumerator = false;
    let lastPremacerarHl = 0;
    const aguaMaltaPoints: BatchRecord['agua_malta_points'] = [];
    let max_agua_dfm2_hl = 0;
    let max_adjuntos_dfm2_kg = 0;
    let mosto_volume_hl = 0;
    let emo_iw_dfm8: number | undefined;

    group.forEach((evt, index) => {
      if (evt.row_dfm2_hl > max_agua_dfm2_hl) max_agua_dfm2_hl = evt.row_dfm2_hl;
      if (evt.row_dfm2_kg > max_adjuntos_dfm2_kg) max_adjuntos_dfm2_kg = evt.row_dfm2_kg;

      real_total += evt.iwMin;
      esperado_total += evt.swMin;
      
      let gopNameDisplay = evt.GOP_NAME || `Paso ${index + 1}`;
      if (gopNameDisplay.toUpperCase().includes('PAUSA')) {
        const occ = (stepOccurrences.get(gopNameDisplay) || 0) + 1;
        stepOccurrences.set(gopNameDisplay, occ);
        if (occ > 1) {
          gopNameDisplay = `${gopNameDisplay} (${occ})`;
        }
      }

      if (index > 0 && evt.start) {
        const currentStart = evt.start.getTime();
        if (currentStart > lastEnd) {
          const gapMin = (currentStart - lastEnd) / 60000;
          if (gapMin > 0) {
            total_idle += gapMin;
            if (gapMin > max_gap) max_gap = gapMin;
            waitCounter++;
            steps.push({ stepName: `⏳ Espera ${waitCounter}`, stepNr: '', durationMin: +gapMin.toFixed(2), expectedDurationMin: 0, startTime: new Date(lastEnd).toISOString(), endTime: evt.start.toISOString() });
            if (gapMin > 15) alerts.push(`Espera de ${Math.round(gapMin)} min antes de ${gopNameDisplay}`);
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
        parametersList.push({ name: param.name, value: param.val, target: param.target, unit: param.unit, stepName: gopNameDisplay, timestamp: evt.start?.toISOString(), dfmCode: param.dfmCode });
      });
      steps.push({ stepName: gopNameDisplay, stepNr: evt.GOP_NR, durationMin: +evt.iwMin.toFixed(2), expectedDurationMin: +evt.swMin.toFixed(2), startTime: evt.start?.toISOString() ?? '', endTime: evt.end?.toISOString() ?? '' });
      if (evt.end && evt.end.getTime() > lastEnd) lastEnd = evt.end.getTime();
      
      if (!foundNumerator && (evt.row_clo_val || 0) > 0) {
        malta_caramelo_clo = evt.row_clo_val;
        foundNumerator = true;
      }
      
      descarga_am_m2b += (evt.row_am_m2b_val || 0);

      if (evt.row_premacerar_hl > 0) {
        lastPremacerarHl = evt.row_premacerar_hl;
      }
      if (evt.row_descarga_kg > 0 && lastPremacerarHl > 0) {
        aguaMaltaPoints.push({ aguaHl: lastPremacerarHl, maltaKg: evt.row_descarga_kg, stepName: evt.GOP_NAME });
      }

      if (evt.GOP_NAME?.toUpperCase().includes('PRIMER MOSTO') || evt.GOP_NAME?.toUpperCase().includes('PRIMERO MOST')) {
        mosto_volume_hl = Math.max(mosto_volume_hl, evt.row_dfm2_hl);
      }

      const emoParam = evt.parameters.find(p => 
        p.dfmCode === 'DFM8' || 
        p.dfmCode === 'DFM08' || 
        p.name?.toUpperCase().includes('PROMEDIO_EMO') ||
        p.name?.toUpperCase().includes('PROMEDIO EMO')
      );
      if (emoParam && emo_iw_dfm8 === undefined) {
        emo_iw_dfm8 = emoParam.val;
      }
    });
    return {
      CHARG_NR: group[0].CHARG_NR,
      TEILANL_GRUPO: group[0].TEILANL_GRUPO,
      productName: [...group].reverse().find(e => e.productName && !['Desconocido', 'SIN_PRODUCTO', 'ALL', 'PRODUCTO'].includes(e.productName))?.productName || group[0].productName || 'Desconocido',
      real_total_min: +(real_total.toFixed(2)),
      esperado_total_min: +(esperado_total.toFixed(2)),
      delta_total_min: +((real_total - esperado_total).toFixed(2)),
      idle_wall_minus_sumsteps_min: +(total_idle.toFixed(2)),
      max_gap_min: +(max_gap.toFixed(2)),
      timestamp: group[0].start?.toISOString() ?? new Date().toISOString(),
      startHour: group[0].startHour,
      emo_iw_dfm8,
      malta_caramelo_clo,
      descarga_am_m2b,
      agua_malta_points: aguaMaltaPoints,
      max_agua_dfm2_hl,
      max_adjuntos_dfm2_kg,
      mosto_volume_hl,
      steps,
      materials: Array.from(materialsMap.values()),
      parameters: parametersList,
      alerts,
    } satisfies BatchRecord;
  });

  const validCount = results.filter(r => (r.malta_caramelo_clo || 0) > 0 && (r.descarga_am_m2b || 0) > 0).length;
  console.log(`[DBF_FINAL] processed=${results.length} withMaltaData=${validCount}`);
  return results;
}
export function mergeBatchRecords(records: BatchRecord[]): BatchRecord[] {
  const grouped = new Map<string, BatchRecord[]>();
  
  records.forEach(r => {
    const key = `${r.CHARG_NR.trim()}|${r.TEILANL_GRUPO.trim()}`;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(r);
  });

  return Array.from(grouped.values()).map(group => {
    if (group.length === 1) return group[0];

    // Merge group
    const first = group[0];
    const allSteps = group.flatMap(g => g.steps);
    const allParams = group.flatMap(g => g.parameters);
    const allMaterials = group.flatMap(g => g.materials);
    const allAlerts = group.flatMap(g => g.alerts || []);
    const allAguaMalta = group.flatMap(g => g.agua_malta_points || []);

    // Unique steps by name and startTime to avoid exact duplicates
    const uniqueStepsMap = new Map<string, BatchRecord['steps'][0]>();
    allSteps.forEach(s => {
      const sKey = `${s.stepName}|${s.startTime}`;
      if (!uniqueStepsMap.has(sKey)) uniqueStepsMap.set(sKey, s);
    });

    // Pick best product name (one that isn't 'Desconocido')
    const bestProduct = group.map(g => g.productName).find(p => p && !['Desconocido', 'SIN_PRODUCTO', 'ALL', 'PRODUCTO'].includes(p)) || first.productName;

    return {
      ...first,
      productName: bestProduct,
      steps: Array.from(uniqueStepsMap.values()).sort((a, b) => a.startTime.localeCompare(b.startTime)),
      parameters: allParams.sort((a, b) => (a.timestamp || '').localeCompare(b.timestamp || '')),
      materials: allMaterials, // Could be grouped too but usually fine
      alerts: Array.from(new Set(allAlerts)),
      agua_malta_points: allAguaMalta,
      mosto_volume_hl: group.reduce((maxVal, g) => Math.max(maxVal, g.mosto_volume_hl || 0), 0),
      real_total_min: group.reduce((sum, g) => sum + (g.real_total_min || 0), 0),
      esperado_total_min: group.reduce((sum, g) => sum + (g.esperado_total_min || 0), 0),
      // Recalculate other totals if needed
    };
  });
}
