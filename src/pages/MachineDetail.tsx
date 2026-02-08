import { useEffect, useMemo, useState } from "react";
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
} from "lucide-react";
import { useData } from "@/context/DataContext";
import { getUniqueBatchIds, getMachineData } from "@/data/mockData";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { analyzeProcessGaps } from "@/utils/gemini";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function MachineDetail() {
  const { data } = useData();

  // --- ESTADOS PARA GEMINI ---
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  // ---------------------------

  const allBatches = useMemo(() => getUniqueBatchIds(data), [data]);

  // Mapa auxiliar para obtener nombre de producto rápido
  const batchProductMap = useMemo(() => {
    const map = new Map<string, string>();
    data.forEach(d => {
        if(d.productName) map.set(d.CHARG_NR, d.productName);
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

  // Limpiar análisis al cambiar de lote/máquina
  useEffect(() => {
    setAiAnalysis(null);
  }, [selectedBatchId, selectedMachine]);

  // --- LÓGICA DE DETECCION GLOBAL DE PROBLEMAS ---
  const problematicBatches = useMemo(() => {
    const issues: any[] = [];
    data.forEach((record) => {
      const waitSteps = record.steps
        ? record.steps.filter((s) => s.stepName.includes("Espera"))
        : [];
      if (waitSteps.length > 0) {
        const totalWaitTime = waitSteps.reduce(
          (acc, step) => acc + step.durationMin,
          0
        );
        if (totalWaitTime > 1) {
          issues.push({
            batch: record.CHARG_NR,
            product: record.productName, // Añadido para mostrar en sugerencias si quisieras
            machine: record.TEILANL_GRUPO,
            totalWait: Math.round(totalWaitTime * 100) / 100,
            waitCount: waitSteps.length,
            timestamp: record.timestamp,
          });
        }
      }
    });
    return issues.sort((a, b) => b.totalWait - a.totalWait);
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

  const gapsReport = useMemo(() => {
    if (!stepsData.length) return [];
    return stepsData
      .map((step, index) => {
        if (!step.stepName.includes("Espera")) return null;
        const prevStep = index > 0 ? stepsData[index - 1].stepName : "Inicio";
        const nextStep =
          index < stepsData.length - 1 ? stepsData[index + 1].stepName : "Fin";
        return {
          id: index,
          name: step.stepName,
          duration: step.durationMin,
          startTime: new Date(step.startTime).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          prevStep,
          nextStep,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);
  }, [stepsData]);

  // métricas para que la tarjeta de Gemini sea más informativa
  const totalGapMinutes = useMemo(() => {
    return gapsReport.reduce((acc, g) => {
      const d =
        typeof g.duration === "number" ? g.duration : Number(g.duration) || 0;
      return acc + d;
    }, 0);
  }, [gapsReport]);

  const topGaps = useMemo(() => {
    return [...gapsReport]
      .sort((a, b) => {
        const da =
          typeof a.duration === "number" ? a.duration : Number(a.duration) || 0;
        const db =
          typeof b.duration === "number" ? b.duration : Number(b.duration) || 0;
        return db - da;
      })
      .slice(0, 3);
  }, [gapsReport]);

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

  // --- FUNCIÓN PARA LLAMAR A GEMINI ---
  const handleConsultAI = async () => {
    if (gapsReport.length === 0) return;

    setIsAnalyzing(true);
    setAiAnalysis(null);

    const result = await analyzeProcessGaps(
      selectedBatchId,
      selectedMachine,
      gapsReport
    );

    setAiAnalysis(result);
    setIsAnalyzing(false);
  };

  if (data.length === 0) {
    return (
      <DashboardLayout>
        <div className="flex h-[50vh] items-center justify-center">
          <div className="text-center text-muted-foreground">
            <Clock className="mx-auto h-12 w-12 opacity-50 mb-4" />
            <h2 className="text-xl font-semibold">Sin Datos</h2>
            <p>Por favor carga un archivo Excel en la pestaña "Resumen" primero.</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-in fade-in duration-500">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Detalle de Lote y Pasos</h1>
          <p className="text-muted-foreground">
            Selecciona un lote o revisa las sugerencias automáticas
          </p>
        </div>

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
                tiempos muertos significativos.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[150px] w-full pr-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {problematicBatches.map((issue, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-lg border border-border bg-background hover:bg-accent/50 transition-colors"
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="secondary" className="font-mono">
                            {issue.batch}
                          </Badge>
                          <span
                            className="text-xs text-muted-foreground truncate max-w-[100px]"
                            title={issue.machine}
                          >
                            {issue.machine}
                          </span>
                        </div>
                        <div className="text-[10px] text-muted-foreground mb-1 font-medium">
                            {/* Mostramos el producto en la sugerencia también */}
                            {issue.product}
                        </div>
                        <p className="text-xs text-red-500 font-medium flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Perdido: {issue.totalWait} min ({issue.waitCount}{" "}
                          esperas)
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs ml-2"
                        onClick={() => loadSuggestion(issue.batch, issue.machine)}
                      >
                        Analizar
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <Select
                value={selectedBatchId}
                onValueChange={setSelectedBatchId}
              >
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
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* GRÁFICA (Ocupa 2 espacios) */}
          <div className="lg:col-span-2 space-y-6">
            {selectedRecord && stepsData.length > 0 ? (
              <Card className="bg-card border-border p-6 border-l-4 border-l-primary h-full">
                <div className="flex items-center gap-2 mb-6">
                  <ListFilter className="h-5 w-5 text-primary" />
                  <div>
                    <CardTitle className="text-lg font-semibold">
                      Secuencia de Pasos ({selectedBatchId} - {selectedMachine})
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                        {selectedRecord.productName} {/* Muestra el producto aquí también */}
                    </p>
                  </div>
                </div>

                <div className="h-[500px] w-full">
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
                      <Legend wrapperStyle={{ paddingTop: "10px" }} />
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
              <Card className="bg-card border-border p-6 border-l-4 border-l-yellow-500">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  <p className="text-sm font-medium">
                    Selecciona un lote para ver los detalles.
                  </p>
                </div>
              </Card>
            )}
          </div>

          {/* COLUMNA DERECHA: GEMINI AI + REPORTE */}
          <div className="lg:col-span-1 flex flex-col gap-4">
            {/* ✅ TARJETA GEMINI MEJORADA CON MARKDOWN */}
            {gapsReport.length > 0 && (
              <Card className="relative overflow-hidden border border-indigo-200/70 dark:border-indigo-800/50 bg-background shadow-sm">
                {/* Fondo con gradiente + glow */}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-fuchsia-500/10 dark:from-indigo-500/10 dark:via-purple-500/5 dark:to-fuchsia-500/10" />
                <div className="pointer-events-none absolute -top-24 -right-24 h-56 w-56 rounded-full bg-indigo-500/15 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-28 -left-28 h-64 w-64 rounded-full bg-fuchsia-500/15 blur-3xl" />

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
                          Diagnóstico y recomendaciones para reducir esperas.
                        </CardDescription>
                      </div>
                    </div>

                    <Badge className="bg-indigo-600/10 text-indigo-700 border border-indigo-200/60 dark:bg-indigo-500/10 dark:text-indigo-200 dark:border-indigo-800/40">
                      AI
                    </Badge>
                  </div>

                  {/* Chips de contexto */}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge variant="secondary" className="gap-1.5">
                      <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
                      {gapsReport.length} esperas
                    </Badge>

                    <Badge variant="secondary" className="gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-blue-500" />
                      {Math.round(totalGapMinutes * 10) / 10} min
                    </Badge>

                    <Badge
                      variant="outline"
                      className="font-mono truncate max-w-[170px]"
                      title={selectedMachine}
                    >
                      {selectedMachine}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="relative pt-0">
                  {!aiAnalysis ? (
                    <div className="space-y-4">
                      <div className="rounded-lg border border-border/60 bg-background/60 p-3">
                        <p className="text-sm text-muted-foreground">
                          Puedo identificar{" "}
                          <span className="font-medium text-foreground">
                            causas probables
                          </span>{" "}
                          de las esperas y proponer{" "}
                          <span className="font-medium text-foreground">
                            acciones concretas
                          </span>{" "}
                          (operación, setup, secuencia, coordinación).
                        </p>

                        {/* Preview top esperas */}
                        <div className="mt-3 space-y-2">
                          <p className="text-xs text-muted-foreground">
                            Top esperas:
                          </p>
                          <div className="space-y-2">
                            {topGaps.length ? (
                              topGaps.map((gap) => (
                                <div
                                  key={gap.id}
                                  className="flex items-center justify-between gap-3 rounded-md border border-border/60 bg-background px-3 py-2"
                                  title={`${gap.prevStep} -> ${gap.nextStep}`}
                                >
                                  <div className="min-w-0">
                                    <p className="text-xs font-medium truncate">
                                      {gap.name}
                                    </p>
                                    <p className="text-[11px] text-muted-foreground truncate">
                                      {gap.prevStep} → {gap.nextStep}
                                    </p>
                                  </div>
                                  <span className="shrink-0 text-xs font-mono font-semibold text-red-500">
                                    {gap.duration} min
                                  </span>
                                </div>
                              ))
                            ) : (
                              <p className="text-xs text-muted-foreground">
                                Sin detalle para previsualizar.
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      <Button
                        onClick={handleConsultAI}
                        disabled={isAnalyzing}
                        className="w-full text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-fuchsia-600 hover:from-indigo-700 hover:via-purple-700 hover:to-fuchsia-700 shadow-sm"
                      >
                        {isAnalyzing ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Analizando con Gemini…
                          </>
                        ) : (
                          <>
                            <Sparkles className="mr-2 h-4 w-4" />
                            Consultar a Gemini
                          </>
                        )}
                      </Button>

                      <p className="text-[11px] text-muted-foreground text-center">
                        Se envía el lote, equipo y el reporte de esperas (sin
                        datos personales).
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* Barra de acciones */}
                      <div className="flex items-center justify-between gap-2">
                        <Badge className="bg-green-500/10 text-green-700 border border-green-500/20 dark:bg-green-500/10 dark:text-green-200 dark:border-green-500/20">
                          Respuesta generada
                        </Badge>

                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8"
                            onClick={handleConsultAI}
                            disabled={isAnalyzing}
                          >
                            {isAnalyzing ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Re-analizando…
                              </>
                            ) : (
                              "Re-analizar"
                            )}
                          </Button>

                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8"
                            onClick={() => setAiAnalysis(null)}
                          >
                            Limpiar
                          </Button>
                        </div>
                      </div>

                      {/* Contenedor de respuesta renderizado con MARKDOWN */}
                      <ScrollArea className="h-[290px] w-full rounded-lg border border-border/70 bg-background/70 p-4">
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
                                <li className="text-foreground/80">
                                  {children}
                                </li>
                              ),
                              strong: ({ children }) => (
                                <span className="font-bold text-indigo-500 dark:text-indigo-400">
                                  {children}
                                </span>
                              ),
                              h1: ({ children }) => (
                                <h1 className="text-lg font-bold mb-2 mt-4 text-foreground">
                                  {children}
                                </h1>
                              ),
                              h2: ({ children }) => (
                                <h2 className="text-base font-bold mb-2 mt-3 text-foreground">
                                  {children}
                                </h2>
                              ),
                              h3: ({ children }) => (
                                <h3 className="text-sm font-bold mb-1 mt-2 text-foreground">
                                  {children}
                                </h3>
                              ),
                              blockquote: ({ children }) => (
                                <blockquote className="border-l-2 border-indigo-500 pl-4 italic text-muted-foreground my-2">
                                  {children}
                                </blockquote>
                              ),
                            }}
                          >
                            {aiAnalysis}
                          </ReactMarkdown>
                        </div>
                      </ScrollArea>

                      <div className="rounded-lg border border-border/60 bg-background/60 p-3">
                        <p className="text-xs text-muted-foreground">
                          Tip: si algo no cuadra, revisa primero{" "}
                          <span className="font-medium text-foreground">
                            setup/cambio de formato
                          </span>
                          ,{" "}
                          <span className="font-medium text-foreground">
                            interbloqueos
                          </span>{" "}
                          y{" "}
                          <span className="font-medium text-foreground">
                            coordinación con la operación anterior/siguiente
                          </span>
                          .
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* REPORTE DE ANOMALÍAS ORIGINAL */}
            <Card className="bg-card border-border flex-1 flex flex-col">
              <CardHeader className="pb-3 border-b border-border">
                <div className="flex items-center gap-2 text-red-500">
                  <AlertCircle className="h-5 w-5" />
                  <CardTitle className="text-lg">Detalle de Esperas</CardTitle>
                </div>
                <p className="text-xs text-muted-foreground">
                  {gapsReport.length > 0
                    ? `Lista de esperas encontradas en el lote ${selectedBatchId}`
                    : "No hay esperas en este lote específico"}
                </p>
              </CardHeader>

              <CardContent className="flex-1 p-0">
                {gapsReport.length > 0 ? (
                  <ScrollArea className="h-[300px] w-full p-4">
                    <div className="space-y-4">
                      {gapsReport.map((gap) => (
                        <div
                          key={gap.id}
                          className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm animate-in fade-in slide-in-from-right-4 duration-500"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <Badge
                              variant="outline"
                              className="text-red-500 border-red-500/30 bg-red-500/5 font-bold"
                            >
                              {gap.name}
                            </Badge>
                            <span className="font-mono font-bold text-red-500">
                              {gap.duration} min
                            </span>
                          </div>

                          <div className="text-xs text-muted-foreground space-y-1">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>Inicio: {gap.startTime}</span>
                            </div>

                            <div className="mt-2 pt-2 border-t border-red-500/10 flex flex-col gap-1">
                              <div className="flex items-center justify-between">
                                <span className="opacity-70">Después de:</span>
                                <span
                                  className="font-medium text-foreground truncate max-w-[120px]"
                                  title={gap.prevStep}
                                >
                                  {gap.prevStep}
                                </span>
                              </div>

                              <div className="flex justify-center my-1 opacity-20">
                                <ArrowRight className="h-3 w-3 rotate-90" />
                              </div>

                              <div className="flex items-center justify-between">
                                <span className="opacity-70">Antes de:</span>
                                <span
                                  className="font-medium text-foreground truncate max-w-[120px]"
                                  title={gap.nextStep}
                                >
                                  {gap.nextStep}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground p-6 text-center">
                    <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center mb-3">
                      <CheckCircle2 className="h-6 w-6 text-green-500" />
                    </div>
                    <p className="text-sm">Todo correcto</p>
                    <p className="text-xs mt-1">
                      Selecciona un lote con problemas de la lista superior para
                      ver detalles aquí.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* HISTÓRICO */}
        {machineHistoryData.length > 0 && (
          <Card className="bg-card border-border h-[400px] p-6 opacity-90 hover:opacity-100 transition-opacity">
            <CardTitle className="mb-6 text-lg font-semibold flex items-center justify-between">
              <span>Tendencia Histórica</span>
              <span className="text-sm font-normal text-muted-foreground">
                Comparativa con otros lotes en {selectedMachine}
              </span>
            </CardTitle>

            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={machineHistoryData}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id="colorRealTime"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor="#8884d8"
                        stopOpacity={0.8}
                      />
                      <stop
                        offset="95%"
                        stopColor="#8884d8"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>

                  <CartesianGrid
                    strokeDasharray="3 3"
                    opacity={0.2}
                    vertical={false}
                  />
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