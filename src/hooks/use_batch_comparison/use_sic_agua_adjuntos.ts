import { useMemo } from "react";
import { BatchRecord, SeriesItem } from "@/types";
import { FILTER_ALL } from "@/lib/constants";

export function useSicAguaAdjuntos(
  data: BatchRecord[],
  seriesList: SeriesItem[]
) {
  const chartData = useMemo(() => {
    const dataMap = new Map<string, Record<string, unknown>>();

    seriesList.forEach((series) => {
      // Filtrar data por máquina y receta
      // Filtrar data por receta (la máquina es opcional o se deduce de los registros)
      if (series.recipe === "") return;
      
      // Hacer una copia y filtrar por receta (case-insensitive)
      let filteredData = [...data];
      if (series.recipe !== FILTER_ALL) {
        filteredData = filteredData.filter((d) => 
            d.productName?.toUpperCase() === series.recipe.toUpperCase()
        );
      }

      // Ordenar cronológicamente (usando la copia)
      filteredData.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

      // Solo quedarnos con el batch activo si se especificó uno
      if (series.batch && series.batch !== FILTER_ALL) {
        filteredData = filteredData.filter(d => d.CHARG_NR === series.batch);
      }

      const seriesAccumulator = new Map<string, { agua: number, arroz: number, timestamp: number, date: string }>();

      filteredData.forEach((record) => {
        const key = record.CHARG_NR;
        if (!key) return;

        if (!seriesAccumulator.has(key)) {
            seriesAccumulator.set(key, {
                agua: 0,
                arroz: 0,
                timestamp: new Date(record.timestamp).getTime() || 0,
                date: new Date(record.timestamp).toLocaleString([], { dateStyle: "short", timeStyle: "short" })
            });
        }
        
        const accum = seriesAccumulator.get(key)!;
        
        // Agregamos valores si están presentes. 
        // Usamos Math.max si sospechamos que son totales de lote repetidos, 
        // pero por ahora mantenemos la suma por si son múltiples cocedores de adjuntos.
        if (record.max_agua_dfm2_hl > 0 || record.max_adjuntos_dfm2_kg > 0) {
            accum.agua += (record.max_agua_dfm2_hl || 0);
            accum.arroz += (record.max_adjuntos_dfm2_kg || 0);
        }
      });

      // ... (rest code previous to this is fine, let's insert log here)
      seriesAccumulator.forEach((accum, key) => {
        console.log(`[AguaAdj] Batch ${key} -> agua: ${accum.agua}, arroz: ${accum.arroz}`);
        if (accum.agua > 0 && accum.arroz > 0) {
            const ratio = accum.agua / accum.arroz;
            
            if (!dataMap.has(key)) {
                dataMap.set(key, {
                    batchId: key,
                    date: accum.date,
                    timestamp: accum.timestamp
                });
            }
            
            const entry = dataMap.get(key)!;
            entry[`value_${series.id}`] = Number(ratio.toFixed(4));
            entry[`agua_${series.id}`] = accum.agua;
            entry[`arroz_${series.id}`] = accum.arroz;
        }
      });
    });

    const result = Array.from(dataMap.values());
    
    // Sort chronologically by batch ID (which are sequential) or by date
    result.sort((a, b) => {
      const numA = parseInt(String(a.batchId).replace(/\D/g, ''), 10);
      const numB = parseInt(String(b.batchId).replace(/\D/g, ''), 10);
      
      if (!isNaN(numA) && !isNaN(numB)) {
        return numA - numB;
      }
      return String(a.batchId).localeCompare(String(b.batchId));
    });

    return result;
  }, [seriesList, data]);

  return { chartData };
}
