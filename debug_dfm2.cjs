const fs = require('fs');

function parseDbf(filePath) {
  const buffer = fs.readFileSync(filePath);
  const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  
  const recordCount = view.getUint32(4, true);
  const headerLength = view.getUint16(8, true);
  const recordLength = view.getUint16(10, true);
  const fields = [];
  
  let offset = 32;
  let fieldOffset = 1;
  while (offset < headerLength - 1) {
    if (view.getUint8(offset) === 0x0d) break;
    const nameBytes = [];
    for (let i = 0; i < 11; i++) {
      const byte = view.getUint8(offset + i);
      if (byte !== 0) nameBytes.push(byte);
    }
    const name = String.fromCharCode(...nameBytes).trim();
    const type = String.fromCharCode(view.getUint8(offset + 11));
    const length = view.getUint8(offset + 16);
    fields.push({ name, length, offset: fieldOffset });
    fieldOffset += length;
    offset += 32;
  }
  
  // Find interesting columns
  const nameDfm2 = fields.find(f => f.name === 'NAME_DFM2');
  const iwDfm2 = fields.find(f => f.name === 'IW_DFM2' || f.name === 'IWDFM2');
  const dimDfm2 = fields.find(f => f.name === 'DIM_DFM2');
  const gopName = fields.find(f => f.name === 'GOP_NAME');
  const chargNr = fields.find(f => f.name === 'CHARG_NR' || f.name === 'COCIMIENTO');

  console.log('Columns found:', {
    NAME_DFM2: !!nameDfm2,
    IW_DFM2: !!iwDfm2,
    DIM_DFM2: !!dimDfm2,
    GOP_NAME: !!gopName,
    CHARG_NR: !!chargNr
  });

  const decoder = new TextDecoder('windows-1252');
  let matchCount = 0;
  
  for (let r = 0; r < recordCount; r++) {
    const start = headerLength + r * recordLength;
    const deleteFlag = buffer[start];
    if (deleteFlag === 0x2a) continue;
    
    const readField = (f) => f ? decoder.decode(buffer.slice(start + f.offset, start + f.offset + f.length)).trim() : '';
    
    const batch = readField(chargNr);
    const gop = readField(gopName);
    const n2 = readField(nameDfm2);
    const i2 = readField(iwDfm2);
    const d2 = readField(dimDfm2);
    
    if (d2.toLowerCase() === 'hl' || d2.toLowerCase() === 'kg' || d2.toLowerCase() === 'l' || n2.toLowerCase().includes('agua') || n2.toLowerCase().includes('arroz') || n2.toLowerCase().includes('adjunto')) {
       console.log(`[Batch ${batch}] [${gop}] DFM2 Name=${n2}, Val=${i2}, Unit=${d2}`);
       matchCount++;
       if (matchCount > 50) break;
    }
  }
}

parseDbf('C:\\Users\\pepej\\Documents\\CORONA\\DataAnla\\brew-insights\\public\\S2600009.DBF');
