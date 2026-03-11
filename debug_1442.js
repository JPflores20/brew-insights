import fs from 'fs';
import { DBFFile } from 'dbffile';

async function debugBatch1442() {
  const dbf = await DBFFile.read('public/data/S2600009.dbf');
  const records = await dbf.readRecords();

  const batchRecords = records.filter(r => r.CHARG_NR === 1442 || r.CHARG_NR === '1442');

  const events = batchRecords.map((row) => {
    const raw_dfm2_num = parseFloat(String(row['IW_DFM2'] ?? row['IWDFM2'] ?? '')) || 0;
    const raw_dim_dfm2 = String(row['DIM_DFM2'] ?? '').trim().toLowerCase();
    
    return { 
        GOP: row.GOP_NAME,
        TEIL: row.TEILANL,
        raw_dfm2_num,
        raw_dim_dfm2,
        hl: raw_dim_dfm2 === 'hl' ? raw_dfm2_num : 0, 
        kg: raw_dim_dfm2 === 'kg' ? raw_dfm2_num : 0 
    };
  });

  const withValues = events.filter(e => e.hl > 0 || e.kg > 0);
  console.log("Found positive values:");
  console.table(withValues);
}

debugBatch1442().catch(console.error);
