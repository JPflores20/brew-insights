import { readFile, writeFile } from 'fs/promises';

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
        
        const corona = records.filter(r => 
            String(r.REZEPT).toUpperCase().includes('CORO') || 
            String(r.PRODUCT).toUpperCase().includes('CORO')
        );
        
        const results = [];
        
        corona.forEach(r => {
            const lowTeil = String(r.TEILANL).toLowerCase();
            const isAdj = lowTeil.includes('arroz') || lowTeil.includes('adjunto') || lowTeil.includes('grits') || lowTeil.includes('cocedor');
            
            if (isAdj) {
                for (let i = 1; i <= 24; i++) {
                    const unit = String(r[`DIM_DFM${i}`]).toLowerCase();
                    const val = parseFloat(r[`IW_DFM${i}`]);
                    if (unit === 'kg' && val > 500) { // Looking for large weights
                        results.push({
                            batch: r.CHARG_NR,
                            teilanl: r.TEILANL,
                            gop: r.GOP_BEZ,
                            dfm: `DFM${i}`,
                            name: r[`NAME_DFM${i}`],
                            val
                        });
                    }
                }
            }
        });
        
        console.log(`Found ${results.length} large weight records for CORONA adjunto machines`);
        if (results.length > 0) {
            console.log("Sample:", JSON.stringify(results.slice(0, 5), null, 2));
        }
        
    } catch (e) {
        console.error("Error", e.message, "\n", e.stack);
    }
}
test();
