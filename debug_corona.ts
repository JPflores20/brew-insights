import { processDbfBuffer } from "./src/utils/dbf_processor";
import fs from "fs";
import path from "path";

async function debugCorona() {
    const dbfPath = path.join(process.cwd(), "public/S2600009.DBF");
    const buffer = fs.readFileSync(dbfPath);
    const result = await processDbfBuffer(buffer);
    
    const coronaBatches = result.filter(r => r.productName && r.productName === "CORONA");
    
    const uniqueGroups = Array.from(new Set(coronaBatches.map(r => r.TEILANL_GRUPO)));
    const uniqueSteps = Array.from(new Set(coronaBatches.map(r => r.STEP_NAME || r.GOP_NAME)));
    
    const withDfm2 = coronaBatches.filter(r => (r.max_agua_dfm2_hl || 0) > 0 || (r.max_adjuntos_dfm2_kg || 0) > 0);
    
    const output = {
        count: coronaBatches.length,
        uniqueGroups,
        uniqueSteps,
        withDfm2Count: withDfm2.length,
        samples: coronaBatches.slice(0, 10).map(r => ({
            batchId: r.CHARG_NR,
            group: r.TEILANL_GRUPO,
            step: r.STEP_NAME || r.GOP_NAME,
            agua: r.max_agua_dfm2_hl,
            adjunto: r.max_adjuntos_dfm2_kg
        }))
    };
    
    fs.writeFileSync("corona_debug_results.json", JSON.stringify(output, null, 2));
    console.log("Results written to corona_debug_results.json");
}

debugCorona().catch(console.error);
