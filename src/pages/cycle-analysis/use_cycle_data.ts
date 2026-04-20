import { useMemo, useState, useEffect } from "react";
import { useLocalStorage } from "@/hooks/use_local_storage";
import { format, parseISO, isValid, startOfDay, endOfDay } from "date-fns";
import { calculateMergedDuration } from "@/utils/time_utils";

const EXCLUDED_EQUIPMENTS = [
  "Cortar", "Dos. Colorante", "Dosif Enzima", "Rec. Nivel", "Tolvas Bagazo",
  "Lupulo Pre Iso.1", "VE1", "VE2", "Dosificacion", "Macerar Arroz",
  "Select Lines", "Transp Bagazo", "Molienda Arroz", "Trub 3"
];

const normalizeEquip = (name: string) => name.replace(/\s+/g, '').toLowerCase();
const EXCLUDED_NORM = EXCLUDED_EQUIPMENTS.map(normalizeEquip);

const parseMachineKey = (machineName: string) => {
    const PROCESS_ORDER: Record<string, number> = {
        "Grits": 1, "Cocedor": 2, "Malta": 3, "Macerador": 4, "F1": 5, "Lavado": 6,
        "Buffer": 7, "Olla": 8, "Evapor": 9, "Trub": 10, "Enfriador": 11,
    };
    const matchMatch = machineName.match(/^(.*?)(\d+)$/);
    let num = 0;
    let base = machineName.trim();
    if (matchMatch) {
        num = parseInt(matchMatch[2], 10);
        base = matchMatch[1].trim();
        if (base.endsWith('.')) base = base.slice(0, -1).trim();
    }
    let order = 99;
    for (const key of Object.keys(PROCESS_ORDER)) {
        if (machineName.includes(key)) {
            order = PROCESS_ORDER[key];
            break;
        }
    }
    return { num, order, base };
};

export function useCycleData(data: any[]) {
  const [selectedProduct, setSelectedProduct] = useLocalStorage<string>("cycle-product", "");
  const [theoreticalDuration, setTheoreticalDuration] = useLocalStorage<number>("cycle-theoretical", 120);
  const [selectedStep, setSelectedStep] = useState<string>("FULL_CYCLE");
  const [activeTab, setActiveTab] = useState<string>("area");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedBatches, setSelectedBatches] = useState<string[]>([]);
  const [selectedEquipments, setSelectedEquipments] = useState<string[]>([]);
  const [selectedBrew, setSelectedBrew] = useState<string>("");

  const availableDates = useMemo(() => {
    if (!data) return [];
    const dateSet = new Set<string>();
    data.forEach(batch => {
        if (!batch.timestamp) return;
        if (selectedProduct && selectedProduct !== "ALL" && batch.productName !== selectedProduct) return;
        let batchStart = new Date(batch.timestamp).getTime();
        if (batch.steps && batch.steps.length > 0) {
            const firstStep = batch.steps.find((s: any) => s.startTime);
            if (firstStep?.startTime) batchStart = parseISO(firstStep.startTime).getTime();
        }
        dateSet.add(format(new Date(batchStart), "yyyy-MM-dd"));
    });
    return Array.from(dateSet).sort().reverse(); 
  }, [data, selectedProduct]);

  useEffect(() => {
      if (availableDates.length > 0 && (!selectedDate || !availableDates.includes(selectedDate))) {
          setSelectedDate(availableDates[0]);
      }
  }, [availableDates, selectedDate]);

  const uniqueProducts = useMemo(() => Array.from(new Set(data.map(d => d.productName).filter(Boolean))).sort(), [data]);
  
  const uniqueSteps = useMemo(() => {
    if (data.length === 0) return [];
    const batchWithSteps = data.find(d => d.steps && d.steps.length > 0);
    return batchWithSteps ? batchWithSteps.steps.map((s: any) => s.stepName).filter((name: string) => !name.includes("⏳ Espera")) : [];
  }, [data]);

  useEffect(() => {
    if (!selectedProduct && uniqueProducts.length > 0) {
      setSelectedProduct(uniqueProducts[0]);
    }
  }, [uniqueProducts, selectedProduct, setSelectedProduct]);

  const filteredData = useMemo(() => {
    if (!selectedProduct) return [];
    const targetBatchIds = new Set(data.filter(d => d.productName === selectedProduct).map(d => d.CHARG_NR));
    return data.filter(d => targetBatchIds.has(d.CHARG_NR));
  }, [data, selectedProduct]);

  const chartData = useMemo(() => {
    if (selectedStep === "FULL_CYCLE") {
      const groupedBatches = new Map<string, any>();
      filteredData.forEach(batch => {
        const id = batch.CHARG_NR;
        if (!id) return;
        const batchStart = new Date(batch.timestamp).getTime();
        let batchEnd = batchStart + (batch.real_total_min * 60000);
        const batchIntervals: { start: number; end: number }[] = [];
        const batchSteps = batch.steps || [];
        if (!groupedBatches.has(id)) {
          groupedBatches.set(id, { id, startTime: batchStart, endTime: batchEnd, intervals: [], uniqueSteps: new Set(), totalExpected: 0 });
        }
        const currentGroup = groupedBatches.get(id);
        currentGroup.startTime = Math.min(currentGroup.startTime, batchStart);
        if (batchSteps.length > 0) {
          const lastStep = batchSteps[batchSteps.length - 1];
          if (lastStep.endTime) {
            const le = parseISO(lastStep.endTime).getTime();
            if (!isNaN(le)) batchEnd = le;
          }
        }
        currentGroup.endTime = Math.max(currentGroup.endTime, batchEnd);
        if (batchSteps.length > 0) {
          batchSteps.forEach((step: any) => {
            if (step.stepName.includes("⏳ Espera")) return;
            if (step.startTime && step.endTime) {
              const s = parseISO(step.startTime).getTime();
              const e = parseISO(step.endTime).getTime();
              if (!isNaN(s) && !isNaN(e) && e > s) batchIntervals.push({ start: s, end: e });
            }
            const stepKey = `${step.stepName}|${step.startTime}`;
            if (!currentGroup.uniqueSteps.has(stepKey)) {
              currentGroup.uniqueSteps.add(stepKey);
              currentGroup.totalExpected += step.expectedDurationMin;
            }
          });
        } else {
          const idleTimeMs = (batch.idle_wall_minus_sumsteps_min || 0) * 60000;
          batchIntervals.push({ start: batchStart, end: Math.max(batchStart, batchEnd - idleTimeMs) });
          currentGroup.totalExpected += batch.esperado_total_min;
        }
        currentGroup.intervals.push(...batchIntervals);
      });
      return Array.from(groupedBatches.values())
        .map(b => {
          const uniqueDuration = calculateMergedDuration(b.intervals);
          const finalExpected = b.totalExpected > 1 ? b.totalExpected : theoreticalDuration;
          return {
            id: b.id, startTime: b.startTime, endTime: b.endTime,
            duration: Math.round(uniqueDuration * 100) / 100,
            expectedDuration: Math.round(finalExpected * 100) / 100,
            startLabel: format(b.startTime, "dd/MM/yyyy HH:mm"),
            endLabel: format(b.endTime, "dd/MM/yyyy HH:mm"),
            startOffset: 0, durationMs: b.endTime - b.startTime
          };
        }).sort((a, b) => a.startTime - b.startTime).filter(d => d.duration > 0.1);
    } else {
      return filteredData.map(batch => {
        const step = batch.steps?.find((s: any) => s.stepName === selectedStep);
        if (step) {
          const startTime = step.startTime ? parseISO(step.startTime).getTime() : 0;
          const endTime = step.endTime ? parseISO(step.endTime).getTime() : 0;
          if (!startTime || !endTime) return null;
          return {
            id: batch.CHARG_NR, machine: batch.TEILANL_GRUPO, startTime, endTime,
            duration: step.durationMin, expectedDuration: step.expectedDurationMin || theoreticalDuration,
            startLabel: format(startTime, "dd/MM/yyyy HH:mm"), endLabel: format(endTime, "dd/MM/yyyy HH:mm"),
            startOffset: 0, durationMs: endTime - startTime
          };
        }
        return null;
      }).filter(Boolean).sort((a: any, b: any) => a.startTime - b.startTime);
    }
  }, [filteredData, selectedStep, theoreticalDuration]);

  const stats = useMemo(() => {
    if (chartData.length === 0) return { avg: 0, count: 0, max: 0, min: 0 };
    const durations = chartData.map(d => d.duration);
    const total = durations.reduce((acc, curr) => acc + curr, 0);
    return { avg: Math.round(total / chartData.length), count: chartData.length, max: Math.max(...durations), min: Math.min(...durations) };
  }, [chartData]);

  const availableBatches = useMemo(() => {
    if (!data) return [];
    const targetDate = selectedDate ? new Date(`${selectedDate}T00:00:00`) : new Date();
    const dayStart = startOfDay(targetDate).getTime();
    const dayEnd = endOfDay(targetDate).getTime();
    const batches = new Set<string>();
    data.forEach(batch => {
        if (!batch.timestamp) return;
        if (selectedProduct && batch.productName !== selectedProduct) return;
        let batchStart = new Date(batch.timestamp).getTime();
        let batchEnd = batchStart + ((batch.real_total_min || 0) * 60000);
        if (batch.steps && batch.steps.length > 0) {
            const firstStep = batch.steps.find((s: any) => s.startTime);
            const lastStep = batch.steps[batch.steps.length - 1];
            if (firstStep?.startTime) batchStart = parseISO(firstStep.startTime).getTime();
            if (lastStep?.endTime) batchEnd = parseISO(lastStep.endTime).getTime();
        }
        if (batchEnd < dayStart || batchStart > dayEnd) return; 
        if (batch.CHARG_NR) batches.add(batch.CHARG_NR);
    });
    return Array.from(batches).sort();
  }, [data, selectedDate, selectedProduct]);

  const availableEquipments = useMemo(() => {
    if (!data) return [];
    const equipSet = new Set<string>();
    data.forEach(batch => { if (batch.TEILANL_GRUPO) equipSet.add(batch.TEILANL_GRUPO); });
    return Array.from(equipSet).filter(e => !EXCLUDED_NORM.some(excluded => normalizeEquip(e).startsWith(excluded))).sort();
  }, [data]);

  const ganttData = useMemo(() => {
      if (!data) return [];
      const targetDate = selectedDate ? new Date(`${selectedDate}T00:00:00`) : new Date();
      const dayStart = startOfDay(targetDate).getTime();
      const dayEnd = endOfDay(targetDate).getTime();
      const batchesByMachine = new Map<string, any[]>();
      data.forEach(batch => {
          if (!batch.timestamp) return;
          let batchStart = new Date(batch.timestamp).getTime();
          let batchEnd = batchStart + ((batch.real_total_min || 0) * 60000);
          if (batch.steps && batch.steps.length > 0) {
              const firstStep = batch.steps.find((s: any) => s.startTime);
              const lastStep = batch.steps[batch.steps.length - 1];
              if (firstStep?.startTime) batchStart = parseISO(firstStep.startTime).getTime();
              if (lastStep?.endTime) batchEnd = parseISO(lastStep.endTime).getTime();
          }
          if (batchEnd < dayStart || batchStart > dayEnd) return;
          if (selectedBatches.length > 0 && !selectedBatches.includes(batch.CHARG_NR)) return;
          const machine = batch.TEILANL_GRUPO;
          if (!machine || EXCLUDED_NORM.some(excluded => normalizeEquip(machine).startsWith(excluded))) return;
          if (selectedEquipments.length > 0 && !selectedEquipments.includes(machine)) return;
          if (!batchesByMachine.has(machine)) batchesByMachine.set(machine, []);
          batchesByMachine.get(machine)!.push({
              batchId: batch.CHARG_NR, productName: batch.productName,
              startTime: new Date(batchStart), endTime: new Date(batchEnd),
              durationMin: Math.round((batchEnd - batchStart) / 60000)
          });
      });
      return Array.from(batchesByMachine.entries()).map(([machineName, events]) => ({ machineName, events })).sort((a, b) => {
          const keyA = parseMachineKey(a.machineName); const keyB = parseMachineKey(b.machineName);
          if (keyA.num !== keyB.num) return keyA.num - keyB.num;
          if (keyA.order !== keyB.order) return keyA.order - keyB.order;
          return keyA.base.localeCompare(keyB.base);
      });
  }, [data, selectedDate, selectedBatches, selectedEquipments]);

  const brewGanttData = useMemo(() => {
    if (!data || !selectedBrew) return [];
    const brewRecords = data.filter(d => d.CHARG_NR === selectedBrew);
    return brewRecords.filter(record => !EXCLUDED_NORM.some(excluded => normalizeEquip(record.TEILANL_GRUPO).startsWith(excluded)))
      .map(record => ({
        machineName: record.TEILANL_GRUPO,
        steps: record.steps.filter((s: any) => !s.stepName.includes("⏳ Espera")).map((s: any) => ({
          stepName: s.stepName, startTime: parseISO(s.startTime), endTime: parseISO(s.endTime),
          durationMin: s.durationMin, expectedDurationMin: s.expectedDurationMin
        })).filter((s: any) => isValid(s.startTime) && isValid(s.endTime))
    })).filter(r => r.steps.length > 0)
    .sort((a, b) => {
        const keyA = parseMachineKey(a.machineName); const keyB = parseMachineKey(b.machineName);
        if (keyA.num !== keyB.num) return keyA.num - keyB.num;
        if (keyA.order !== keyB.order) return keyA.order - keyB.order;
        return keyA.base.localeCompare(keyB.base);
    });
  }, [data, selectedBrew]);

  const compliancePercentage = stats.count > 0 ? Math.round((chartData.filter(d => d.duration <= theoreticalDuration).length / stats.count) * 100) : 0;

  return {
      selectedProduct, setSelectedProduct,
      theoreticalDuration, setTheoreticalDuration,
      selectedStep, setSelectedStep,
      activeTab, setActiveTab,
      selectedDate, setSelectedDate,
      selectedBatches, setSelectedBatches,
      selectedEquipments, setSelectedEquipments,
      selectedBrew, setSelectedBrew,
      availableDates,
      uniqueProducts,
      uniqueSteps,
      availableBatches,
      availableEquipments,
      chartData,
      stats,
      ganttData,
      brewGanttData,
      compliancePercentage
  };
}
