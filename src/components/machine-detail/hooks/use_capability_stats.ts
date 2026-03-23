import { useState, useMemo, useEffect } from "react";
import { SeriesConfig, CapabilityStats } from "../types";

export function useCapabilityStats(data: any[], isMultiSeries: boolean, series?: SeriesConfig[]) {
    const [tolerance, setTolerance] = useState<number>(1.0);
    const [selectedStepForCp, setSelectedStepForCp] = useState<string>("");

    const availableStepsForCp = useMemo(() => {
        if (!data || data.length === 0) return [];
        const steps = data.map(d => d.stepName || d.date).filter(Boolean);
        return Array.from(new Set(steps));
    }, [data]);

    useEffect(() => {
        if (availableStepsForCp.length > 0 && (!selectedStepForCp || !availableStepsForCp.includes(selectedStepForCp))) {
            setSelectedStepForCp(availableStepsForCp[0]);
        }
    }, [availableStepsForCp, selectedStepForCp]);

    const stats = useMemo<CapabilityStats | null>(() => {
        if (!data || data.length === 0 || !selectedStepForCp) return null;
        
        let valueKeys = isMultiSeries && series ? series.map(s => `value_${s.id}`) : ["value"];
        let targetKeys = isMultiSeries && series ? series.map(s => `target_${s.id}`) : ["target"];
        
        const stepDataEntries = data.filter(d => (d.stepName || d.date) === selectedStepForCp);
        if (stepDataEntries.length === 0) return null;

        let allValues: number[] = [];
        let allTargets: number[] = [];

        stepDataEntries.forEach(row => {
            valueKeys.forEach(vKey => {
                if (row[vKey] !== undefined && row[vKey] !== null && !isNaN(row[vKey] as any)) {
                    allValues.push(Number(row[vKey]));
                }
            });
            targetKeys.forEach(tKey => {
                if (row[tKey] !== undefined && row[tKey] !== null && !isNaN(row[tKey] as any)) {
                    allTargets.push(Number(row[tKey]));
                }
            });
        });

        if (allValues.length < 2) return null;

        const mean = allValues.reduce((a, b) => a + b, 0) / allValues.length;
        const variance = allValues.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (allValues.length - 1);
        const stdDev = Math.sqrt(variance);
        const avgTarget = allTargets.length > 0 ? allTargets.reduce((a, b) => a + b, 0) / allTargets.length : mean;

        const usl = avgTarget + tolerance;
        const lsl = avgTarget - tolerance;
        const cp = stdDev > 0 ? (usl - lsl) / (6 * stdDev) : 0;
        const cpu = stdDev > 0 ? (usl - mean) / (3 * stdDev) : 0;
        const cpl = stdDev > 0 ? (mean - lsl) / (3 * stdDev) : 0;
        const cpk = stdDev > 0 ? Math.min(cpu, cpl) : 0;

        return { name: selectedStepForCp, mean, stdDev, avgTarget, cp, cpk, valuesCount: allValues.length };
    }, [data, isMultiSeries, series, tolerance, selectedStepForCp]);

    return { 
        tolerance, 
        setTolerance, 
        selectedStepForCp, 
        setSelectedStepForCp, 
        availableStepsForCp, 
        stats 
    };
}
