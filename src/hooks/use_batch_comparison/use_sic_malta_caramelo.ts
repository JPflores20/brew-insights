import { useMemo } from "react";
import { BatchRecord, SeriesItem } from "@/types";
import { FILTER_ALL } from "@/lib/constants";

export function useSicMaltaCaramelo(
  data: BatchRecord[],
  seriesList: SeriesItem[]
) {
  const chartData = useMemo(() => {
    const dataMap = new Map<string, Record<string, unknown>>();

    seriesList.forEach((series) => {
      // Filtrar por receta y asegurar que el registro tenga valor de descarga
      const recipes = Array.from(new Set(data.map(r => r.productName)));
      
      const filtered = data.filter(record => {
        // Filtrar por receta (case-insensitive)
        if (series.recipe && series.recipe !== FILTER_ALL) {
          if (record.productName.toUpperCase() !== series.recipe.toUpperCase()) return false;
        }
        return true; 
      });

      const finalFiltered = filtered.filter(record => (record.descarga_am_m2b || 0) > 0);

      finalFiltered.forEach((record) => {
        const ratio = (record.malta_caramelo_clo! / record.descarga_am_m2b!) * 100;
        // Identificador único por Lote y Grupo de Máquina (para separar índices 1, 2, 3, 4)
        const pointId = `${record.CHARG_NR}_${record.TEILANL_GRUPO}`;

        if (!dataMap.has(pointId)) {
          dataMap.set(pointId, {
            batchId: record.CHARG_NR,
            group: record.TEILANL_GRUPO,
            date: new Date(record.timestamp).toLocaleString([], { dateStyle: "short", timeStyle: "short" }),
            timestamp: new Date(record.timestamp).getTime(),
          });
        }

        const entry = dataMap.get(pointId)!;
        entry[`value_${series.id}`] = Number(ratio.toFixed(2));
        entry[`clo_${series.id}`] = record.malta_caramelo_clo;
        entry[`am_m2b_${series.id}`] = record.descarga_am_m2b;
      });
    });

    const result = Array.from(dataMap.values());
    
    // Ordenar cronológicamente
    result.sort((a, b) => {
      const numA = parseInt(String(a.batchId).replace(/\D/g, ''), 10);
      const numB = parseInt(String(b.batchId).replace(/\D/g, ''), 10);
      if (!isNaN(numA) && !isNaN(numB) && numA !== numB) return numA - numB;
      return (a.timestamp as number) - (b.timestamp as number);
    });

    return result;
  }, [seriesList, data]);

  return { chartData };
}
