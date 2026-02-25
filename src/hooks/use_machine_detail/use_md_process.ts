import { useMemo } from "react";
import { BatchRecord } from "@/types";
export function useMdProcess(
  data: BatchRecord[], 
  selectedBatchId: string, 
  selectedMachine: string
) {
  const selectedRecord = data.find(
    (d) => d.CHARG_NR === selectedBatchId && d.TEILANL_GRUPO === selectedMachine
  );

  const stepsData = useMemo(() => {
    if (!selectedRecord?.steps) return [];
    const merged: typeof selectedRecord.steps = [];
    for (const step of selectedRecord.steps) {
      const last = merged[merged.length - 1];
      if (last && last.stepName === step.stepName) {
        last.durationMin += step.durationMin;
        last.expectedDurationMin += step.expectedDurationMin;
      } else {
        merged.push({ ...step });
      }
    }
    return merged;
  }, [selectedRecord]);

  const fullProcessData = useMemo(() => {
    if (!selectedBatchId) return [];
    const records = data
      .filter((d) => d.CHARG_NR === selectedBatchId)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    
    let allSteps: any[] = [];
    records.forEach((record) => {
      if (record.steps) {
        const mergedLocal: any[] = [];
        for (const step of record.steps) {
          const last = mergedLocal[mergedLocal.length - 1];
          if (last && last.stepName === step.stepName) {
            last.durationMin += step.durationMin;
            last.expectedDurationMin += step.expectedDurationMin;
          } else {
            mergedLocal.push({ 
              ...step, 
              machineName: record.TEILANL_GRUPO, 
              uniqueLabel: `${record.TEILANL_GRUPO} - ${step.stepName}` 
            });
          }
        }
        allSteps = allSteps.concat(mergedLocal);
      }
    });
    return allSteps;
  }, [data, selectedBatchId]);

  const fullProcessChartHeight = useMemo(() => {
    return Math.max(500, fullProcessData.length * 50);
  }, [fullProcessData]);

  const anomaliesReport = useMemo(() => {
    if (!stepsData.length) return [];
    const issues = stepsData.map((step, index) => {
      const isGap = step.stepName.includes("Espera");
      const isSlow = !isGap && step.expectedDurationMin > 0 && step.durationMin > step.expectedDurationMin + 1;
      
      if (!isGap && !isSlow) return null;
      
      return {
        id: index,
        type: isGap ? "gap" : "delay",
        name: step.stepName,
        duration: step.durationMin,
        expected: step.expectedDurationMin,
        delta: isSlow ? Math.round((step.durationMin - step.expectedDurationMin) * 100) / 100 : 0,
        startTime: new Date(step.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        prevStep: index > 0 ? stepsData[index - 1].stepName : "Inicio",
        nextStep: index < stepsData.length - 1 ? stepsData[index + 1].stepName : "Fin",
      };
    });

    return issues
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .sort((a, b) => {
        const valueA = a.type === "gap" ? a.duration : a.delta;
        const valueB = b.type === "gap" ? b.duration : b.delta;
        return valueB - valueA;
      });
  }, [stepsData]);

  return { 
    selectedRecord, 
    stepsData, 
    fullProcessData, 
    fullProcessChartHeight, 
    anomaliesReport 
  };
}

