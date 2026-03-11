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
        
        const b1360 = records.filter(r => String(r.CHARG_NR) === '1360');
        
        const allValues = [];
        b1360.forEach(r => {
            for (let i=1; i<=24; i++) {
                const val = parseFloat(r[`IW_DFM${i}`]) || 0;
                if (val > 0) {
                    allValues.push({
                        teilanl: r.TEILANL,
                        gop: r.GOP_BEZ,
                        dfm: `DFM${i}`,
                        name: r[`NAME_DFM${i}`],
                        unit: r[`DIM_DFM${i}`],
                        val
                    });
                }
            }
        });
        
        allValues.sort((a,b) => b.val - a.val);
        
        await writeFile('corona_1360_all_values.json', JSON.stringify(allValues, null, 2));
        console.log("Written top values for batch 1360 to corona_1360_all_values.json");
    } catch (e) {
        console.error("Error", e.message, "\n", e.stack);
    }
}
test();
