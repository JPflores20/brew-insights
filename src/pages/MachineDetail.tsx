import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  AlertTriangle,
  Clock,
  ListFilter,
  AlertCircle,
  ArrowRight,
  Search,
  CheckCircle2,
  Timer,
  Gauge,
  Thermometer,
  Package,
  Filter,
  Layers,
  LayoutDashboard,
} from "lucide-react";
import { useData } from "@/context/DataContext";
import { getUniqueBatchIds, getMachineData } from "@/data/mockData";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export default function MachineDetail() {
  const { data } = useData();

  // --- 1. LÓGICA DE RECETAS ---
  const uniqueRecipes = useMemo(() => {
    const recipes = new Set(data.map(d => d.productName).filter(Boolean));
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
      filtered = filtered.filter(d => d.productName === selectedRecipe);
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

  const [paramFilter, setParamFilter] = useState<"all" | "process" | "materials">("process");
  
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
    
    const records = data.filter(d => d.CHARG_NR === selectedBatchId);
    records.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    let allSteps: any[] = [];

    records.forEach(record => {
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
                        uniqueLabel: `${record.TEILANL_GRUPO} - ${step.stepName}`
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

  const parametersData = selectedRecord?.parameters || [];

  const filteredParameters = useMemo(() => {
    if (paramFilter === "all") return parametersData;

    return parametersData.filter((p) => {
      const u = (p.unit || "").toLowerCase();
      const isProcessVar = /°c|bar|mbar|pa|rpm|hz|%|hl\/h|m3\/h|l\/min|a|v|kw/.test(u);
      
      if (paramFilter === "process") {
        return isProcessVar;
      } else {
        return !isProcessVar;
      }
    });
  }, [parametersData, paramFilter]);

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

        const prevStep = index > 0 ? stepsData[index - 1].stepName : "Inicio";
        const nextStep =
          index < stepsData.length - 1 ? stepsData[index + 1].stepName : "Fin";

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
          prevStep,
          nextStep,
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

  const currentGap = selectedRecord ? selectedRecord.max_gap_min : 0;
  const currentIdle = selectedRecord
    ? selectedRecord.idle_wall_minus_sumsteps_min
    : 0;

  const loadSuggestion = (batch: string, machine: string) => {
    const record = data.find(d => d.CHARG_NR === batch);
    if (record && selectedRecipe !== "ALL" && record.productName !== selectedRecipe) {
        setSelectedRecipe("ALL");
    }
    setSelectedBatchId(batch);
    setSelectedMachine(machine);
    setActiveTab("machine-view"); // Forzar vista de máquina
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const themedTooltipContentStyle: CSSProperties = {
    backgroundColor: "hsl(var(--popover))",
    borderColor: "hsl(var(--border))",
    borderRadius: "8px",
    color: "hsl(var(--popover-foreground))",
    fontSize: "14px",
  };

  const themedTooltipLabelStyle: CSSProperties = {
    color: "hsl(var(--popover-foreground))",
    fontWeight: "bold",
  };

  const themedTooltipItemStyle: CSSProperties = {
    color: "hsl(var(--popover-foreground))",
  };

  type SpecLimits = Record<string, { lsl: string; usl: string }>;

  const [specLimits, setSpecLimits] = useLocalStorage<SpecLimits>(
    "cpk-temp-delta-specs-v1",
    {}
  );

  const mean = (arr: number[]) =>
    arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

  const stdDevSample = (arr: number[]) => {
    if (arr.length < 2) return 0;
    const m = mean(arr);
    const v =
      arr.reduce((acc, x) => acc + Math.pow(x - m, 2), 0) / (arr.length - 1);
    return Math.sqrt(v);
  };

  const calcCpCpk = (values: number[], lsl: number, usl: number) => {
    const n = values.length;
    const m = mean(values);
    const s = stdDevSample(values);

    if (
      n < 2 ||
      s <= 0 ||
      !Number.isFinite(s) ||
      !Number.isFinite(lsl) ||
      !Number.isFinite(usl) ||
      usl <= lsl
    ) {
      return { n, mean: m, sigma: s, cp: null as number | null, cpk: null as number | null };
    }

    const cp = (usl - lsl) / (6 * s);
    const cpu = (usl - m) / (3 * s);
    const cpl = (m - lsl) / (3 * s);
    const cpk = Math.min(cpu, cpl);

    return { n, mean: m, sigma: s, cp, cpk };
  };

  const updateSpec = (paramName: string, field: "lsl" | "usl", value: string) => {
    setSpecLimits({
      ...specLimits,
      [paramName]: {
        lsl: specLimits[paramName]?.lsl ?? "",
        usl: specLimits[paramName]?.usl ?? "",
        [field]: value,
      },
    });
  };

  const clearSpec = (paramName: string) => {
    const next = { ...specLimits };
    delete next[paramName];
    setSpecLimits(next);
  };

  const cpCpkByParam = useMemo(() => {
    if (!selectedMachine) return [];

    const allParams = data
      .filter((r) => r.TEILANL_GRUPO === selectedMachine)
      .flatMap((r) => r.parameters || []);

    const groups = new Map<string, typeof allParams>();
    allParams.forEach((p) => {
      const arr = groups.get(p.name) ?? [];
      arr.push(p);
      groups.set(p.name, arr);
    });

    const results = Array.from(groups.entries()).map(([name, items]) => {
      const deltas = items
        .map((p) => Number(p.value) - Number(p.target))
        .filter((v) => Number.isFinite(v));

      const unit = items[0]?.unit || "";
      const lslStr = specLimits[name]?.lsl ?? "";
      const uslStr = specLimits[name]?.usl ?? "";
      const lsl = Number(lslStr);
      const usl = Number(uslStr);

      const stats = calcCpCpk(deltas, lsl, usl);

      const hasSpec = Number.isFinite(lsl) && Number.isFinite(usl) && usl > lsl;

      return {
        name,
        unit,
        n: stats.n,
        mean: stats.mean,
        sigma: stats.sigma,
        lsl: Number.isFinite(lsl) ? lsl : null,
        usl: Number.isFinite(usl) ? usl : null,
        cp: stats.cp,
        cpk: stats.cpk,
        hasSpec,
      };
    });

    return results.sort((a, b) => {
      if (a.hasSpec && !b.hasSpec) return -1;
      if (!a.hasSpec && b.hasSpec) return 1;
      return (a.cpk ?? 999) - (b.cpk ?? 999);
    });
  }, [data, selectedMachine, specLimits]);

  const formatNum = (v: number | null, d = 2) => {
    if (v === null || !Number.isFinite(v)) return "—";
    const rounded = Math.round(v * Math.pow(10, d)) / Math.pow(10, d);
    return rounded.toLocaleString(undefined, { maximumFractionDigits: d });
  };

  const cpkBadge = (cpk: number | null) => {
    if (cpk === null || !Number.isFinite(cpk)) {
      return {
        text: "Sin Cpk",
        cls: "bg-muted text-muted-foreground border border-border",
      };
    }
    if (cpk >= 1.33) {
      return {
        text: "OK (≥1.33)",
        cls: "bg-green-500/10 text-green-700 border border-green-500/20",
      };
    }
    if (cpk >= 1.0) {
      return {
        text: "Riesgo (1.00-1.32)",
        cls: "bg-yellow-500/10 text-yellow-700 border border-yellow-500/20",
      };
    }
    return {
      text: "Fuera (<1.00)",
      cls: "bg-red-500/10 text-red-700 border border-red-500/20",
    };
  };

  const formatNumber = (v: any, decimals = 2) => {
    const num = typeof v === "number" ? v : Number(v);
    if (Number.isNaN(num)) return String(v);
    const rounded = Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
    return rounded.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: decimals,
    });
  };

  const truncateLabel = (v: any, max = 18) => {
    const s = String(v ?? "");
    return s.length > max ? s.slice(0, max - 1) + "…" : s;
  };

  const paramTickInterval = useMemo(() => {
    const n = filteredParameters.length;
    if (n <= 10) return 0;
    if (n <= 20) return 1;
    if (n <= 30) return 2;
    return Math.ceil(n / 10);
  }, [filteredParameters.length]);

  const getParamUnit = (payload: any) => {
    const unit =
      payload?.unit ??
      payload?.units ??
      payload?.uom ??
      payload?.UOM ??
      payload?.unidad ??
      payload?.unidades;

    if (unit) return ` ${unit}`;

    const pname =
      payload?.parameterName ??
      payload?.paramName ??
      payload?.parameter ??
      payload?.name ??
      payload?.tag;

    if (typeof pname === "string") {
      if (/temp|temper/i.test(pname)) return " °C";
      if (/pres|press|presi/i.test(pname)) return " bar";
      if (/flow|caudal/i.test(pname)) return " l/min";
      if (/ph/i.test(pname)) return " pH";
      if (/rpm/i.test(pname)) return " rpm";
    }
    return "";
  };

  if (data.length === 0) {
    return (
      <DashboardLayout>
        <div className="flex h-[50vh] items-center justify-center">
          <div className="text-center text-muted-foreground">
            <Clock className="mx-auto h-12 w-12 opacity-50 mb-4" />
            <h2 className="text-xl font-semibold">Sin Datos</h2>
            <p>
              Por favor carga un archivo Excel en la pestaña "Resumen" primero.
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-in fade-in duration-500 pb-8">
        {/* --- HEADER --- */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Detalle de Lote y Pasos
            </h1>
            <p className="text-muted-foreground">
              Selecciona un lote o revisa las sugerencias automáticas
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="font-mono">
              {selectedBatchId || "—"}
            </Badge>
            <Badge variant="secondary" className="font-mono">
              {selectedMachine || "—"}
            </Badge>
          </div>
        </div>

        {/* --- FILTROS GLOBALES (RECETA Y LOTE) --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 1. SELECCIONAR RECETA */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-2 pt-4">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <span className="bg-primary/20 text-primary w-6 h-6 rounded-full flex items-center justify-center text-xs">
                  1
                </span>
                Filtrar Receta
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedRecipe} onValueChange={setSelectedRecipe}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todas las recetas</SelectItem>
                  {uniqueRecipes.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* 2. SELECCIONAR LOTE */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-2 pt-4">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <span className="bg-primary/20 text-primary w-6 h-6 rounded-full flex items-center justify-center text-xs">
                  2
                </span>
                Seleccionar Lote
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedBatchId} onValueChange={setSelectedBatchId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Buscar lote..." />
                </SelectTrigger>
                <SelectContent>
                  {filteredBatches.map((batch) => (
                    <SelectItem key={batch} value={batch}>
                      {batch} - {batchProductMap.get(batch) || "Sin producto"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </div>

        {/* --- PESTAÑAS PRINCIPALES --- */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
            <TabsTrigger value="machine-view" className="flex items-center gap-2">
              <LayoutDashboard className="h-4 w-4" /> Detalle por Equipo
            </TabsTrigger>
            <TabsTrigger value="global-view" className="flex items-center gap-2">
              <Layers className="h-4 w-4" /> Cronología Global
            </TabsTrigger>
          </TabsList>

          {/* === PESTAÑA 1: VISTA DE MÁQUINA INDIVIDUAL === */}
          <TabsContent value="machine-view" className="space-y-6 animate-in fade-in duration-300">
             {/* SUB-FILTRO MÁQUINA + KPIS */}
             <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {/* 3. VER EN EQUIPO */}
                <Card className="bg-card border-border">
                  <CardHeader className="pb-2 pt-4">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <span className="bg-primary/20 text-primary w-6 h-6 rounded-full flex items-center justify-center text-xs">
                        3
                      </span>
                      Ver en Equipo
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Select
                      value={selectedMachine}
                      onValueChange={setSelectedMachine}
                      disabled={availableMachinesForBatch.length === 0}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue
                          placeholder={
                            availableMachinesForBatch.length === 0
                              ? "Lote sin equipos"
                              : "Selecciona equipo"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {availableMachinesForBatch.map((machine) => (
                          <SelectItem key={machine} value={machine}>
                            {machine}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </CardContent>
                </Card>

                {/* 4. KPI GAP */}
                <Card className="bg-card border-border">
                  <CardContent className="pt-6 flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Mayor Gap
                      </p>
                      <p className="text-3xl font-bold mt-2 text-chart-delay">
                        {currentGap} m
                      </p>
                    </div>
                    <div className="p-3 rounded-full bg-chart-delay/10">
                      <AlertTriangle className="h-6 w-6 text-chart-delay" />
                    </div>
                  </CardContent>
                </Card>

                {/* 5. KPI TIEMPO MUERTO */}
                <Card className="bg-card border-border">
                  <CardContent className="pt-6 flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        T. Muerto
                      </p>
                      <p className="text-3xl font-bold mt-2 text-blue-500">
                        {currentIdle} m
                      </p>
                    </div>
                    <div className="p-3 rounded-full bg-blue-500/10">
                      <Clock className="h-6 w-6 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>
             </div>

             {/* LAYOUT PRINCIPAL DE LA VISTA MÁQUINA */}
             <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                {/* CONTENIDO (izquierda) */}
                <div className="xl:col-span-8 space-y-6">
                  {/* GRÁFICA DE SECUENCIA INDIVIDUAL */}
                  {selectedRecord && stepsData.length > 0 ? (
                    <Card className="bg-card border-border p-6 border-l-4 border-l-primary h-[520px]">
                      <div className="flex items-center gap-2 mb-6">
                        <ListFilter className="h-5 w-5 text-primary" />
                        <div className="min-w-0">
                          <CardTitle className="text-lg font-semibold truncate">
                            Secuencia de Pasos ({selectedBatchId} - {selectedMachine})
                          </CardTitle>
                          <p className="text-sm text-muted-foreground truncate">
                            {selectedRecord.productName}
                          </p>
                        </div>
                      </div>

                      <div className="h-[420px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={stepsData}
                            layout="vertical"
                            margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                            barCategoryGap="20%"
                          >
                            <CartesianGrid
                              strokeDasharray="3 3"
                              opacity={0.1}
                              horizontal={true}
                              vertical={true}
                            />
                            <XAxis type="number" hide />
                            <YAxis
                              dataKey="stepName"
                              type="category"
                              width={180}
                              tick={{
                                fontSize: 11,
                                fill: "hsl(var(--muted-foreground))",
                              }}
                              interval={0}
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "hsl(var(--popover))",
                                borderColor: "hsl(var(--border))",
                                borderRadius: "8px",
                                color: "hsl(var(--popover-foreground))",
                              }}
                              cursor={{ fill: "transparent" }}
                            />
                            <Legend
                              wrapperStyle={{ paddingTop: "10px" }}
                              payload={[
                                {
                                  value: "Duración Real (min)",
                                  type: "rect",
                                  color: "hsl(var(--primary))",
                                },
                                {
                                  value: "Espera / Gap (min)",
                                  type: "rect",
                                  color: "#ef4444",
                                },
                                {
                                  value: "Duración Esperada (min)",
                                  type: "rect",
                                  color: "#3b82f6", // COLOR AZUL
                                },
                              ]}
                            />
                            <Bar
                              dataKey="durationMin"
                              name="Duración Real (min)"
                              fill="hsl(var(--primary))"
                              radius={[0, 4, 4, 0]}
                              barSize={20}
                            >
                              {stepsData.map((entry, index) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={
                                    entry.stepName.includes("Espera")
                                      ? "#ef4444"
                                      : "hsl(var(--primary))"
                                  }
                                />
                              ))}
                            </Bar>
                            <Bar
                              dataKey="expectedDurationMin"
                              name="Duración Esperada (min)"
                              fill="#3b82f6" // COLOR AZUL
                              radius={[0, 4, 4, 0]}
                              barSize={10}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </Card>
                  ) : (
                    <Card className="bg-card border-border p-6 border-l-4 border-l-yellow-500 h-[520px]">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-yellow-500" />
                        <p className="text-sm font-medium">
                          Selecciona un lote para ver los detalles.
                        </p>
                      </div>
                    </Card>
                  )}
                </div>

                {/* PANEL INSIGHTS (derecha) */}
                <div className="xl:col-span-4">
                  <div className="flex flex-col gap-4 xl:sticky xl:top-6 xl:self-start">
                    {/* LISTA DETALLADA DE ANOMALÍAS */}
                    <Card className="bg-card border-border flex flex-col h-[520px] xl:h-[calc(100vh-260px)] overflow-hidden">
                      <CardHeader className="pb-3 border-b border-border">
                        <div className="flex items-center gap-2 text-foreground">
                          <AlertCircle className="h-5 w-5 text-orange-500" />
                          <CardTitle className="text-lg">Detalle de Ineficiencias</CardTitle>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {anomaliesReport.length > 0
                            ? `Lista de ${anomaliesReport.length} anomalías encontradas`
                            : "Sin ineficiencias detectadas"}
                        </p>
                      </CardHeader>

                      <CardContent className="flex-1 p-0 min-h-0">
                        {anomaliesReport.length > 0 ? (
                          <ScrollArea className="h-full w-full p-4">
                            <div className="space-y-4">
                              {anomaliesReport.map((item) => (
                                <div
                                  key={item.id}
                                  className={`p-3 rounded-lg border text-sm animate-in fade-in slide-in-from-right-4 duration-500 ${
                                    item.type === "gap"
                                      ? "bg-red-500/10 border-red-500/20"
                                      : "bg-orange-500/10 border-orange-500/20"
                                  }`}
                                >
                                  <div className="flex justify-between items-start mb-2">
                                    <Badge
                                      variant="outline"
                                      className={
                                        item.type === "gap"
                                          ? "text-red-500 border-red-500/30 bg-red-500/5 font-bold"
                                          : "text-orange-600 border-orange-500/30 bg-orange-500/5 font-bold"
                                      }
                                    >
                                      {item.type === "gap" ? "PARADA / GAP" : "PASO LENTO"}
                                    </Badge>
                                    <span
                                      className={`font-mono font-bold ${
                                        item.type === "gap" ? "text-red-500" : "text-orange-600"
                                      }`}
                                    >
                                      {item.type === "gap"
                                        ? `${item.duration} min`
                                        : `+${item.delta} min`}
                                    </span>
                                  </div>

                                  <div className="text-xs text-muted-foreground space-y-1">
                                    <p className="font-medium text-foreground text-sm mb-1">
                                      {item.name}
                                    </p>

                                    {item.type === "delay" && (
                                      <div className="flex justify-between text-xs px-2 py-1 bg-background/50 rounded border border-border/50 mb-2">
                                        <span>
                                          Real: <strong>{item.duration}m</strong>
                                        </span>
                                        <span>
                                          Esperado: <strong>{item.expected}m</strong>
                                        </span>
                                      </div>
                                    )}

                                    <div className="flex items-center gap-1 opacity-80">
                                      <Clock className="h-3 w-3" />
                                      <span>Inicio: {item.startTime}</span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </ScrollArea>
                        ) : (
                          <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-6 text-center">
                            <CheckCircle2 className="h-12 w-12 text-green-500 mb-3 opacity-20" />
                            <p className="text-sm">Todo correcto</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </div>
             </div>

             {/* ELEMENTOS ADICIONALES VISTA MAQUINA (Cp/Cpk, Variables, Historia) */}
             <div className="space-y-6">
                {/* Cp/Cpk */}
                {selectedMachine && (
                  <Card className="bg-card border-border">
                    <CardHeader className="pb-3 border-b border-border">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Gauge className="h-5 w-5 text-indigo-600" />
                            Cp / Cpk de ΔT (Real - Target)
                          </CardTitle>
                          <CardDescription>
                            Define límites LSL/USL por parámetro para calcular capacidad del proceso.
                          </CardDescription>
                        </div>
                        <Badge variant="secondary" className="font-mono">
                          Máquina: {selectedMachine}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-4">
                      {cpCpkByParam.length === 0 ? (
                        <div className="text-sm text-muted-foreground">
                          No hay parámetros para calcular Cp/Cpk en esta máquina.
                        </div>
                      ) : (
                        <ScrollArea className="h-[320px] w-full pr-4">
                          <div className="space-y-3">
                            {cpCpkByParam.map((row) => {
                              const badge = cpkBadge(row.cpk);
                              return (
                                <div
                                  key={row.name}
                                  className="rounded-lg border border-border p-3 bg-background/50"
                                >
                                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                                    <div className="min-w-0">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-medium text-foreground truncate">
                                          {row.name}
                                        </span>
                                        <Badge variant="outline" className="text-xs">
                                          ΔT ({row.unit || "u"})
                                        </Badge>
                                        <span className={`px-2 py-1 rounded-md text-xs ${badge.cls}`}>
                                          {badge.text}
                                        </span>
                                      </div>
                                      <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 text-xs text-muted-foreground">
                                        <div className="rounded border border-border/60 bg-background/60 px-2 py-1">
                                          n: <strong className="text-foreground">{row.n}</strong>
                                        </div>
                                        <div className="rounded border border-border/60 bg-background/60 px-2 py-1">
                                          μ: <strong className="text-foreground">{formatNum(row.mean, 3)}</strong>
                                        </div>
                                        <div className="rounded border border-border/60 bg-background/60 px-2 py-1">
                                          σ: <strong className="text-foreground">{formatNum(row.sigma, 3)}</strong>
                                        </div>
                                        <div className="rounded border border-border/60 bg-background/60 px-2 py-1">
                                          Cp: <strong className="text-foreground">{formatNum(row.cp, 2)}</strong>
                                        </div>
                                        <div className="rounded border border-border/60 bg-background/60 px-2 py-1">
                                          Cpk: <strong className="text-foreground">{formatNum(row.cpk, 2)}</strong>
                                        </div>
                                        <div className="rounded border border-border/60 bg-background/60 px-2 py-1">
                                          Spec: <strong className="text-foreground">{row.lsl === null || row.usl === null ? "—" : `${row.lsl} / ${row.usl}`}</strong>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 lg:w-[260px]">
                                      <div>
                                        <label className="text-xs text-muted-foreground">LSL</label>
                                        <Input
                                          value={specLimits[row.name]?.lsl ?? ""}
                                          onChange={(e) => updateSpec(row.name, "lsl", e.target.value)}
                                          placeholder="Ej: -0.5"
                                          inputMode="decimal"
                                        />
                                      </div>
                                      <div>
                                        <label className="text-xs text-muted-foreground">USL</label>
                                        <Input
                                          value={specLimits[row.name]?.usl ?? ""}
                                          onChange={(e) => updateSpec(row.name, "usl", e.target.value)}
                                          placeholder="Ej: 0.5"
                                          inputMode="decimal"
                                        />
                                      </div>
                                      <div className="col-span-2 flex justify-end">
                                        <Button size="sm" variant="ghost" className="h-8" onClick={() => clearSpec(row.name)}>
                                          Limpiar límites
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </ScrollArea>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Variables */}
                {parametersData.length > 0 && (
                  <Card className="bg-card border-border shadow-sm w-full flex flex-col">
                    <CardHeader className="pb-3 border-b border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <Gauge className="h-5 w-5 text-blue-600" />
                          <Thermometer className="h-5 w-5 text-sky-600 opacity-70" />
                          <CardTitle className="text-lg">Análisis de Variables</CardTitle>
                        </div>
                        <CardDescription>
                          Visualiza variables de proceso o adiciones de materiales paso a paso.
                        </CardDescription>
                      </div>
                      <Tabs value={paramFilter} onValueChange={(val) => setParamFilter(val as any)} className="w-full sm:w-[320px]">
                        <TabsList className="grid w-full grid-cols-3">
                          <TabsTrigger value="all" className="text-xs"><Filter className="h-3 w-3 mr-1" /> Todos</TabsTrigger>
                          <TabsTrigger value="process" className="text-xs"><Gauge className="h-3 w-3 mr-1" /> Proceso</TabsTrigger>
                          <TabsTrigger value="materials" className="text-xs"><Package className="h-3 w-3 mr-1" /> Materiales</TabsTrigger>
                        </TabsList>
                      </Tabs>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="h-[420px] w-full p-4">
                        {filteredParameters.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={filteredParameters} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                              <defs>
                                <linearGradient id="colorParam" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor={paramFilter === 'materials' ? "#16a34a" : "#3b82f6"} stopOpacity={0.8} />
                                  <stop offset="95%" stopColor={paramFilter === 'materials' ? "#16a34a" : "#3b82f6"} stopOpacity={0} />
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                              <XAxis dataKey="stepName" tick={{ fontSize: 12 }} interval={paramTickInterval} minTickGap={12} angle={-20} textAnchor="end" height={90} tickFormatter={(v) => truncateLabel(v, 22)} />
                              <YAxis tick={{ fontSize: 12 }} />
                              <Tooltip contentStyle={themedTooltipContentStyle} labelStyle={themedTooltipLabelStyle} itemStyle={themedTooltipItemStyle} cursor={{ fill: "transparent" }} labelFormatter={(label) => String(label)} formatter={(value: any, name: any, props: any) => { const unit = getParamUnit(props?.payload); return [`${formatNumber(value, 2)}${unit}`, name]; }} />
                              <Legend wrapperStyle={{ paddingTop: "10px" }} />
                              <Area type="monotone" dataKey="value" stroke={paramFilter === 'materials' ? "#16a34a" : "#3b82f6"} fillOpacity={1} fill="url(#colorParam)" name={paramFilter === 'materials' ? "Cantidad" : "Valor Registrado"} />
                            </AreaChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="h-full flex items-center justify-center text-muted-foreground"><p>No hay datos para la categoría seleccionada.</p></div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Historia */}
                {machineHistoryData.length > 0 && (
                  <Card className="bg-card border-border w-full p-6 opacity-90 hover:opacity-100 transition-opacity">
                    <CardTitle className="mb-6 text-lg font-semibold flex items-center justify-between">
                      <span>Tendencia Histórica</span>
                      <span className="text-sm font-normal text-muted-foreground">Comparativa con otros lotes en {selectedMachine}</span>
                    </CardTitle>
                    <div className="h-[340px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={machineHistoryData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorRealTime" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                              <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.2} vertical={false} />
                          <XAxis dataKey="batchId" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={{ stroke: "hsl(var(--border))" }} />
                          <YAxis label={{ value: "Minutos", angle: -90, position: "insideLeft", fill: "hsl(var(--muted-foreground))" }} tick={{ fill: "hsl(var(--muted-foreground))" }} axisLine={false} />
                          <Tooltip contentStyle={{ backgroundColor: "hsl(var(--popover))", borderColor: "hsl(var(--border))", borderRadius: "8px" }} labelStyle={{ color: "hsl(var(--popover-foreground))" }} />
                          <Area type="monotone" dataKey="realTime" stroke="#8884d8" strokeWidth={2} fillOpacity={1} fill="url(#colorRealTime)" name="Tiempo Real" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>
                )}
             </div>
          </TabsContent>

          {/* === PESTAÑA 2: CRONOLOGÍA GLOBAL === */}
          <TabsContent value="global-view" className="space-y-6 animate-in fade-in duration-300">
             {fullProcessData.length > 0 ? (
               <Card className="bg-card border-border p-6 shadow-sm">
                 <div className="flex items-center gap-2 mb-6">
                   <Layers className="h-5 w-5 text-indigo-500" />
                   <div className="min-w-0">
                     <CardTitle className="text-lg font-semibold truncate">
                       Cronología Completa del Lote (Todos los Equipos)
                     </CardTitle>
                     <p className="text-sm text-muted-foreground truncate">
                       Vista unificada de todas las máquinas secuenciadas por tiempo.
                     </p>
                   </div>
                 </div>

                 {/* WRAPPER CON SCROLL */}
                 <ScrollArea className="h-[600px] w-full pr-4 border rounded-md bg-background/50">
                   <div style={{ height: `${fullProcessChartHeight}px`, width: "100%", minWidth: "800px" }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={fullProcessData}
                          layout="vertical"
                          margin={{ top: 20, right: 30, left: 10, bottom: 20 }}
                          barCategoryGap="20%"
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            opacity={0.1}
                            horizontal={true}
                            vertical={true}
                          />
                          <XAxis type="number" />
                          <YAxis
                            dataKey="uniqueLabel"
                            type="category"
                            width={260}
                            tick={{
                              fontSize: 12,
                              fill: "hsl(var(--muted-foreground))",
                            }}
                            interval={0}
                            tickFormatter={(value) => {
                                return value.length > 40 ? value.substring(0, 40) + "..." : value;
                            }}
                          />
                          <Tooltip
                            contentStyle={themedTooltipContentStyle}
                            cursor={{ fill: "transparent" }}
                            formatter={(value: any, name: any) => [value, name]}
                            labelFormatter={(label) => label.split(' - ')[1] || label}
                          />
                          <Legend wrapperStyle={{ paddingTop: "10px" }} />
                          <Bar
                            dataKey="durationMin"
                            name="Duración Real (min)"
                            fill="hsl(var(--primary))"
                            radius={[0, 4, 4, 0]}
                            barSize={24}
                          >
                            {fullProcessData.map((entry, index) => (
                              <Cell
                                key={`cell-full-${index}`}
                                fill={
                                  entry.stepName.includes("Espera")
                                    ? "#ef4444"
                                    : "hsl(var(--primary))"
                                }
                              />
                            ))}
                          </Bar>
                          <Bar
                            dataKey="expectedDurationMin"
                            name="Duración Esperada (min)"
                            fill="#3b82f6" // COLOR AZUL
                            radius={[0, 4, 4, 0]}
                            barSize={12}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                   </div>
                 </ScrollArea>
               </Card>
             ) : (
                <div className="flex h-[300px] items-center justify-center border rounded-md bg-muted/20">
                    <p className="text-muted-foreground">Selecciona un lote para ver la cronología.</p>
                </div>
             )}
          </TabsContent>
        </Tabs>

        {/* --- PANEL DE SUGERENCIAS (SIEMPRE VISIBLE AL FINAL) --- */}
        {problematicBatches.length > 0 && (
          <Card className="bg-card border-border border-l-4 border-l-orange-500 mt-8">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Search className="h-5 w-5 text-orange-500" />
                <CardTitle className="text-lg">
                  🔍 Detección Automática de Problemas
                </CardTitle>
              </div>
              <CardDescription>
                Se han encontrado {problematicBatches.length} registros con
                ineficiencias.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[170px] w-full pr-4">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  {problematicBatches.map((issue, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-lg border border-border bg-background hover:bg-accent/50 transition-colors"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="secondary" className="font-mono">
                            {issue.batch}
                          </Badge>
                          <span
                            className="text-xs text-muted-foreground truncate max-w-[160px]"
                            title={issue.machine}
                          >
                            {issue.machine}
                          </span>
                        </div>
                        <div className="text-[10px] text-muted-foreground mb-1 font-medium truncate">
                          {issue.product}
                        </div>
                        <p
                          className={
                            issue.isDelay
                              ? "text-xs text-orange-500 font-medium flex items-center gap-1"
                              : "text-xs text-red-500 font-medium flex items-center gap-1"
                          }
                        >
                          {issue.isDelay ? (
                            <Timer className="h-3 w-3" />
                          ) : (
                            <Clock className="h-3 w-3" />
                          )}
                          {issue.isDelay
                            ? `Retraso: +${issue.totalDelay} min`
                            : `Espera: ${issue.totalWait} min`}
                        </p>
                      </div>

                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs ml-3 shrink-0"
                        onClick={() => loadSuggestion(issue.batch, issue.machine)}
                      >
                        Analizar <ArrowRight className="ml-2 h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}