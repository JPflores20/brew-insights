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
      let filteredData = data;
      if (series.machine && series.machine !== FILTER_ALL) {
        filteredData = filteredData.filter((d) => d.TEILANL_GRUPO === series.machine);
      }
      if (series.recipe && series.recipe !== FILTER_ALL) {
        filteredData = filteredData.filter((d) => d.productName === series.recipe);
      }

      // Ordenar cronológicamente
      filteredData.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

      // Solo quedarnos con el batch activo si se especificó uno
      if (series.batch && series.batch !== FILTER_ALL) {
        filteredData = filteredData.filter(d => d.CHARG_NR === series.batch);
      }

      filteredData.forEach((record) => {
        const key = record.CHARG_NR;
        if (!key) return;

        // Buscar cantidades de Agua y Arroz/Adjunto
        let aguaReal = 0;
        let arrozReal = 0;

        record.materials.forEach(m => {
          const nameLower = m.name.toLowerCase();
          const unitLower = m.unit.toLowerCase();
          
          // Agua: sumamos cualquier material líquido (hl o l) que no sea mosto
          if ((unitLower === "hl" || unitLower === "l") && !nameLower.includes("mosto") && !nameLower.includes("merma")) {
            aguaReal += m.totalReal;
          }
          // Arroz o Adjunto: sumamos cualquier material sólido (kg, g, lbs)
          if (unitLower === "kg" || unitLower === "lbs" || unitLower === "g") {
            arrozReal += m.totalReal;
          }
        });

        // Solo graficamos si tenemos valores válidos
        if (aguaReal > 0 && arrozReal > 0) {
          const ratio = aguaReal / arrozReal;

          if (!dataMap.has(key)) {
            dataMap.set(key, {
              batchId: key,
              date: new Date(record.timestamp).toLocaleString([], { dateStyle: "short", timeStyle: "short" }),
              timestamp: new Date(record.timestamp).getTime() || 0,
            });
          }
          
          const entry = dataMap.get(key)!;
          // Guardar el valor calculado
          entry[`value_${series.id}`] = Number(ratio.toFixed(2));
          // Guardar info extra
          entry[`agua_${series.id}`] = aguaReal;
          entry[`arroz_${series.id}`] = arrozReal;
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
