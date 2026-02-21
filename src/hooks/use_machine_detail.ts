import { useState } from "react";
import { useData } from "@/context/data_context";

// Sub-hooks
import { useMdRecipe } from "./use_machine_detail/use_md_recipe";
import { useMdProcess } from "./use_machine_detail/use_md_process";
import { useMdHistory } from "./use_machine_detail/use_md_history";
import { useMdTemp } from "./use_machine_detail/use_md_temp";

export function useMachineDetail() {
  const { data } = useData();

  // Estados visuales genéricos
  const [activeTab, setActiveTab] = useState("machine-view");
  const [selectedHistoryIndices, setSelectedHistoryIndices] = useState<number[]>([]);
  const [selectedTempIndices, setSelectedTempIndices] = useState<number[]>([]);

  // 1. Lógica de recetas y filtrado principal
  const recipeData = useMdRecipe(data);
  const { selectedBatchId, selectedMachine, selectedRecipe } = recipeData;

  // 2. Proceso (Gantt, Anomalías, Pasos)
  const processData = useMdProcess(data, selectedBatchId, selectedMachine);
  const { selectedRecord } = processData;

  // 3. Histórico de Maquinaria y Lotes Problemáticos
  const historyData = useMdHistory(data, selectedMachine, selectedBatchId);

  // 4. Parámetros de Temperatura
  const tempData = useMdTemp(data, selectedMachine, selectedRecipe, selectedBatchId);

  // Cálculos derivados rápidos
  const currentGap = selectedRecord ? selectedRecord.max_gap_min : 0;
  const currentIdle = selectedRecord ? selectedRecord.idle_wall_minus_sumsteps_min : 0;

  const loadSuggestion = (batch: string, machine: string) => {
    const record = data.find((d) => d.CHARG_NR === batch);
    if (record && selectedRecipe !== "ALL" && record.productName !== selectedRecipe) {
      recipeData.setSelectedRecipe("ALL");
    }
    recipeData.setSelectedBatchId(batch);
    recipeData.setSelectedMachine(machine);
    setActiveTab("machine-view");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return {
    data,
    activeTab, setActiveTab,
    selectedHistoryIndices, setSelectedHistoryIndices,
    selectedTempIndices, setSelectedTempIndices,
    currentGap, currentIdle,
    loadSuggestion,
    
    // Spread de los sub-hooks para mantener compatibilidad con la interfaz
    ...recipeData,
    ...processData,
    ...historyData,
    ...tempData,
  };
}
