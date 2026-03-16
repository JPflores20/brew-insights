import { useMemo } from "react";
import { BatchRecord, SeriesItem } from "@/types";
import { calculateTrendData } from "./bc_utils";
import { FILTER_ALL } from "@/lib/constants";

export function useSicChart(
  data: BatchRecord[],
  seriesList: SeriesItem[]
) {
  const chartData = useMemo(() => {
    const dataMap = new Map<string, Record<string, unknown>>();

    seriesList.forEach((series) => {
      // For SIC, we always want historical trend data mapping batchId on X-axis, 
      // even if a specific batch is selected in the series. 
      // If a specific batch is selected, we filter the historical data to ONLY that batch.
      
      let specificParam = series.parameter;
      if (!specificParam || specificParam === FILTER_ALL) {
        // Fallback to first valid temperature parameter for this machine if none selected
        const machineRecords = data.filter(d => d.TEILANL_GRUPO === series.machine);
        for (const record of machineRecords) {
          if (record.parameters && record.parameters.length > 0) {
            const tempParam = record.parameters.find((p) => {
              const u = (p.unit || "").toLowerCase();
              const n = (p.name || "").toLowerCase();
              return u.includes("°c") || u.includes("temp") || n.includes("temp");
            });
            if (tempParam) {
              specificParam = tempParam.name;
              break;
            } else if (!specificParam) {
              specificParam = record.parameters[0].name; // fallback to first param if temp not found
            }
          }
        }
      }

      // Calculate trend data ALWAYS getting the historical points (using FILTER_ALL for batch)
      // Pass emptyReturnsAll: false to ensure chart stays empty if no machine/recipe selected
      const historicalPoints = calculateTrendData(
        data,
        series.machine,
        series.recipe,
        FILTER_ALL, // Always get historical forSIC
        specificParam,
        series.step
      );
      
      // If the series has a specific batch selected, we only keep that batch's data point
      const pointsToPlot = (series.batch && series.batch !== FILTER_ALL)
        ? historicalPoints.filter((p: any) => p.batchId === series.batch)
        : historicalPoints;

      pointsToPlot.forEach((p: any) => {
        // The unique key for SIC chart on X-axis is the batchId
        const key = p.batchId;
        
        if (!key) return; // Skip if no batchId

        if (!dataMap.has(key)) {
          dataMap.set(key, {
            batchId: key,
            date: p.date,
            unit: p.unit,
            // Track timestamp for proper chronological sorting
            timestamp: new Date(p.date.split(',')[0]).getTime() || 0 
          });
        }
        const entry = dataMap.get(key)!;
        entry[`value_${series.id}`] = p.value;
        if (p.duration !== undefined && p.duration !== null) {
          entry[`duration_${series.id}`] = p.duration;
        }
        if (p.unit) {
          entry[`unit_${series.id}`] = p.unit;
          if (!entry.unit) entry.unit = p.unit;
        }
      });
    });

    const result = Array.from(dataMap.values());
    
    // Sort chronologically by batch ID (which are sequential) or by date
    result.sort((a, b) => {
      // Try to sort by batchId numerically if possible, otherwise by string
      const numA = parseInt(String(a.batchId).replace(/\D/g, ''), 10);
      const numB = parseInt(String(b.batchId).replace(/\D/g, ''), 10);
      
      if (!isNaN(numA) && !isNaN(numB)) {
        return numA - numB;
      }
      return String(a.batchId).localeCompare(String(b.batchId));
    });

    // Ensure all series have a value for each point, even if null, so the line doesn't break
    // if using connectNulls=false (which is default)
    return result;
  }, [seriesList, data]);

  return { chartData };
}
