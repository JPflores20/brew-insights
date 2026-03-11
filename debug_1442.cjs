const fs = require('fs');
const { DBFFile } = require('dbffile');

async function debugBatch1442() {
  const dbf = await DBFFile.read('public/data/S2600009.dbf');
  const records = await dbf.readRecords();

  const batchRecords = records.filter(r => r.CHARG_NR === 1442 || r.CHARG_NR === '1442');
  console.log(`Found ${batchRecords.length} records for batch 1442`);

  const relevant = batchRecords.map(r => ({
    TEILANL: r.TEILANL,
    GOP_NAME: r.GOP_NAME,
    NAME_DFM2: r.NAME_DFM2,
    DIM_DFM2: r.DIM_DFM2,
    IW_DFM2: r.IW_DFM2,
    IWDFM2: r.IWDFM2,
    SW_DFM2: r.SW_DFM2
  })).filter(r => r.DIM_DFM2 && String(r.DIM_DFM2).trim() !== '');

  console.log("Relevant DFM2 records:");
  console.table(relevant);
}

debugBatch1442().catch(console.error);
