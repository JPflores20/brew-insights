import { useMemo } from "react";
import { BatchRecord, SeriesItem } from "@/types";
import { FILTER_ALL } from "@/lib/constants";

export function useSicAguaMalta(
  data: BatchRecord[],
  seriesList: SeriesItem[]
) {
  const chartData = useMemo(() => {
    const dataMap = new Map<string, Record<string, unknown>>();

    seriesList.forEach((series) => {
      // Filtrar data por máquina y receta
      // Filtrar data por receta
      if (series.recipe === "") return;
      
      let filteredData = data;
      if (series.recipe !== FILTER_ALL) {
        filteredData = filteredData.filter((d) => 
            d.productName?.toUpperCase() === series.recipe.toUpperCase()
        );
      }

      filteredData.forEach((record) => {
        const points = record.agua_malta_points || [];
        
        points.forEach((point, pIndex) => {
          // Si el valor de malta es 0, evitamos división por cero
          if (point.maltaKg <= 0) return;
          
          const ratio = (point.aguaHl / point.maltaKg) * 100;
          // Identificador único: Batch + Grupo + Índice de Punto para separar descargas 1, 2, 3...
          const pointId = `${record.CHARG_NR}_${record.TEILANL_GRUPO}_${pIndex}`;

          if (!dataMap.has(pointId)) {
            dataMap.set(pointId, {
              batchId: record.CHARG_NR,
              pointIndex: pIndex + 1,
              stepName: point.stepName,
              group: record.TEILANL_GRUPO,
              date: new Date(record.timestamp).toLocaleString([], { dateStyle: "short", timeStyle: "short" }),
              timestamp: new Date(record.timestamp).getTime(),
            });
          }

          const entry = dataMap.get(pointId)!;
          entry[`value_${series.id}`] = Number(ratio.toFixed(2));
          entry[`agua_${series.id}`] = point.aguaHl;
          entry[`malta_${series.id}`] = point.maltaKg;
          entry[`step_${series.id}`] = point.stepName;
        });
      });
    });

    const result = Array.from(dataMap.values());
    
    // Ordenar cronológicamente por lote y luego por índice de punto (descarga 1, 2...)
    result.sort((a, b) => {
      const numA = parseInt(String(a.batchId).replace(/\D/g, ''), 10);
      const numB = parseInt(String(b.batchId).replace(/\D/g, ''), 10);
      if (!isNaN(numA) && !isNaN(numB) && numA !== numB) return numA - numB;
      if (a.batchId !== b.batchId) return String(a.batchId).localeCompare(String(b.batchId));
      return (a.pointIndex as number) - (b.pointIndex as number);
    });

    return result;
  }, [seriesList, data]);

  return { chartData };
}
