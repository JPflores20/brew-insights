import { useState } from "react";
import { SeriesItem, BatchRecord } from "@/types";
import { COLORS, computeOptions } from "./bc_utils";
import { FILTER_ALL } from "@/lib/constants";

export function useBcSeries(data: BatchRecord[]) {
  const [seriesList, setSeriesList] = useState<SeriesItem[]>([
    { 
      id: "1", 
      recipe: FILTER_ALL, 
      machine: FILTER_ALL, 
      batch: FILTER_ALL,
      step: FILTER_ALL,
      parameter: FILTER_ALL,
      color: COLORS[0] 
    },
  ]);
  const addSeries = () => {
    const nextId = Math.max(0, ...seriesList.map((s) => parseInt(s.id))) + 1;
    const lastSeries = seriesList[seriesList.length - 1];
    setSeriesList([
      ...seriesList,
      {
        id: nextId.toString(),
        recipe: lastSeries?.recipe ?? FILTER_ALL,
        machine: lastSeries?.machine ?? FILTER_ALL,
        batch: lastSeries?.batch ?? FILTER_ALL,
        step: lastSeries?.step ?? FILTER_ALL,
        parameter: lastSeries?.parameter ?? FILTER_ALL,
        color: COLORS[(nextId - 1) % COLORS.length],
      },
    ]);
  };
  const removeSeries = (id: string) => {
    setSeriesList(seriesList.filter((s) => s.id !== id));
  };
  const updateSeries = (id: string, field: string, value: string) => {
    const index = seriesList.findIndex(s => s.id === id);
    if (index === -1) return;
    
    const newList = [...seriesList];
    newList[index] = { 
      ...newList[index], 
      [field]: value 
    };
    if (field === "recipe" || field === "machine") {
      newList[index].batch = FILTER_ALL;
    }
    if (field === "machine") {
      newList[index].parameter = FILTER_ALL;
      newList[index].step = FILTER_ALL;
    }
    setSeriesList(newList);
  };
  const seriesOptions = seriesList.map((s) => ({
    ...s,
    ...computeOptions(data, s.recipe, s.machine),
    setRecipe: (val: string) => updateSeries(s.id, "recipe", val),
    setMachine: (val: string) => updateSeries(s.id, "machine", val),
    setBatch: (val: string) => updateSeries(s.id, "batch", val),
    setStep: (val: string) => updateSeries(s.id, "step", val),
    setParameter: (val: string) => updateSeries(s.id, "parameter", val),
    onRemove: seriesList.length > 1 ? () => removeSeries(s.id) : undefined,
  }));
  return { 
    seriesList, 
    addSeries, 
    updateSeries, 
    removeSeries, 
    seriesOptions 
  };
}
