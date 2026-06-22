const fs = require('fs');
const data = fs.readFileSync('src/data/mock_data.ts', 'utf8');
const regex = /CHARG_NR:\s*['"]([^'"]+)['"]/g;
const batches = new Set();
let match;
while ((match = regex.exec(data)) !== null) {
  batches.add(match[1]);
}
console.log('Total unique batches in mock_data.ts:', batches.size);
console.log('Batches:', Array.from(batches));
