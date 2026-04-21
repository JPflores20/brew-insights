import * as fs from 'fs';
import * as path from 'path';

// Parse DBF without full logic, just to read records
function readDBF(filePath: string) {
  const buffer = fs.readFileSync(filePath);
  const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  
  const recordCount = view.getUint32(4, true);
  const headerLength = view.getUint16(8, true);
  const recordLength = view.getUint16(10, true);
  
  const fields = [];
  let offset = 32;
  while (offset < headerLength - 1) {
    if (view.getUint8(offset) === 0x0d) break;
    const nameBytes = [];
    for (let i = 0; i < 11; i++) {
        const b = view.getUint8(offset+i);
        if (b!==0) nameBytes.push(b);
    }
    fields.push({
      name: String.fromCharCode(...nameBytes).trim(),
      type: String.fromCharCode(view.getUint8(offset+11)),
      len: view.getUint8(offset+16),
      offset: fields.length === 0 ? 1 : fields[fields.length-1].offset + fields[fields.length-1].len
    });
    offset += 32;
  }
  
  const decoder = new TextDecoder('windows-1252');
  let matchCount = 0;

  for (let r = 0; r < recordCount; r++) {
    const recordStart = headerLength + r * recordLength;
    if (buffer[recordStart] === 0x2a) continue; // deleted
    
    let gopName = '';
    let iwDfm2 = '';
    let dimDfm2 = '';

    for (const f of fields) {
      const start = recordStart + f.offset;
      const str = decoder.decode(buffer.slice(start, start + f.len)).trim();
      if (f.name === 'GOP_NAME') gopName = str;
      if (f.name === 'IW_DFM2' || f.name === 'IWDFM2') iwDfm2 = str;
      if (f.name === 'DIM_DFM2') dimDfm2 = str;
    }
    
    if (gopName.toUpperCase().includes('DLM PRIMERO MOST') || gopName.toUpperCase().includes('MOST')) {
      console.log(`Found: GOP=${gopName}, IW_DFM2=${iwDfm2}, DIM=${dimDfm2}`);
      matchCount++;
      if (matchCount > 5) break;
    }
  }
}

readDBF(path.join(process.cwd(), 'public/Datos semanales/S2600013.DBF'));
