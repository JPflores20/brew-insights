const fs = require('fs');
const path = require('path');
// Since dbf_processor is TS/ESM, we can't easily require it in CJS if it's not compiled.
// But we have test_dbf.ts which might be working?
// Let's just use the already processed data if possible, or create a simple parser here.
// Actually, I'll just use tsx again but with better error handling.

async function run() {
    try {
        const { processDbfBuffer } = await import('./src/utils/dbf_processor.ts');
        const dbfPath = path.join(process.cwd(), "public/S2600009.DBF");
        const buffer = fs.readFileSync(dbfPath);
        const result = await processDbfBuffer(buffer);
        
        const coronaBatches = result.filter(r => r.productName && r.productName === "CORONA");
        
        const output = {
            count: coronaBatches.length,
            uniqueGroups: Array.from(new Set(coronaBatches.map(r => r.TEILANL_GRUPO))),
            uniqueSteps: Array.from(new Set(coronaBatches.map(r => r.STEP_NAME || r.GOP_NAME))),
            withDfm2Count: coronaBatches.filter(r => (r.max_agua_dfm2_hl || 0) > 0 || (r.max_adjuntos_dfm2_kg || 0) > 0).length,
            samples: coronaBatches.slice(0, 5).map(r => ({
                id: r.CHARG_NR,
                group: r.TEILANL_GRUPO,
                step: r.STEP_NAME,
                agua: r.max_agua_dfm2_hl,
                adj: r.max_adjuntos_dfm2_kg
            }))
        };
        
        fs.writeFileSync("corona_debug.json", JSON.stringify(output, null, 2));
        console.log("SUCCESS");
    } catch (e) {
        fs.writeFileSync("corona_error.txt", e.stack || String(e));
        console.error("FAIL", e);
    }
}

run();
