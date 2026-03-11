import { readFile, writeFile } from 'fs/promises';
global.alert = console.log;

function parseRawDBF(buffer) {
  const view = new DataView(buffer);
  const numRecords = view.getUint32(4, true);
  const headerBytes = view.getUint16(8, true);
  const recordBytes = view.getUint16(10, true);
  
  const fields = [];
  let offset = 32;
  while (offset < headerBytes - 1) {
    const nameBytes = new Uint8Array(buffer, offset, 11);
    let name = '';
    for (let i = 0; i < 11; i++) {
        if (nameBytes[i] === 0) break;
        name += String.fromCharCode(nameBytes[i]);
    }
    const type = String.fromCharCode(view.getUint8(offset + 11));
    const length = view.getUint8(offset + 16);
    fields.push({ name, type, length });
    offset += 32;
  }
  
  const decoder = new TextDecoder('iso-8859-1');
  const records = [];
  offset = headerBytes;
  
  for (let i = 0; i < numRecords; i++) {
    if (view.getUint8(offset) !== 0x20) { offset += recordBytes; continue; }
    
    const record = {};
    let roffset = offset + 1;
    for (const f of fields) {
      const fieldBytes = new Uint8Array(buffer, roffset, f.length);
      const str = decoder.decode(fieldBytes).trim();
      record[f.name] = str;
      roffset += f.length;
    }
    records.push(record);
    offset += recordBytes;
  }
  
  return records;
}

async function test() {
    try {
        const buffer = await readFile('public/S2600009.DBF');
        const records = parseRawDBF(buffer.buffer);
        
        // CORONA usually has "CORONA" or "CORO" in REZEPT or PRODUCT
        const corona = records.filter(r => 
            String(r.REZEPT).toUpperCase().includes('CORO') || 
            String(r.PRODUCT).toUpperCase().includes('CORO')
        );
        
        console.log(`Found ${corona.length} records for CORONA`);
        
        const groups = Array.from(new Set(corona.map(r => r.TEILANL)));
        const steps = Array.from(new Set(corona.map(r => r.GOP_BEZ || r.GOP_NAME)));
        
        const samples = corona.slice(0, 20).map(r => ({
            batch: r.CHARG_NR,
            recipe: r.REZEPT,
            teilanl: r.TEILANL,
            gop: r.GOP_BEZ,
            iw2: r.IW_DFM2,
            dim2: r.DIM_DFM2,
            iw3: r.IW_DFM3
        }));
        
        const output = {
            totalCorona: corona.length,
            uniqueGroups: groups,
            uniqueSteps: steps,
            samples
        };
        
        await writeFile('corona_inspect.json', JSON.stringify(output, null, 2));
        console.log("Written to corona_inspect.json");
    } catch (e) {
        console.error("Error", e.message, "\n", e.stack);
    }
}
test();
