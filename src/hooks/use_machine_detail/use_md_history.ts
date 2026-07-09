import { useMemo } from "react";
import { BatchRecord } from "@/types";
import { getMachineData } from "@/data/mock_data";
import { FILTER_ALL } from "@/lib/constants";

export function useMdHistory(
  data: BatchRecord[], 
  selectedMachine: string, 
  selectedBatchId: string,
  selectedRecipe?: string
) {
  const machineHistoryData = useMemo(() => {
    if (!selectedMachine) return [];
    let records = getMachineData(data, selectedMachine);
    if (selectedRecipe && selectedRecipe !== FILTER_ALL) {
      records = records.filter(r => r.productName === selectedRecipe);
    }
    return records
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .map((record) => ({
        batchId: record.CHARG_NR,
        realTime: record.real_total_min,
        idle: record.idle_wall_minus_sumsteps_min,
        isCurrent: record.CHARG_NR === selectedBatchId,
      }));
  }, [data, selectedMachine, selectedBatchId, selectedRecipe]);
  const problematicBatches = useMemo(() => {
    const issues: any[] = [];
    data.forEach((record) => {
      const hasGap = record.idle_wall_minus_sumsteps_min > 5;
      const hasDelay = record.delta_total_min > 5;
      if (hasGap || hasDelay) {
        issues.push({
          batch: record.CHARG_NR,
          product: record.productName,
          machine: record.TEILANL_GRUPO,
          totalWait: record.idle_wall_minus_sumsteps_min,
          totalDelay: record.delta_total_min,
          isDelay: !hasGap && hasDelay,
          timestamp: record.timestamp,
        });
      }
    });
    return issues.sort((a, b) => 
      Math.max(b.totalWait, b.totalDelay) - Math.max(a.totalWait, a.totalDelay)
    );
  }, [data]);
  return { machineHistoryData, problematicBatches };
}
