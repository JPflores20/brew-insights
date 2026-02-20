// src/hooks/useBatchComparison.ts
// Lógica de estado y cálculo extraída de BatchComparison.tsx

import { useState, useEffect, useMemo } from "react";
import { useData } from "@/context/DataContext";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { getUniqueBatchIds, getMachineData } from "@/data/mockData";
import { SeriesItem } from "@/types";

const COLORS = [
  "#ef4444", "#3b82f6", "#10b981", "#f59e0b",
  "#8b5cf6", "#ec4899", "#6366f1", "#14b8a6", "#f43f5e", "#64748b",
];

// ── Helpers de filtrado ──────────────────────────────────────────────────────

/** Determina si un parámetro es una temperatura */
function isTemperatureParam(name: string, unit: string): boolean {
  const u = unit.toLowerCase();
  const n = name.toLowerCase();
  return u.includes("°c") || u.includes("temp") || n.includes("temp");
}

/** Devuelve las opciones disponibles para una serie según recipe/machine actuales */
function computeOptions(
  data: ReturnType<typeof getMachineData>,
  currentRecipe: string,
  currentMachine: string
) {
  const recipeSource =
    currentMachine && currentMachine !== "ALL"
      ? data.filter((d) => d.TEILANL_GRUPO === currentMachine)
      : data;

  const availableRecipes = Array.from(
    new Set(recipeSource.map((d) => d.productName).filter(Boolean))
  ).sort();

  const machineSource =
    currentRecipe && currentRecipe !== "ALL"
      ? data.filter((d) => d.productName === currentRecipe)
      : data;

  const availableMachines = Array.from(
    new Set(
      machineSource
        .filter((d) =>
          d.parameters?.some((p) => isTemperatureParam(p.name, p.unit || ""))
        )
        .map((d) => d.TEILANL_GRUPO)
    )
  ).sort();

  let batchSource = data;
  if (currentRecipe && currentRecipe !== "ALL")
    batchSource = batchSource.filter((d) => d.productName === currentRecipe);
  if (currentMachine && currentMachine !== "ALL")
    batchSource = batchSource.filter((d) => d.TEILANL_GRUPO === currentMachine);

  const availableBatches = Array.from(
    new Set(
      batchSource
        .filter((d) =>
          d.parameters?.some((p) => isTemperatureParam(p.name, p.unit || ""))
        )
        .map((d) => d.CHARG_NR)
    )
  ).sort();

  return { availableRecipes, availableMachines, availableBatches };
}

// ── Hook principal ───────────────────────────────────────────────────────────

export function useBatchComparison() {
  const { data } = useData();
  const batchIds = getUniqueBatchIds(data);

  // Estado persistente en localStorage
  const [batchA, setBatchA] = useLocalStorage<string>("batch-comparison-a", "");
  const [batchB, setBatchB] = useLocalStorage<string>("batch-comparison-b", "");
  const [chartType, setChartType] = useLocalStorage<string>(
    "batch-comparison-chart-type",
    "bar"
  );

  // Estado volátil (se resetea al recargar)
  const [seriesList, setSeriesList] = useState<SeriesItem[]>([
    { id: "1", recipe: "ALL", machine: "ALL", batch: "ALL", color: COLORS[0] },
  ]);
  const [selectedTempParam, setSelectedTempParam] = useState<string>("");
  const [selectedTempIndices, setSelectedTempIndices] = useState<number[]>([]);

  // Recetas únicas
  const uniqueRecipes = useMemo(
    () =>
      Array.from(new Set(data.map((d) => d.productName || "Desconocido"))).sort(),
    [data]
  );

  // Mapa lote → producto
  const batchProductMap = useMemo(() => {
    const map = new Map<string, string>();
    data.forEach((d) => {
      if (d.productName) map.set(d.CHARG_NR, d.productName);
    });
    return map;
  }, [data]);

  // Parámetros de temperatura disponibles
  const availableTempParams = useMemo(() => {
    const temps = new Set<string>();
    data.forEach((d) =>
      d.parameters?.forEach((p) => {
        if (isTemperatureParam(p.name, p.unit || "")) temps.add(p.name);
      })
    );
    return Array.from(temps).sort();
  }, [data]);

  // Auto-seleccionar primer parámetro de temperatura
  useEffect(() => {
    if (
      availableTempParams.length > 0 &&
      (!selectedTempParam || !availableTempParams.includes(selectedTempParam))
    ) {
      setSelectedTempParam(availableTempParams[0]);
    }
  }, [availableTempParams, selectedTempParam]);

  // Sincronizar batchA / batchB cuando cambian los IDs
  useEffect(() => {
    if (batchIds.length >= 2) {
      if (!batchA || !batchIds.includes(batchA)) setBatchA(batchIds[0]);
      if (!batchB || !batchIds.includes(batchB)) setBatchB(batchIds[1]);
    }
  }, [batchIds, batchA, batchB, setBatchA, setBatchB]);

  // ── Cálculo de datos de una serie ─────────────────────────────────────────

  const calculateTrendData = (
    tMachine: string,
    tRecipe: string,
    tBatch: string,
    param: string
  ) => {
    const getParamValue = (record: typeof data[0] | undefined) => {
      if (!record?.parameters) return null;
      const exact = record.parameters.find((p) => p.name === param);
      if (exact) return exact;
      return record.parameters.find((p) =>
        isTemperatureParam(p.name, p.unit || "")
      );
    };

    if (tBatch && tBatch !== "ALL") {
      const record =
        tMachine && tMachine !== "ALL"
          ? data.find(
              (d) => d.CHARG_NR === tBatch && d.TEILANL_GRUPO === tMachine
            )
          : data.find((d) => d.CHARG_NR === tBatch);

      if (!record?.parameters) return [];

      const exactMatches = record.parameters.filter((p) => p.name === param);
      const source =
        exactMatches.length > 0
          ? exactMatches
          : record.parameters.filter((p) =>
              isTemperatureParam(p.name, p.unit || "")
            );

      return source.map((p, index) => ({
        stepName: p.stepName || `Paso ${index + 1}`,
        value: Number(p.value),
        unit: p.unit,
        date: record.timestamp,
      }));
    }

    // Modo histórico
    let records =
      tMachine === "ALL" ? data : getMachineData(data, tMachine);
    if (tRecipe && tRecipe !== "ALL")
      records = records.filter((d) => d.productName === tRecipe);

    return records
      .sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      )
      .map((record) => {
        const pVal = getParamValue(record);
        const dateLabel = new Date(record.timestamp).toLocaleString([], {
          dateStyle: "short",
          timeStyle: "short",
        });
        return {
          batchId: record.CHARG_NR,
          value: pVal ? Number(pVal.value) : null,
          date: dateLabel,
          machine: record.TEILANL_GRUPO,
          stepName: dateLabel,
        };
      })
      .filter(
        (d): d is typeof d & { value: number } =>
          d.value !== null && Number.isFinite(d.value)
      );
  };

  // ── Datos del gráfico principal (todas las series fusionadas) ─────────────

  const chartData = useMemo(() => {
    const dataMap = new Map<string, Record<string, unknown>>();

    seriesList.forEach((series) => {
      const points = calculateTrendData(
        series.machine,
        series.recipe,
        series.batch,
        selectedTempParam
      );
      points.forEach((p, index) => {
        const isBatchMode = series.batch && series.batch !== "ALL";
        const key = isBatchMode ? index.toString() : p.stepName;

        if (!dataMap.has(key)) {
          dataMap.set(key, {
            originalIndex: index,
            stepName: p.stepName,
            date: p.date,
            unit: (p as { unit?: string }).unit,
          });
        }
        const entry = dataMap.get(key)!;
        entry[`value_${series.id}`] = p.value;
        if ((p as { unit?: string }).unit)
          entry.unit = (p as { unit?: string }).unit;
      });
    });

    const result = Array.from(dataMap.values());
    const isBatchModeGlobal = seriesList.some(
      (s) => s.batch && s.batch !== "ALL"
    );

    if (isBatchModeGlobal) {
      result.sort(
        (a, b) => (a.originalIndex as number) - (b.originalIndex as number)
      );
    } else {
      result.sort((a, b) => {
        const dA = new Date(
          (a.date as string) || (a.stepName as string)
        ).getTime();
        const dB = new Date(
          (b.date as string) || (b.stepName as string)
        ).getTime();
        return dA - dB;
      });
    }

    return result;
  }, [seriesList, selectedTempParam, data]);

  // ── Gestión de series ─────────────────────────────────────────────────────

  const addSeries = () => {
    const nextId =
      Math.max(0, ...seriesList.map((s) => parseInt(s.id))) + 1;
    const lastSeries = seriesList[seriesList.length - 1];
    setSeriesList([
      ...seriesList,
      {
        id: nextId.toString(),
        recipe: lastSeries?.recipe ?? "ALL",
        machine: lastSeries?.machine ?? "ALL",
        batch: lastSeries?.batch ?? "ALL",
        color: COLORS[(nextId - 1) % COLORS.length],
      },
    ]);
  };

  const removeSeries = (id: string) =>
    setSeriesList(seriesList.filter((s) => s.id !== id));

  const updateSeries = (index: number, field: string, value: string) => {
    const newList = [...seriesList];
    newList[index] = { ...newList[index], [field]: value };
    if (field === "recipe" || field === "machine")
      newList[index].batch = "ALL";
    setSeriesList(newList);
  };

  // ── Opciones por serie (para el selector UI) ──────────────────────────────

  const seriesOptions = seriesList.map((s, index) => ({
    ...s,
    ...computeOptions(data, s.recipe, s.machine),
    setRecipe: (val: string) => updateSeries(index, "recipe", val),
    setMachine: (val: string) => updateSeries(index, "machine", val),
    setBatch: (val: string) => updateSeries(index, "batch", val),
    onRemove:
      seriesList.length > 1 ? () => removeSeries(s.id) : undefined,
  }));

  return {
    // Datos
    data,
    batchIds,
    batchProductMap,
    uniqueRecipes,
    availableTempParams,
    chartData,
    seriesOptions,
    // Estado
    batchA,
    setBatchA,
    batchB,
    setBatchB,
    chartType,
    setChartType,
    selectedTempParam,
    setSelectedTempParam,
    selectedTempIndices,
    setSelectedTempIndices,
    // Acciones
    addSeries,
  };
}
