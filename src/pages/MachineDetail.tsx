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
  Sparkles,
  Loader2,
  Timer,
  Droplets,
  Scale,
  Gauge,
  Thermometer,
} from "lucide-react";
import { useData } from "@/context/DataContext";
import { getUniqueBatchIds, getMachineData } from "@/data/mockData";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { analyzeProcessGaps } from "@/utils/gemini";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function MachineDetail() {
  const { data } = useData();

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);

  const allBatches = useMemo(() => getUniqueBatchIds(data), [data]);

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

  useEffect(() => {
    setAiAnalysis(null);
  }, [selectedBatchId, selectedMachine]);

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
    if (allBatches.length > 0) {
      if (!selectedBatchId || !allBatches.includes(selectedBatchId)) {
        setSelectedBatchId(allBatches[0]);
      }
    }
  }, [allBatches, selectedBatchId, setSelectedBatchId]);

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

  const stepsData = selectedRecord?.steps || [];
  const materialsData = selectedRecord?.materials || [];
  const parametersData = selectedRecord?.parameters || [];

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

  const totalImpactMinutes = useMemo(() => {
    return anomaliesReport.reduce((acc, g) => {
      const impact = g.type === "gap" ? g.duration : g.delta;
      return acc + impact;
    }, 0);
  }, [anomaliesReport]);

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
    setSelectedBatchId(batch);
    setSelectedMachine(machine);
    window.scrollTo({ top: 400, behavior: "smooth" });
  };

  const handleConsultAI = async () => {
    if (anomaliesReport.length === 0) return;

    setIsAnalyzing(true);
    setAiAnalysis(null);

    const result = await analyzeProcessGaps(
      selectedBatchId,
      selectedMachine,
      anomaliesReport
    );

    setAiAnalysis(result);
    setIsAnalyzing(false);
  };

  // ✅ ESTILO UNIFICADO PARA TOOLTIP (para que no se vea blanco)
  const themedTooltipContentStyle: CSSProperties = {
    backgroundColor: "hsl(var(--popover))",
    borderColor: "hsl(var(--border))",
    borderRadius: "8px",
    color: "hsl(var(--popover-foreground))",
    fontSize: "14px",
  };

  const themedTooltipLabelStyle: CSSProperties = {
    color: "hsl(var(--popover-foreground))",
  };

  const themedTooltipItemStyle: CSSProperties = {
    color: "hsl(var(--popover-foreground))",
  };

// ===============================
//  Cp / Cpk (ΔT = value - target) con límites configurables por el usuario
// ===============================
type SpecLimits = Record<string, { lsl: string; usl: string }>;

const [specLimits, setSpecLimits] = useLocalStorage<SpecLimits>(
  "cpk-temp-delta-specs-v1",
  {}
);

const mean = (arr: number[]) =>
  arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

// desviación estándar muestral (n-1)
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

// Cp/Cpk por parámetro usando ΔT (value - target) para la máquina seleccionada
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

  // primero los que tienen spec válido; luego por peor Cpk
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

  // ✅ Helpers: formato, truncado, intervalos dinámicos de ticks
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

  const materialTickInterval = useMemo(() => {
    const n = materialsData.length;
    if (n <= 10) return 0;
    if (n <= 20) return 1;
    if (n <= 30) return 2;
    return Math.ceil(n / 10);
  }, [materialsData.length]);

  const paramTickInterval = useMemo(() => {
    const n = parametersData.length;
    if (n <= 10) return 0;
    if (n <= 20) return 1;
    if (n <= 30) return 2;
    return Math.ceil(n / 10);
  }, [parametersData.length]);

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
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
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

        {/* --- PANEL DE SUGERENCIAS --- */}
        {problematicBatches.length > 0 && (
          <Card className="bg-card border-border border-l-4 border-l-orange-500">
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

        {/* --- CONTROLES + KPIs --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <Card className="bg-card border-border">
            <CardHeader className="pb-2 pt-4">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <span className="bg-primary/20 text-primary w-6 h-6 rounded-full flex items-center justify-center text-xs">
                  1
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
                  {allBatches.map((batch) => (
                    <SelectItem key={batch} value={batch}>
                      {batch} - {batchProductMap.get(batch) || "Sin producto"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-2 pt-4">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <span className="bg-primary/20 text-primary w-6 h-6 rounded-full flex items-center justify-center text-xs">
                  2
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

          <Card className="bg-card border-border">
            <CardContent className="pt-6 flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Mayor Gap en este Lote
                </p>
                <p className="text-3xl font-bold mt-2 text-chart-delay">
                  {currentGap} min
                </p>
              </div>
              <div className="p-4 rounded-full bg-chart-delay/10">
                <AlertTriangle className="h-8 w-8 text-chart-delay" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="pt-6 flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Tiempo Muerto Total
                </p>
                <p className="text-3xl font-bold mt-2 text-blue-500">
                  {currentIdle} min
                </p>
              </div>
              <div className="p-4 rounded-full bg-blue-500/10">
                <Clock className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* --- LAYOUT PRINCIPAL --- */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          {/* --- CONTENIDO (izquierda) --- */}
          <div className="xl:col-span-8 space-y-6">
            {/* 1) GRÁFICA DE SECUENCIA */}
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
                            color: "#fbbf24",
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
                        fill="#fbbf24"
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

            {/* 2) CONSUMO DE MATERIALES */}
            {materialsData.length > 0 && (
              <Card className="bg-card border-border shadow-sm h-[500px] flex flex-col">
                <CardHeader className="pb-3 border-b border-border">
                  <div className="flex items-center gap-2">
                    <Scale className="h-5 w-5 text-green-600" />
                    <CardTitle className="text-lg">Consumo de Materiales</CardTitle>
                  </div>
                  <CardDescription>Real vs Esperado (Acumulado)</CardDescription>
                </CardHeader>
                <CardContent className="p-0 flex-1">
                  <div className="h-[400px] w-full p-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={materialsData}
                        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="colorReal" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#16a34a" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#94a3b8" stopOpacity={0} />
                          </linearGradient>
                        </defs>

                        <CartesianGrid strokeDasharray="3 3" opacity={0.2} />

                        <XAxis
                          dataKey="name"
                          tick={{ fontSize: 12 }}
                          interval={materialTickInterval}
                          minTickGap={12}
                          angle={-20}
                          textAnchor="end"
                          height={90}
                          tickFormatter={(v) => truncateLabel(v, 18)}
                        />
                        <YAxis tick={{ fontSize: 12 }} />

                        {/* ✅ TOOLTIP bonito + valores con unidad */}
                        <Tooltip
                          contentStyle={themedTooltipContentStyle}
                          labelStyle={themedTooltipLabelStyle}
                          itemStyle={themedTooltipItemStyle}
                          cursor={{ fill: "transparent" }}
                          labelFormatter={(label) => String(label)}
                          formatter={(value: any, name: any) => {
                            return [`${formatNumber(value, 2)} kg/hl`, name];
                          }}
                        />

                        <Legend wrapperStyle={{ paddingTop: "10px" }} />
                        <Area
                          type="monotone"
                          dataKey="totalExpected"
                          stroke="#94a3b8"
                          fillOpacity={1}
                          fill="url(#colorExp)"
                          name="Meta"
                        />
                        <Area
                          type="monotone"
                          dataKey="totalReal"
                          stroke="#16a34a"
                          fillOpacity={0.6}
                          fill="url(#colorReal)"
                          name="Real"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* --- PANEL INSIGHTS (derecha) --- */}
          <div className="xl:col-span-4">
            <div className="flex flex-col gap-4 xl:sticky xl:top-6 xl:self-start">
              {/* TARJETA GEMINI */}
              {anomaliesReport.length > 0 && (
                <Card className="relative overflow-hidden border border-indigo-200/70 dark:border-indigo-800/50 bg-background shadow-sm">
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-fuchsia-500/10 dark:from-indigo-500/10 dark:via-purple-500/5 dark:to-fuchsia-500/10" />
                  <CardHeader className="relative pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-indigo-600/10 dark:bg-indigo-500/10 flex items-center justify-center border border-indigo-200/60 dark:border-indigo-800/40">
                          <Sparkles className="h-5 w-5 text-indigo-600 dark:text-indigo-300" />
                        </div>
                        <div className="space-y-0.5">
                          <CardTitle className="text-base font-semibold leading-none">
                            Gemini Insights
                          </CardTitle>
                          <CardDescription className="text-xs">
                            Diagnóstico de ineficiencias.
                          </CardDescription>
                        </div>
                      </div>
                      <Badge className="bg-indigo-600/10 text-indigo-700 border border-indigo-200/60 dark:bg-indigo-500/10 dark:text-indigo-200 dark:border-indigo-800/40">
                        AI
                      </Badge>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge variant="secondary" className="gap-1.5">
                        <AlertCircle className="h-3.5 w-3.5 text-orange-500" />
                        {anomaliesReport.length} problemas
                      </Badge>
                      <Badge variant="secondary" className="gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-blue-500" />
                        {Math.round(totalImpactMinutes * 10) / 10} min impactados
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="relative pt-0">
                    {!aiAnalysis ? (
                      <div className="space-y-4">
                        <div className="rounded-lg border border-border/60 bg-background/60 p-3">
                          <p className="text-sm text-muted-foreground">
                            Analizaré tanto{" "}
                            <span className="font-medium text-foreground">
                              paradas (gaps)
                            </span>{" "}
                            como{" "}
                            <span className="font-medium text-foreground">
                              pasos lentos
                            </span>
                            .
                          </p>
                        </div>
                        <Button
                          onClick={handleConsultAI}
                          disabled={isAnalyzing}
                          className="w-full text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-fuchsia-600 hover:from-indigo-700 hover:via-purple-700 hover:to-fuchsia-700 shadow-sm"
                        >
                          {isAnalyzing ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Analizando...
                            </>
                          ) : (
                            <>
                              <Sparkles className="mr-2 h-4 w-4" />
                              Consultar a Gemini{" "}
                              <ArrowRight className="ml-2 h-4 w-4" />
                            </>
                          )}
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <Badge className="bg-green-500/10 text-green-700 border border-green-500/20">
                            Respuesta generada
                          </Badge>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8"
                            onClick={() => setAiAnalysis(null)}
                          >
                            Limpiar
                          </Button>
                        </div>
                        <ScrollArea className="h-[360px] w-full rounded-lg border border-border/70 bg-background/70 p-4">
                          <div className="prose prose-sm dark:prose-invert max-w-none">
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              components={{
                                p: ({ children }) => (
                                  <p className="mb-2 leading-relaxed text-foreground/90">
                                    {children}
                                  </p>
                                ),
                                ul: ({ children }) => (
                                  <ul className="list-disc pl-4 mb-2 space-y-1">
                                    {children}
                                  </ul>
                                ),
                                ol: ({ children }) => (
                                  <ol className="list-decimal pl-4 mb-2 space-y-1">
                                    {children}
                                  </ol>
                                ),
                                li: ({ children }) => (
                                  <li className="text-foreground/80">{children}</li>
                                ),
                                strong: ({ children }) => (
                                  <span className="font-bold text-indigo-500 dark:text-indigo-400">
                                    {children}
                                  </span>
                                ),
                              }}
                            >
                              {aiAnalysis}
                            </ReactMarkdown>
                          </div>
                        </ScrollArea>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* LISTA DETALLADA DE ANOMALÍAS */}
              <Card className="bg-card border-border flex flex-col h-[520px] xl:h-[calc(100vh-260px)]">
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

                <CardContent className="flex-1 p-0">
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


{/* ===============================
    PANEL: Límites Cp/Cpk (usuario) + resultados de ΔT
   =============================== */}
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
            Define límites LSL/USL por parámetro para calcular capacidad del proceso en{" "}
            <strong>{selectedMachine}</strong>.
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
                          n:{" "}
                          <strong className="text-foreground">
                            {row.n}
                          </strong>
                        </div>
                        <div className="rounded border border-border/60 bg-background/60 px-2 py-1">
                          μ:{" "}
                          <strong className="text-foreground">
                            {formatNum(row.mean, 3)}
                          </strong>
                        </div>
                        <div className="rounded border border-border/60 bg-background/60 px-2 py-1">
                          σ:{" "}
                          <strong className="text-foreground">
                            {formatNum(row.sigma, 3)}
                          </strong>
                        </div>
                        <div className="rounded border border-border/60 bg-background/60 px-2 py-1">
                          Cp:{" "}
                          <strong className="text-foreground">
                            {formatNum(row.cp, 2)}
                          </strong>
                        </div>
                        <div className="rounded border border-border/60 bg-background/60 px-2 py-1">
                          Cpk:{" "}
                          <strong className="text-foreground">
                            {formatNum(row.cpk, 2)}
                          </strong>
                        </div>
                        <div className="rounded border border-border/60 bg-background/60 px-2 py-1">
                          Spec:{" "}
                          <strong className="text-foreground">
                            {row.lsl === null || row.usl === null
                              ? "—"
                              : `${row.lsl} / ${row.usl}`}
                          </strong>
                        </div>
                      </div>
                    </div>

                    {/* Inputs LSL/USL */}
                    <div className="grid grid-cols-2 gap-2 lg:w-[260px]">
                      <div>
                        <label className="text-xs text-muted-foreground">
                          LSL
                        </label>
                        <Input
                          value={specLimits[row.name]?.lsl ?? ""}
                          onChange={(e) =>
                            updateSpec(row.name, "lsl", e.target.value)
                          }
                          placeholder="Ej: -0.5"
                          inputMode="decimal"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">
                          USL
                        </label>
                        <Input
                          value={specLimits[row.name]?.usl ?? ""}
                          onChange={(e) =>
                            updateSpec(row.name, "usl", e.target.value)
                          }
                          placeholder="Ej: 0.5"
                          inputMode="decimal"
                        />
                      </div>

                      <div className="col-span-2 flex justify-end">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8"
                          onClick={() => clearSpec(row.name)}
                        >
                          Limpiar límites
                        </Button>
                      </div>
                    </div>
                  </div>

                  {!row.hasSpec && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      💡 Agrega LSL y USL válidos (USL &gt; LSL) para calcular Cp/Cpk.
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      )}
    </CardContent>
  </Card>
)}

        {/* ✅ FULL-WIDTH: PARÁMETROS DE PROCESO */}
        {parametersData.length > 0 && (
          <Card className="bg-card border-border shadow-sm w-full flex flex-col">
            <CardHeader className="pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Gauge className="h-5 w-5 text-blue-600" />
                <Thermometer className="h-5 w-5 text-sky-600 opacity-70" />
                <CardTitle className="text-lg">Parámetros de Proceso</CardTitle>
              </div>
              <CardDescription>Variación de Temperatura/Presión por Paso</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-[420px] w-full p-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={parametersData}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorParam" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>

                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />

                    <XAxis
                      dataKey="stepName"
                      tick={{ fontSize: 12 }}
                      interval={paramTickInterval}
                      minTickGap={12}
                      angle={-20}
                      textAnchor="end"
                      height={90}
                      tickFormatter={(v) => truncateLabel(v, 22)}
                    />
                    <YAxis tick={{ fontSize: 12 }} />

                    {/* ✅ TOOLTIP bonito + unidad automática */}
                    <Tooltip
                      contentStyle={themedTooltipContentStyle}
                      labelStyle={themedTooltipLabelStyle}
                      itemStyle={themedTooltipItemStyle}
                      cursor={{ fill: "transparent" }}
                      labelFormatter={(label) => String(label)}
                      formatter={(value: any, name: any, props: any) => {
                        const unit = getParamUnit(props?.payload);
                        return [`${formatNumber(value, 2)}${unit}`, name];
                      }}
                    />

                    <Legend wrapperStyle={{ paddingTop: "10px" }} />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#3b82f6"
                      fillOpacity={1}
                      fill="url(#colorParam)"
                      name="Valor Registrado"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ✅ FULL-WIDTH: TENDENCIA HISTÓRICA */}
        {machineHistoryData.length > 0 && (
          <Card className="bg-card border-border w-full p-6 opacity-90 hover:opacity-100 transition-opacity">
            <CardTitle className="mb-6 text-lg font-semibold flex items-center justify-between">
              <span>Tendencia Histórica</span>
              <span className="text-sm font-normal text-muted-foreground">
                Comparativa con otros lotes en {selectedMachine}
              </span>
            </CardTitle>

            <div className="h-[340px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={machineHistoryData}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorRealTime" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                    </linearGradient>
                  </defs>

                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} vertical={false} />
                  <XAxis
                    dataKey="batchId"
                    tick={{
                      fontSize: 12,
                      fill: "hsl(var(--muted-foreground))",
                    }}
                    axisLine={{ stroke: "hsl(var(--border))" }}
                  />
                  <YAxis
                    label={{
                      value: "Minutos",
                      angle: -90,
                      position: "insideLeft",
                      fill: "hsl(var(--muted-foreground))",
                    }}
                    tick={{ fill: "hsl(var(--muted-foreground))" }}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--popover))",
                      borderColor: "hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    labelStyle={{ color: "hsl(var(--popover-foreground))" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="realTime"
                    stroke="#8884d8"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorRealTime)"
                    name="Tiempo Real"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
