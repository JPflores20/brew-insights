import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { processDbfBuffer, mergeBatchRecords } from '../src/utils/dbf_processor';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const dataDir = path.join(__dirname, '../public/Datos semanales');
  const files = ['S2600018.DBF', 'S2600019.DBF', 'S2600020.DBF', 'S2600021.DBF'];
  
  let combinedHot: any[] = [];
  
  for (const file of files) {
    const filePath = path.join(dataDir, file);
    if (!fs.existsSync(filePath)) {
      console.warn(`File not found: ${filePath}`);
      continue;
    }
    
    console.log(`Processing ${file}...`);
    const buffer = fs.readFileSync(filePath);
    // Convert Node Buffer to ArrayBuffer
    const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
    
    const fileData = await processDbfBuffer(arrayBuffer);
    if (fileData) {
      combinedHot.push(...fileData);
    }
  }
  
  
  console.log(`Merging ${combinedHot.length} records...`);
  const mergedData = mergeBatchRecords(combinedHot);
  const outputFile = path.join(__dirname, '../public/preloaded_data.json');
  fs.writeFileSync(outputFile, JSON.stringify(mergedData));
  console.log(`Successfully wrote ${mergedData.length} MERGED records to ${outputFile}`);
}

main().catch(console.error);
