import fs from 'fs';
import { processDbfBuffer } from './src/utils/dbf_processor';

async function run() {
  const file = fs.readFileSync('public/Semanas/S2600007.DBF');
  const buf = file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength);
  const records = await processDbfBuffer(buf);

  const michelob = records.filter(r => r.productName === 'MICHELOB ULTRA');
  console.log(`MICHELOB ULTRA segments: ${michelob.length}`);
  
  const batches = new Map<string, { clo: number, m2b: number }>();
  michelob.forEach(r => {
    if (r.malta_caramelo_clo > 0 || r.descarga_am_m2b > 0) {
      console.log(`  Batch=${r.CHARG_NR} Machine=${r.TEILANL_GRUPO} CLO=${r.malta_caramelo_clo} M2B=${r.descarga_am_m2b}`);
      if (!batches.has(r.CHARG_NR)) batches.set(r.CHARG_NR, { clo: 0, m2b: 0 });
      const b = batches.get(r.CHARG_NR)!;
      b.clo += r.malta_caramelo_clo;
      b.m2b += r.descarga_am_m2b;
    }
  });

  console.log('\nFinal ratios (aggregated by batch):');
  batches.forEach((v, k) => {
    if (v.m2b > 0) {
      const ratio = (v.clo / v.m2b) * 100;
      console.log(`  Batch ${k}: ${ratio.toFixed(2)}% (CLO=${v.clo}, M2B=${v.m2b})`);
    } else {
      console.log(`  Batch ${k}: M2B is zero! (CLO=${v.clo})`);
    }
  });
}
run().catch(console.error);
