import { useMemo, useState } from "react";
import { BatchRecord, getUniqueBatchIds } from "@/data/mock_data";

export interface UseMachineryDataProps {
  data: BatchRecord[];
  selectedBatchId: string;
  compareBatchIds: string[];
}

export function useMachineryData({
  data,
  selectedBatchId,
  compareBatchIds,
}: UseMachineryDataProps) {
  const batchRecords = useMemo(() => {
    return data.filter((d) => d.CHARG_NR === selectedBatchId);
  }, [data, selectedBatchId]);

  const filterRecord = batchRecords.find((r) =>
    r.TEILANL_GRUPO.toLowerCase().includes("filtro"),
  );
  
  const maceratorRecord = batchRecords.find((r) =>
    r.TEILANL_GRUPO.toLowerCase().includes("macerador"),
  );

  const filterSteps = filterRecord?.steps || [];
  const startStepFilter = "Arranca Olla";
  const endStepFilter = "Ag.Ultimo Lavado";

  const startFilterIndex = filterSteps.findIndex(
    (s) => s.stepName.toLowerCase() === startStepFilter.toLowerCase(),
  );
  
  const endFilterIndex = filterSteps.findIndex(
    (s) => s.stepName.toLowerCase() === endStepFilter.toLowerCase(),
  );

  const filterTotalTime = useMemo(() => {
    if (startFilterIndex === -1 || endFilterIndex === -1 || startFilterIndex >= endFilterIndex) return 0;
    let total = 0;
    for (let i = startFilterIndex + 1; i < endFilterIndex; i++) {
        total += filterSteps[i].durationMin;
    }
    return total;
  }, [filterSteps, startFilterIndex, endFilterIndex]);

  const maceratorSteps = useMemo(() => {
    const rawSteps = maceratorRecord?.steps || [];
    if (!rawSteps.length) return [];
    
    const collapsed = [];
    let current = { ...rawSteps[0] };
    
    for (let i = 1; i < rawSteps.length; i++) {
        if (rawSteps[i].stepName === current.stepName) {
            current.durationMin += rawSteps[i].durationMin;
        } else {
            collapsed.push(current);
            current = { ...rawSteps[i] };
        }
    }
    collapsed.push(current);
    return collapsed;
  }, [maceratorRecord]);

  const recibirCocedorTime = useMemo(() => {
    if (!maceratorSteps.length) return "N/A";
    const step = maceratorSteps.find(
      (s) => s.stepName.toLowerCase() === "recibir cocedor"
    );
    return step ? `${step.durationMin} min` : "N/A"; 
  }, [maceratorSteps]);

  const [selectedMaceratorStepIndex, setSelectedMaceratorStepIndex] = useState<string>("0");
  
  const maceratorStepOptions = useMemo(() => {
    return maceratorSteps.map((s, idx) => ({
      stepName: s.stepName,
      index: idx,
    }));
  }, [maceratorSteps]);

  const maceratorCalculatedTime = useMemo(() => {
    const index = parseInt(selectedMaceratorStepIndex, 10);
    if (isNaN(index) || !maceratorSteps[index]) {
      return { duration: 0, valid: false };
    }
    return { duration: maceratorSteps[index].durationMin, valid: true };
  }, [maceratorSteps, selectedMaceratorStepIndex]);

  const conversionTemp = useMemo(() => {
    if (!maceratorRecord?.parameters) return "N/A";
    const normalize = (s: string) => s.toLowerCase().trim();
    const param = maceratorRecord.parameters.find(
      (p) =>
        (normalize(p.stepName).includes("cont. conversion") ||
          normalize(p.stepName).includes("cont. conversión")) &&
        (p.name.toLowerCase().includes("temp") ||
          p.unit.toLowerCase().includes("c")),
    );
    return param ? `${param.value} ${param.unit}` : "N/A";
  }, [maceratorRecord]);

  const allBatchIds = useMemo(() => getUniqueBatchIds(data), [data]);

  const selectedEndStepName = endStepFilter;

  const selectedMaceratorStepName = useMemo(() => {
    const idx = parseInt(selectedMaceratorStepIndex, 10);
    return isNaN(idx) ? "" : maceratorSteps[idx]?.stepName || "";
  }, [maceratorSteps, selectedMaceratorStepIndex]);

  const comparisonData = useMemo(() => {
    return compareBatchIds.map(batchId => {
        const batchRecords = data.filter(d => d.CHARG_NR === batchId);
        const fRec = batchRecords.find(r => r.TEILANL_GRUPO.toLowerCase().includes("filtro"));
        const mRec = batchRecords.find(r => r.TEILANL_GRUPO.toLowerCase().includes("macerador"));
        
        let fTime = 0;
        if (fRec) {
            const fSteps = fRec.steps || [];
            const sIdx = fSteps.findIndex(s => s.stepName.toLowerCase() === "arranca olla".toLowerCase());
            const eIdx = fSteps.findIndex(s => s.stepName.toLowerCase() === "ag.ultimo lavado".toLowerCase());
            if (sIdx !== -1 && eIdx !== -1 && sIdx < eIdx) {
                for (let i = sIdx + 1; i < eIdx; i++) fTime += fSteps[i].durationMin;
            }
        }

        const rawMSteps = mRec?.steps || [];
        const mSteps = [];
        if (rawMSteps.length > 0) {
            let curr = { ...rawMSteps[0] };
            for (let i = 1; i < rawMSteps.length; i++) {
                if (rawMSteps[i].stepName === curr.stepName) curr.durationMin += rawMSteps[i].durationMin;
                else { mSteps.push(curr); curr = { ...rawMSteps[i] }; }
            }
            mSteps.push(curr);
        }

        const recCocTime = mSteps.find(s => s.stepName.toLowerCase() === "recibir cocedor")?.durationMin;
        
        const normalize = (s: string) => s.toLowerCase().trim();
        const startPIdx = mSteps.findIndex(s => normalize(s.stepName).includes("control temp"));
        const endPIdx = mSteps.findIndex(s => normalize(s.stepName).includes("cont. conversion") || normalize(s.stepName).includes("cont. conversión"));
        let pDur = 0;
        if (startPIdx !== -1 && endPIdx !== -1 && startPIdx < endPIdx) {
            for (let i = startPIdx + 1; i < endPIdx; i++) {
                if (normalize(mSteps[i].stepName).includes("pausa")) pDur += mSteps[i].durationMin;
            }
        }

        const selStepDur = mSteps.find(s => s.stepName.toLowerCase() === selectedMaceratorStepName.toLowerCase())?.durationMin;
        
        const convTemp = mRec?.parameters?.find(p => 
            (normalize(p.stepName).includes("cont. conversion") || normalize(p.stepName).includes("cont. conversión")) && 
            (p.name.toLowerCase().includes("temp") || p.unit.toLowerCase().includes("c"))
        );

        const platoParam = batchRecords.flatMap(r => r.parameters || []).find(p => p.dfmCode === "DFM8" && p.value > 0);

        return {
            batchId,
            filterTime: fTime,
            recibirCocedor: recCocTime || 0,
            recibirCocedorLabel: recCocTime !== undefined ? `${recCocTime} min` : "N/A",
            pauseDur: pDur,
            selectedStepDur: selStepDur || 0,
            selectedStepLabel: selStepDur !== undefined ? `${selStepDur.toFixed(2)} min` : "—",
            conversionTemp: convTemp?.value || 0,
            conversionTempLabel: convTemp ? `${convTemp.value} ${convTemp.unit}` : "N/A",
            plato: platoParam?.value || 0,
            platoLabel: platoParam ? `${platoParam.value} ${platoParam.unit || ""}` : "N/A"
        };
    });
  }, [data, compareBatchIds, selectedEndStepName, selectedMaceratorStepName, startStepFilter]);

  const chartData = useMemo(() => {
    const metrics = [
        { key: "filterTime", name: "Filtro (min)" },
        { key: "recibirCocedor", name: "Rec. Cocedor (min)" },
        { key: "pauseDur", name: "Pausa (min)" },
        { key: "selectedStepDur", name: "Paso Sel. (min)" },
        { key: "conversionTemp", name: "Temp. Conv (°C)" },
        { key: "plato", name: "Grado Plato" },
    ];

    return metrics.map(m => {
        const point: any = { metric: m.name };
        comparisonData.forEach(d => {
            point[d.batchId] = d[m.key as keyof typeof d];
        });
        return point;
    });
  }, [comparisonData]);

  const colors = ["#8884d8", "#82ca9d", "#ffc658", "#ff8042", "#0088fe", "#00c49f", "#ffbb28", "#ff4444", "#a4de6c"];

  const evolutionMetrics = [
    { key: "filterTime", name: "Filtro", color: "#8884d8" },
    { key: "recibirCocedor", name: "Rec. Cocedor", color: "#82ca9d" },
    { key: "pauseDur", name: "Pausa", color: "#ffc658" },
    { key: "selectedStepDur", name: "Paso Sel.", color: "#ff8042" },
    { key: "conversionTemp", name: "Temp. Conv", color: "#0088fe" },
    { key: "plato", name: "Grado Plato", color: "#00c49f" },
  ];

  return {
    startStepFilter,
    endStepFilter,
    startFilterIndex,
    endFilterIndex,
    filterTotalTime,
    maceratorRecord,
    recibirCocedorTime,
    selectedMaceratorStepIndex,
    setSelectedMaceratorStepIndex,
    maceratorStepOptions,
    maceratorCalculatedTime,
    conversionTemp,
    allBatchIds,
    selectedMaceratorStepName,
    comparisonData,
    chartData,
    colors,
    evolutionMetrics,
  };
}
