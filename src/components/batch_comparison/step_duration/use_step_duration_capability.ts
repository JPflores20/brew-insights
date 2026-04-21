import { useState, useMemo, useEffect } from "react";
import { BatchRecord } from "@/types";
import { DateRange } from "react-day-picker";
import { startOfDay, endOfDay } from "date-fns";
import { FILTER_ALL } from "@/lib/constants";

export const calculateStats = (values: number[], leiVal: number, lesVal: number) => {
  const n = values.length;
  if (n < 2) return null;

  const mean = values.reduce((a, b) => a + b, 0) / n;
  const min = Math.min(...values);
  const max = Math.max(...values);
  
  const sumSqDiff = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0);
  const variance = sumSqDiff / (n - 1);
  const stdDev = Math.sqrt(variance);

  const hasLimits = (leiVal !== 0 || lesVal !== 0) && lesVal > leiVal;
  const cp = hasLimits ? (lesVal - leiVal) / (6 * stdDev) : 0;
  const cpkUpper = hasLimits ? (lesVal - mean) / (3 * stdDev) : 0;
  const cpkLower = hasLimits ? (mean - leiVal) / (3 * stdDev) : 0;
  const cpk = hasLimits ? Math.min(cpkUpper, cpkLower) : 0;

  const target = hasLimits ? (leiVal + lesVal) / 2 : 0;

  return { n, mean, min, max, stdDev, cp, cpk, lei: leiVal, les: lesVal, target, hasLimits };
};

export function useStepDurationCapability(data: BatchRecord[]) {
  const [selectedRecipe, setSelectedRecipe] = useState<string>("");
  const [selectedMachines, setSelectedMachines] = useState<string[]>([]);
  const [selectedSteps, setSelectedSteps] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  const { minDataDate, maxDataDate } = useMemo(() => {
    if (!data || data.length === 0) return { minDataDate: undefined, maxDataDate: undefined };
    let minT = new Date(data[0].timestamp).getTime();
    let maxT = minT;
    data.forEach(d => {
      const t = new Date(d.timestamp).getTime();
      if (!isNaN(t)) {
        if (t < minT) minT = t;
        if (t > maxT) maxT = t;
      }
    });
    return {
      minDataDate: isNaN(minT) ? undefined : new Date(minT),
      maxDataDate: isNaN(maxT) ? undefined : new Date(maxT),
    };
  }, [data]);

  const analysisKey = `step-duration-cap-${[...selectedMachines].sort().join('-')}-${[...selectedSteps].sort().join('-')}`;
  const [lei, setLei] = useState<number | "">(0);
  const [les, setLes] = useState<number | "">(0);

  useEffect(() => {
    const savedLei = localStorage.getItem(`${analysisKey}-lei`);
    const savedLes = localStorage.getItem(`${analysisKey}-les`);
    if (savedLei !== null) setLei(parseFloat(savedLei));
    else setLei(0);
    if (savedLes !== null) setLes(parseFloat(savedLes));
    else setLes(0);
  }, [analysisKey]);

  const handleLeiChange = (val: number | "") => {
    setLei(val);
    if (val !== "") localStorage.setItem(`${analysisKey}-lei`, val.toString());
  };

  const handleLesChange = (val: number | "") => {
    setLes(val);
    if (val !== "") localStorage.setItem(`${analysisKey}-les`, val.toString());
  };

  const uniqueRecipes = useMemo(() => Array.from(new Set(data.map((d) => d.productName).filter(Boolean))).sort(), [data]);
  const uniqueMachines = useMemo(() => Array.from(new Set(data.map((d) => d.TEILANL_GRUPO).filter(Boolean))).sort(), [data]);

  const uniqueSteps = useMemo(() => {
    if (selectedMachines.length === 0) return [];
    const steps = new Set<string>();
    data.forEach(d => {
      if (selectedMachines.includes(d.TEILANL_GRUPO)) {
        d.steps.forEach(s => steps.add(s.stepName));
      }
    });
    return Array.from(steps).sort();
  }, [data, selectedMachines]);

  useEffect(() => {
    setSelectedSteps(prev => {
      if (selectedMachines.length === 0) return [];
      const validSelections = prev.filter(s => uniqueSteps.includes(s));
      if (validSelections.length !== prev.length) return validSelections;
      return prev;
    });
  }, [uniqueSteps, selectedMachines]);

  const analysisValues = useMemo(() => {
    if (selectedMachines.length === 0 || selectedSteps.length === 0) return [];
    
    return data
      .filter((d) => {
        const recipeMatch = selectedRecipe === FILTER_ALL || !selectedRecipe || d.productName === selectedRecipe;
        const machineMatch = selectedMachines.includes(d.TEILANL_GRUPO);
        let dateMatch = true;
        if (dateRange?.from) {
          const itemDate = new Date(d.timestamp);
          if (!isNaN(itemDate.getTime())) {
            const start = startOfDay(dateRange.from);
            const end = dateRange.to ? endOfDay(dateRange.to) : endOfDay(dateRange.from);
            dateMatch = itemDate >= start && itemDate <= end;
          }
        }
        return recipeMatch && machineMatch && dateMatch;
      })
      .flatMap((d) => d.steps.filter(s => selectedSteps.includes(s.stepName)).map(s => s.durationMin))
      .filter((v): v is number => typeof v === "number" && !isNaN(v));
  }, [data, selectedRecipe, selectedMachines, selectedSteps, dateRange]);

  const stats = useMemo(() => calculateStats(analysisValues, Number(lei), Number(les)), [analysisValues, lei, les]);

  const machineStats = useMemo(() => {
    const ms: Record<string, ReturnType<typeof calculateStats>> = {};
    if (selectedMachines.length <= 1) return ms;
    const nLei = Number(lei);
    const nLes = Number(les);

    selectedMachines.forEach(machine => {
      const mValues = data
        .filter((d) => {
          const recipeMatch = selectedRecipe === FILTER_ALL || !selectedRecipe || d.productName === selectedRecipe;
          const machineMatch = d.TEILANL_GRUPO === machine;
          let dateMatch = true;
          if (dateRange?.from) {
            const itemDate = new Date(d.timestamp);
            if (!isNaN(itemDate.getTime())) {
              const start = startOfDay(dateRange.from);
              const end = dateRange.to ? endOfDay(dateRange.to) : endOfDay(dateRange.from);
              dateMatch = itemDate >= start && itemDate <= end;
            }
          }
          return recipeMatch && machineMatch && dateMatch;
        })
        .flatMap((d) => d.steps.filter(s => selectedSteps.includes(s.stepName)).map(s => s.durationMin))
        .filter((v): v is number => typeof v === "number" && !isNaN(v));

      ms[machine] = calculateStats(mValues, nLei, nLes);
    });
    return ms;
  }, [data, selectedMachines, selectedRecipe, selectedSteps, dateRange, lei, les]);

  const chartData = useMemo(() => {
    if (!stats) return [];
    const { mean, stdDev, lei, les, hasLimits } = stats;
    if (stdDev === 0) return [];
    
    const points = [];
    const sigmaCount = 4;
    
    const dataStart = mean - sigmaCount * stdDev;
    const dataEnd = mean + sigmaCount * stdDev;
    
    const start = hasLimits ? Math.min(dataStart, lei - stdDev) : dataStart;
    const end = hasLimits ? Math.max(dataEnd, les + stdDev) : dataEnd;
    
    const step = (end - start) / 100;

    for (let x = start; x <= end; x += step) {
      const y = (1 / (stdDev * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * Math.pow((x - mean) / stdDev, 2));
      points.push({ x: parseFloat(x.toFixed(2)), y: parseFloat(y.toFixed(5)) });
    }
    return points;
  }, [stats]);

  return {
    selectedRecipe, setSelectedRecipe,
    selectedMachines, setSelectedMachines,
    selectedSteps, setSelectedSteps,
    dateRange, setDateRange,
    lei, handleLeiChange,
    les, handleLesChange,
    uniqueRecipes, uniqueMachines, uniqueSteps,
    minDataDate, maxDataDate, analysisValues,
    stats, machineStats, chartData
  };
}
