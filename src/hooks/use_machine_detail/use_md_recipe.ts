import { useMemo, useEffect, useTransition } from "react";
import { BatchRecord } from "@/types";
import { getUniqueBatchIds } from "@/data/mock_data";
import { useLocalStorage } from "@/hooks/use_local_storage";
import { FILTER_ALL } from "@/lib/constants";

export function useMdRecipe(data: BatchRecord[]) {
  const [isPending, startTransition] = useTransition();
  const uniqueRecipes = useMemo(() => {
    const rawSet = new Set(data.map((d) => d.productName).filter(Boolean));
    return Array.from(rawSet).sort();
  }, [data]);

  const [_selectedRecipe, _setSelectedRecipe] = useLocalStorage<string>(
    "detail-recipe-selection", 
    FILTER_ALL
  );
  const selectedRecipe = _selectedRecipe;
  const setSelectedRecipe = (value: string) => startTransition(() => _setSelectedRecipe(value));

  const filteredBatches = useMemo(() => {
    let filtered = selectedRecipe && selectedRecipe !== FILTER_ALL 
      ? data.filter((d) => d.productName === selectedRecipe) 
      : data;
    return getUniqueBatchIds(filtered);
  }, [data, selectedRecipe]);

  const batchProductMap = useMemo(() => {
    const map = new Map<string, string>();
    data.forEach((d) => { 
      if (d.productName) {
        map.set(d.CHARG_NR, d.productName); 
      }
    });
    return map;
  }, [data]);

  const [_selectedBatchId, _setSelectedBatchId] = useLocalStorage<string>(
    "detail-batch-selection-v2", 
    ""
  );
  const selectedBatchId = _selectedBatchId;
  const setSelectedBatchId = (value: string) => startTransition(() => _setSelectedBatchId(value));

  const [_selectedMachine, _setSelectedMachine] = useLocalStorage<string>(
    "detail-machine-selection-v2", 
    ""
  );
  const selectedMachine = _selectedMachine;
  const setSelectedMachine = (value: string) => startTransition(() => _setSelectedMachine(value));

  const [_compareBatchIds, _setCompareBatchIds] = useLocalStorage<string[]>(
    "detail-compare-batches",
    [selectedBatchId]
  );
  const compareBatchIds = _compareBatchIds;
  const setCompareBatchIds = (value: string[] | ((prev: string[]) => string[])) => {
    startTransition(() => {
      _setCompareBatchIds(value);
    });
  };

  // ESTADOS ESPECÍFICOS PARA LA PESTAÑA DE COMPARATIVA (PERSISTENTES)
  const [compSelectedRecipe, setCompSelectedRecipe] = useLocalStorage<string>(
    "comp-tab-recipe",
    FILTER_ALL
  );
  
  const [compCompareBatchIds, setCompCompareBatchIds] = useLocalStorage<string[]>(
    "comp-tab-batches",
    []
  );

  const [compSelectedMachineGroup, setCompSelectedMachineGroup] = useLocalStorage<string>(
    "comp-tab-machine-group",
    "" // Se inicializará con la máquina actual si está vacío
  );

  useEffect(() => {
    if (selectedBatchId && !compareBatchIds.includes(selectedBatchId)) {
      setCompareBatchIds((prev) => [...prev, selectedBatchId]);
    }
  }, [selectedBatchId]);

  useEffect(() => {
    if (filteredBatches.length > 0) {
      if (!selectedBatchId || !filteredBatches.includes(selectedBatchId)) {
        setSelectedBatchId(filteredBatches[0]);
      }
    } else if (filteredBatches.length === 0) {
      setSelectedBatchId("");
    }
  }, [filteredBatches, selectedBatchId, setSelectedBatchId]);

  const availableMachinesForBatch = useMemo(() => {
    if (!selectedBatchId) return [];
    const records = data.filter((d) => d.CHARG_NR === selectedBatchId);
    return Array.from(new Set(records.map((r) => r.TEILANL_GRUPO))).sort();
  }, [data, selectedBatchId]);

  useEffect(() => {
    if (availableMachinesForBatch.length > 0) {
      if (!selectedMachine || !availableMachinesForBatch.includes(selectedMachine)) {
        setSelectedMachine(availableMachinesForBatch[0]);
      }
    } else if (availableMachinesForBatch.length === 0) {
      setSelectedMachine("");
    }
  }, [availableMachinesForBatch, selectedMachine, setSelectedMachine]);

  return {
    uniqueRecipes,
    selectedRecipe, 
    setSelectedRecipe,
    filteredBatches,
    batchProductMap,
    selectedBatchId, 
    setSelectedBatchId,
    selectedMachine, 
    setSelectedMachine,
    availableMachinesForBatch,
    compareBatchIds,
    setCompareBatchIds,
    // Estados de comparativa
    compSelectedRecipe,
    setCompSelectedRecipe,
    compCompareBatchIds,
    setCompCompareBatchIds,
    compSelectedMachineGroup,
    setCompSelectedMachineGroup,
    isPending
  };
}
