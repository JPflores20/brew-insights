import { useState, useMemo, useEffect } from "react";
import { SeriesConfig, CapabilityStats } from "../types";
import { FILTER_ALL } from "@/lib/constants";

export function useCapabilityStats(
    fullData: any[], 
    isMultiSeries: boolean, 
    series?: SeriesConfig[], 
    selectedMachine?: string, 
    trendBatch?: string
) {
    const [tolerance, setTolerance] = useState<number>(5.0); // 5 min tolerance default for time
    const [selectedStepForCp, setSelectedStepForCp] = useState<string>("");

    const availableStepsForCp = useMemo(() => {
        if (!fullData || fullData.length === 0) return [];
        const steps = new Set<string>();
        let relevantRecords = fullData;

        if (!isMultiSeries && selectedMachine && selectedMachine !== FILTER_ALL) {
            relevantRecords = fullData.filter(d => d.TEILANL_GRUPO === selectedMachine);
        } else if (isMultiSeries && series && series.length > 0) {
            // Aggregate all steps across all selected machines in series
            relevantRecords = fullData.filter(d => series.some(s => s.machine === FILTER_ALL || d.TEILANL_GRUPO === s.machine));
        }

        relevantRecords.forEach(r => {
            if (Array.isArray(r.steps)) {
                r.steps.forEach((s: any) => {
                    if (s.stepName) steps.add(s.stepName);
                });
            }
        });

        return Array.from(steps).sort();
    }, [fullData, isMultiSeries, series, selectedMachine]);

    useEffect(() => {
        if (availableStepsForCp.length > 0 && (!selectedStepForCp || !availableStepsForCp.includes(selectedStepForCp))) {
            setSelectedStepForCp(availableStepsForCp[0]);
        }
    }, [availableStepsForCp, selectedStepForCp]);

    const stats = useMemo<CapabilityStats | null>(() => {
        if (!fullData || fullData.length === 0) return null;

        let allValues: number[] = [];
        let allExpected: number[] = [];
        let records = fullData;

        if (isMultiSeries && series && series.length > 0) {
            records = fullData.filter(d => 
                series.some(s => 
                    (s.machine === FILTER_ALL || d.TEILANL_GRUPO === s.machine) &&
                    (s.recipe === FILTER_ALL || d.productName === s.recipe)
                )
            );
        } else if (selectedMachine && selectedMachine !== FILTER_ALL) {
            records = fullData.filter(d => d.TEILANL_GRUPO === selectedMachine);
        }

        records.forEach(r => {
            if (Array.isArray(r.steps)) {
                const step = r.steps.find((s: any) => s.stepName === selectedStepForCp);
                if (step && typeof step.durationMin === 'number') {
                    allValues.push(step.durationMin);
                    if (typeof step.expectedDurationMin === 'number') {
                        allExpected.push(step.expectedDurationMin);
                    }
                }
            }
        });

        if (allValues.length === 0) {
             return { name: selectedStepForCp || "Ninguno", mean: 0, stdDev: 0, avgTarget: 0, cp: 0, cpk: 0, valuesCount: 0, unit: " min" };
        }

        const mean = allValues.reduce((a, b) => a + b, 0) / allValues.length;
        const variance = allValues.length > 1 ? allValues.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (allValues.length - 1) : 0;
        const stdDev = Math.sqrt(variance);
        
        const avgTarget = allExpected.length > 0 ? (allExpected.reduce((a, b) => a + b, 0) / allExpected.length) : mean;

        const usl = avgTarget + tolerance;
        const lsl = avgTarget - tolerance;
        const cp = stdDev > 0 ? (usl - lsl) / (6 * stdDev) : 0;
        const cpu = stdDev > 0 ? (usl - mean) / (3 * stdDev) : 0;
        const cpl = stdDev > 0 ? (mean - lsl) / (3 * stdDev) : 0;
        const cpk = stdDev > 0 ? Math.min(cpu, cpl) : 0;

        const unit = " min";

        return { name: selectedStepForCp, mean, stdDev, avgTarget, cp, cpk, valuesCount: allValues.length, unit };
    }, [fullData, isMultiSeries, series, selectedMachine, tolerance, selectedStepForCp]);

    return { 
        tolerance, 
        setTolerance, 
        selectedStepForCp, 
        setSelectedStepForCp, 
        availableStepsForCp, 
        stats 
    };
}
