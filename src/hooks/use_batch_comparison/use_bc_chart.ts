import { useMemo } from "react";
import { BatchRecord, SeriesItem } from "@/types";
import { calculateTrendData } from "./bc_utils";
import { FILTER_ALL } from "@/lib/constants";

export function useBcChart(
  data: BatchRecord[], 
  seriesList: SeriesItem[], 
  selectedTempParam: string
) {
  const chartData = useMemo(() => {
    const dataMap = new Map<string, Record<string, unknown>>();
    seriesList.forEach((series) => {
      const points = calculateTrendData(
        data, 
        series.machine, 
        series.recipe, 
        series.batch, 
        selectedTempParam
      );
      points.forEach((p, index) => {
        const isBatchMode = series.batch && series.batch !== FILTER_ALL;
        const key = isBatchMode ? index.toString() : p.stepName;
        if (!dataMap.has(key)) {
          dataMap.set(key, {
            originalIndex: index,
            stepName: p.stepName,
            date: p.date,
            unit: (p as { unit?: string }).unit,
          });
        }
        const entry = dataMap.get(key)!;
        entry[`value_${series.id}`] = p.value;
        if ((p as { unit?: string }).unit) {
          entry.unit = (p as { unit?: string }).unit;
        }
      });
    });
    const result = Array.from(dataMap.values());
    const isBatchModeGlobal = seriesList.some((s) => s.batch && s.batch !== FILTER_ALL);
    if (isBatchModeGlobal) {
      result.sort((a, b) => 
        (a.originalIndex as number) - (b.originalIndex as number)
      );
    } else {
      result.sort((a, b) => {
        const dA = new Date((a.date as string) || (a.stepName as string)).getTime();
        const dB = new Date((b.date as string) || (b.stepName as string)).getTime();
        return dA - dB;
      });
    }
    return result;
  }, [seriesList, selectedTempParam, data]);
  return { chartData };
}
