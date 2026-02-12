import { useMemo, useEffect, useState } from "react";
import { useData } from "@/context/DataContext";
import { getUniqueBatchIds, getMachineData } from "@/data/mockData";
import { useLocalStorage } from "@/hooks/use-local-storage";

export function useMachineDetail() {
    const { data } = useData();

    // Estados para selección de puntos en gráficas
    const [selectedHistoryIndices, setSelectedHistoryIndices] = useState<number[]>([]);
    const [selectedTempIndices, setSelectedTempIndices] = useState<number[]>([]);

    // --- 1. LÓGICA DE RECETAS ---
    const uniqueRecipes = useMemo(() => {
        const recipes = new Set(data.map((d) => d.productName).filter(Boolean));
        return Array.from(recipes).sort();
    }, [data]);

    const [selectedRecipe, setSelectedRecipe] = useLocalStorage<string>(
        "detail-recipe-selection",
        "ALL"
    );

    // --- 2. FILTRADO DE LOTES SEGÚN RECETA ---
    const filteredBatches = useMemo(() => {
        let filtered = data;
        if (selectedRecipe && selectedRecipe !== "ALL") {
            filtered = filtered.filter((d) => d.productName === selectedRecipe);
        }
        return getUniqueBatchIds(filtered);
    }, [data, selectedRecipe]);

    const batchProductMap = useMemo(() => {
        const map = new Map<string, string>();
        data.forEach((d) => {
            if (d.productName) map.set(d.CHARG_NR, d.productName);
        });
        return map;
    }, [data]);

    const [selectedBatchId, setSelectedBatchId] = useLocalStorage<string>(
        "detail-batch-selection-v2",
        ""
    );
    const [selectedMachine, setSelectedMachine] = useLocalStorage<string>(
        "detail-machine-selection-v2",
        ""
    );

    // Estado para controlar la pestaña activa (para poder cambiarla desde el código)
    const [activeTab, setActiveTab] = useState("machine-view");

    const problematicBatches = useMemo(() => {
        const issues: any[] = [];
        data.forEach((record) => {
            const hasGap = record.idle_wall_minus_sumsteps_min > 5;
            const hasDelay = record.delta_total_min > 5;

            if (hasGap || hasDelay) {
                issues.push({
                    batch: record.CHARG_NR,
                    product: record.productName,
                    machine: record.TEILANL_GRUPO,
                    totalWait: record.idle_wall_minus_sumsteps_min,
                    totalDelay: record.delta_total_min,
                    isDelay: !hasGap && hasDelay,
                    timestamp: record.timestamp,
                });
            }
        });
        return issues.sort(
            (a, b) =>
                Math.max(b.totalWait, b.totalDelay) -
                Math.max(a.totalWait, a.totalDelay)
        );
    }, [data]);

    useEffect(() => {
        if (filteredBatches.length > 0) {
            if (!selectedBatchId || !filteredBatches.includes(selectedBatchId)) {
                setSelectedBatchId(filteredBatches[0]);
            }
        } else {
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
            if (
                !selectedMachine ||
                !availableMachinesForBatch.includes(selectedMachine)
            ) {
                setSelectedMachine(availableMachinesForBatch[0]);
            }
        } else {
            setSelectedMachine("");
        }
    }, [availableMachinesForBatch, selectedMachine, setSelectedMachine]);

    const selectedRecord = data.find(
        (d) => d.CHARG_NR === selectedBatchId && d.TEILANL_GRUPO === selectedMachine
    );

    const stepsData = useMemo(() => {
        if (!selectedRecord?.steps) return [];

        const source = selectedRecord.steps;
        const merged: typeof source = [];

        for (const step of source) {
            const last = merged[merged.length - 1];
            if (last && last.stepName === step.stepName) {
                last.durationMin += step.durationMin;
                last.expectedDurationMin += step.expectedDurationMin;
            } else {
                merged.push({ ...step });
            }
        }
        return merged;
    }, [selectedRecord]);

    const fullProcessData = useMemo(() => {
        if (!selectedBatchId) return [];

        const records = data.filter((d) => d.CHARG_NR === selectedBatchId);
        records.sort(
            (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );

        let allSteps: any[] = [];

        records.forEach((record) => {
            if (record.steps) {
                const mergedLocal: any[] = [];

                for (const step of record.steps) {
                    const last = mergedLocal[mergedLocal.length - 1];
                    if (last && last.stepName === step.stepName) {
                        last.durationMin += step.durationMin;
                        last.expectedDurationMin += step.expectedDurationMin;
                    } else {
                        mergedLocal.push({
                            ...step,
                            machineName: record.TEILANL_GRUPO,
                            uniqueLabel: `${record.TEILANL_GRUPO} - ${step.stepName}`,
                        });
                    }
                }
                allSteps = allSteps.concat(mergedLocal);
            }
        });

        return allSteps;
    }, [data, selectedBatchId]);

    // --- CÁLCULO DE ALTURA DINÁMICA ---
    const fullProcessChartHeight = useMemo(() => {
        return Math.max(500, fullProcessData.length * 50);
    }, [fullProcessData]);

    const anomaliesReport = useMemo(() => {
        if (!stepsData.length) return [];
        return stepsData
            .map((step, index) => {
                const isGap = step.stepName.includes("Espera");
                const isSlow =
                    !isGap &&
                    step.expectedDurationMin > 0 &&
                    step.durationMin > step.expectedDurationMin + 1;

                if (!isGap && !isSlow) return null;

                return {
                    id: index,
                    type: isGap ? "gap" : "delay",
                    name: step.stepName,
                    duration: step.durationMin,
                    expected: step.expectedDurationMin,
                    delta: isSlow
                        ? Math.round((step.durationMin - step.expectedDurationMin) * 100) /
                        100
                        : 0,
                    startTime: new Date(step.startTime).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                    }),
                    prevStep: index > 0 ? stepsData[index - 1].stepName : "Inicio",
                    nextStep:
                        index < stepsData.length - 1 ? stepsData[index + 1].stepName : "Fin",
                };
            })
            .filter((item): item is NonNullable<typeof item> => item !== null)
            .sort((a, b) => {
                const impactA = a.type === "gap" ? a.duration : a.delta;
                const impactB = b.type === "gap" ? b.duration : b.delta;
                return impactB - impactA;
            });
    }, [stepsData]);

    const machineHistoryData = useMemo(() => {
        if (!selectedMachine) return [];
        return getMachineData(data, selectedMachine)
            .sort(
                (a, b) =>
                    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
            )
            .map((record) => ({
                batchId: record.CHARG_NR,
                realTime: record.real_total_min,
                idle: record.idle_wall_minus_sumsteps_min,
                isCurrent: record.CHARG_NR === selectedBatchId,
            }));
    }, [data, selectedMachine, selectedBatchId]);

    // --- LOGICA DE TEMPERATURAS (ACTUALIZADO PARA DETALLE DE LOTE) ---

    // Estados locales para la gráfica de tendencias
    const [trendMachine, setTrendMachine] = useState<string>("ALL");
    const [trendRecipe, setTrendRecipe] = useState<string>("ALL");
    const [trendBatch, setTrendBatch] = useState<string>("ALL");

    // Sincronizar filtros iniciales
    useEffect(() => {
        if (selectedMachine) setTrendMachine(selectedMachine);
    }, [selectedMachine]);

    useEffect(() => {
        if (selectedRecipe) setTrendRecipe(selectedRecipe);
    }, [selectedRecipe]);

    useEffect(() => {
        // Resetear lote en tendencia si cambian los filtros superiores
        setTrendBatch("ALL");
    }, [trendRecipe, trendMachine]);

    // Máquinas disponibles para filtro
    const machinesWithTemps = useMemo(() => {
        const machines = new Set<string>();
        let filteredRecords = data;
        if (trendRecipe && trendRecipe !== "ALL") {
            filteredRecords = data.filter((d) => d.productName === trendRecipe);
        }
        filteredRecords.forEach((record) => {
            if (
                record.parameters &&
                record.parameters.some((p) => {
                    const u = (p.unit || "").toLowerCase();
                    return (
                        u.includes("°c") ||
                        u.includes("temp") ||
                        p.name.toLowerCase().includes("temp")
                    );
                })
            ) {
                machines.add(record.TEILANL_GRUPO);
            }
        });
        return Array.from(machines).sort();
    }, [data, trendRecipe]);

    // Lotes disponibles para filtro
    const availableTrendBatches = useMemo(() => {
        const batches = new Set<string>();
        let filteredRecords = data;
        if (trendRecipe && trendRecipe !== "ALL") {
            filteredRecords = filteredRecords.filter(
                (d) => d.productName === trendRecipe
            );
        }
        if (trendMachine && trendMachine !== "ALL") {
            filteredRecords = filteredRecords.filter(
                (d) => d.TEILANL_GRUPO === trendMachine
            );
        }
        filteredRecords.forEach((record) => {
            if (
                record.parameters &&
                record.parameters.some((p) => {
                    const u = (p.unit || "").toLowerCase();
                    return (
                        u.includes("°c") ||
                        u.includes("temp") ||
                        p.name.toLowerCase().includes("temp")
                    );
                })
            ) {
                batches.add(record.CHARG_NR);
            }
        });
        return Array.from(batches).sort();
    }, [data, trendRecipe, trendMachine]);

    // Variables disponibles (Temp)
    const availableTempParams = useMemo(() => {
        if (!trendMachine) return [];
        const allParams = data
            .filter((d) => trendMachine === "ALL" || d.TEILANL_GRUPO === trendMachine)
            .flatMap((d) => d.parameters || []);

        const temps = new Set<string>();
        allParams.forEach((p) => {
            const u = (p.unit || "").toLowerCase();
            if (
                u.includes("°c") ||
                u.includes("temp") ||
                p.name.toLowerCase().includes("temp")
            ) {
                temps.add(p.name);
            }
        });
        return Array.from(temps).sort();
    }, [data, trendMachine]);

    const [selectedTempParam, setSelectedTempParam] = useState<string>("");

    useEffect(() => {
        if (availableTempParams.length > 0) {
            if (
                !selectedTempParam ||
                !availableTempParams.includes(selectedTempParam)
            ) {
                setSelectedTempParam(availableTempParams[0]);
            }
        } else {
            setSelectedTempParam("");
        }
    }, [availableTempParams, selectedTempParam]);

    // DATOS DE LA GRÁFICA DE TEMPERATURA
    const tempTrendData = useMemo(() => {
        if (!selectedTempParam) return [];

        // --- MODO 1: DETALLE DE LOTE (Paso a Paso) ---
        if (trendBatch && trendBatch !== "ALL") {
            // Buscar el registro específico del lote
            let record;
            if (trendMachine && trendMachine !== "ALL") {
                record = data.find(
                    (d) => d.CHARG_NR === trendBatch && d.TEILANL_GRUPO === trendMachine
                );
            } else {
                // Si no hay máquina seleccionada, intentamos buscar cualquiera que tenga el lote
                record = data.find((d) => d.CHARG_NR === trendBatch);
            }

            if (!record || !record.parameters) return [];

            // Extraer la secuencia de pasos para la variable seleccionada
            return record.parameters
                .filter((p) => p.name === selectedTempParam)
                .map((p, index) => ({
                    stepName: p.stepName || `Paso ${index + 1}`,
                    value: Number(p.value),
                    unit: p.unit,
                    // Agregamos propiedades para consistencia con el otro modo, aunque no se usen todas
                    batchId: record?.CHARG_NR,
                    date: record?.timestamp,
                    machine: record?.TEILANL_GRUPO,
                    isCurrent: true,
                }));
        }

        // --- MODO 2: HISTÓRICO (Tendencia entre lotes) ---
        let records =
            trendMachine === "ALL" ? data : getMachineData(data, trendMachine);

        if (trendRecipe && trendRecipe !== "ALL") {
            records = records.filter((d) => d.productName === trendRecipe);
        }

        return records
            .sort(
                (a, b) =>
                    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
            )
            .map((record) => {
                // En modo histórico solo tomamos el primer valor representativo
                const param = record.parameters?.find(
                    (p) => p.name === selectedTempParam
                );
                return {
                    batchId: record.CHARG_NR,
                    value: param ? Number(param.value) : null,
                    date: new Date(record.timestamp).toLocaleString([], {
                        dateStyle: "short",
                        timeStyle: "short",
                    }),
                    machine: record.TEILANL_GRUPO,
                    isCurrent: record.CHARG_NR === selectedBatchId,
                };
            })
            .filter(
                (
                    d
                ): d is {
                    batchId: string;
                    value: number;
                    date: string;
                    machine: string;
                    isCurrent: boolean;
                } => d.value !== null && Number.isFinite(d.value)
            );
    }, [
        data,
        trendMachine,
        trendRecipe,
        trendBatch,
        selectedTempParam,
        selectedBatchId,
    ]);

    const currentGap = selectedRecord ? selectedRecord.max_gap_min : 0;
    const currentIdle = selectedRecord
        ? selectedRecord.idle_wall_minus_sumsteps_min
        : 0;

    const loadSuggestion = (batch: string, machine: string) => {
        const record = data.find((d) => d.CHARG_NR === batch);
        if (
            record &&
            selectedRecipe !== "ALL" &&
            record.productName !== selectedRecipe
        ) {
            setSelectedRecipe("ALL");
        }
        setSelectedBatchId(batch);
        setSelectedMachine(machine);
        setActiveTab("machine-view"); // Forzar vista de máquina
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    return {
        data,
        uniqueRecipes,
        selectedRecipe,
        setSelectedRecipe,
        filteredBatches,
        batchProductMap,
        selectedBatchId,
        setSelectedBatchId,
        selectedMachine,
        setSelectedMachine,
        activeTab,
        setActiveTab,
        problematicBatches,
        availableMachinesForBatch,
        currentGap,
        currentIdle,
        selectedRecord,
        stepsData,
        fullProcessData,
        fullProcessChartHeight,
        anomaliesReport,
        machineHistoryData,
        selectedHistoryIndices,
        setSelectedHistoryIndices,
        trendBatch,
        setTrendBatch,
        trendRecipe,
        setTrendRecipe,
        trendMachine,
        setTrendMachine,
        selectedTempParam,
        setSelectedTempParam,
        machinesWithTemps,
        availableTrendBatches,
        availableTempParams,
        tempTrendData,
        selectedTempIndices,
        setSelectedTempIndices,
        loadSuggestion
    };
}
