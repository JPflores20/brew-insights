import { useState } from "react";
import { useData } from "@/context/data_context";
import { useMdRecipe } from "./use_machine_detail/use_md_recipe";
import { useMdProcess } from "./use_machine_detail/use_md_process";
import { useMdHistory } from "./use_machine_detail/use_md_history";
import { useMdTemp } from "./use_machine_detail/use_md_temp";
import { FILTER_ALL } from "@/lib/constants";

export function useMachineDetail() {
  const { data } = useData();
  const [activeTab, setActiveTab] = useState("machine-view");
  const [selectedHistoryIndices, setSelectedHistoryIndices] = useState<number[]>([]);
  const [selectedTempIndices, setSelectedTempIndices] = useState<number[]>([]);
  
  const recipeData = useMdRecipe(data);
  const { selectedBatchId, selectedMachine, selectedRecipe, compareBatchIds, setCompareBatchIds } = recipeData;
  
  const processData = useMdProcess(data, selectedBatchId, selectedMachine);
  const { selectedRecord } = processData;
  
  const historyData = useMdHistory(data, selectedMachine, selectedBatchId);
  const tempData = useMdTemp(data, selectedMachine, selectedRecipe, selectedBatchId);
  
  const currentGap = selectedRecord ? selectedRecord.max_gap_min : 0;
  const currentIdle = selectedRecord ? selectedRecord.idle_wall_minus_sumsteps_min : 0;

  const loadSuggestion = (batch: string, machine: string) => {
    const record = data.find((d) => d.CHARG_NR === batch);
    if (record && selectedRecipe !== FILTER_ALL && record.productName !== selectedRecipe) {
      recipeData.setSelectedRecipe(FILTER_ALL);
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
    ...recipeData,
    ...processData,
    ...historyData,
    ...tempData,
  };
}
