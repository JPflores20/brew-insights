import React, { useMemo, useState } from "react";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Legend, ReferenceLine 
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { BatchRecord } from "@/types";
import { Activity, Filter, Plus, Trash2 } from "lucide-react";
import { FILTER_ALL } from "@/lib/constants";

interface StepSeriesConfig {
  id: string;
  recipe: string;
  machine: string;
  step: string;
  param: string;
  color: string;
}

interface StepTrendChartProps {
  data: BatchRecord[];
}

const COLORS = [
  "#3b82f6", // blue-500
  "#ef4444", // red-500
  "#10b981", // emerald-500
  "#f59e0b", // amber-500
  "#8b5cf6", // violet-500
  "#ec4899", // pink-500
  "#06b6d4", // cyan-500
];

export function StepTrendChart({ data }: StepTrendChartProps) {
  const [series, setSeries] = useState<StepSeriesConfig[]>([
    {
      id: "series-1",
      recipe: "",
      machine: "",
      step: "",
      param: "Temperatura",
      color: COLORS[0],
    }
  ]);

  const addSeries = () => {
    if (series.length >= COLORS.length) return;
    const newId = `series-${Date.now()}`;
    const newColor = COLORS[series.length % COLORS.length];
    setSeries([...series, {
      id: newId,
      recipe: FILTER_ALL,
      machine: FILTER_ALL,
      step: "",
      param: "Temperatura",
      color: newColor,
    }]);
  };

  const removeSeries = (id: string) => {
    if (series.length <= 1) return;
    setSeries(series.filter(s => s.id !== id));
  };

  const updateSeries = (id: string, updates: Partial<StepSeriesConfig>) => {
    setSeries(series.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  // Unique recipes for selects (global)
  const uniqueRecipes = useMemo(() => {
    return Array.from(new Set(data.map(d => d.productName).filter(Boolean))).sort();
  }, [data]);

  // Helper to get available machines for a series
  const getMachinesForSeries = (s: StepSeriesConfig) => {
    let filtered = data;
    if (s.recipe !== FILTER_ALL) {
      filtered = filtered.filter(d => d.productName === s.recipe);
    }
    return Array.from(new Set(filtered.map(d => d.TEILANL_GRUPO).filter(Boolean))).sort();
  };

  // Helper to get available steps for a series
  const getStepsForSeries = (s: StepSeriesConfig) => {
    let filtered = data;
    if (s.recipe !== FILTER_ALL) {
      filtered = filtered.filter(d => d.productName === s.recipe);
    }
    if (s.machine !== FILTER_ALL) {
      filtered = filtered.filter(d => d.TEILANL_GRUPO === s.machine);
    }
    const steps = new Set<string>();
    filtered.forEach(batch => batch.steps.forEach(step => steps.add(step.stepName)));
    return Array.from(steps).sort();
  };

  // Helper to get available params for a series
  const getParamsForSeries = (s: StepSeriesConfig) => {
    let filtered = data;
    if (s.recipe !== FILTER_ALL) {
      filtered = filtered.filter(d => d.productName === s.recipe);
    }
    if (s.machine !== FILTER_ALL) {
      filtered = filtered.filter(d => d.TEILANL_GRUPO === s.machine);
    }
    const params = new Set<string>();
    filtered.forEach(batch => {
      batch.parameters.forEach(p => {
        if (s.step === "" || p.stepName === s.step) params.add(p.name);
      });
    });
    return Array.from(params).sort();
  };

  // Prepare chart data (merged)
  const chartData = useMemo(() => {
    const validSeries = series.filter(s => s.step !== "");
    if (validSeries.length === 0) return [];

    // Collect all unique Batch IDs from the relevant data
    const batchMap = new Map<string, any>();

    validSeries.forEach((s) => {
      let filtered = data;
      if (s.recipe !== FILTER_ALL) filtered = filtered.filter(d => d.productName === s.recipe);
      if (s.machine !== FILTER_ALL) filtered = filtered.filter(d => d.TEILANL_GRUPO === s.machine);

      filtered.forEach(batch => {
        const param = batch.parameters.find(p => p.stepName === s.step && p.name === s.param);
        if (param) {
          if (!batchMap.has(batch.CHARG_NR)) {
            batchMap.set(batch.CHARG_NR, {
              batchId: batch.CHARG_NR,
              timestamp: batch.timestamp,
            });
          }
          const entry = batchMap.get(batch.CHARG_NR);
          entry[s.id] = param.value;
        }
      });
    });

    return Array.from(batchMap.values())
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [data, series]);

  return (
    <Card className="bg-card/50 backdrop-blur-md border-border shadow-xl min-h-[500px]">
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-500" />
              Tendencia de Parámetros por Paso (Multi-Serie)
            </CardTitle>
            <CardDescription>
              Compara la evolución de parámetros en pasos específicos a través de los cocimientos.
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={addSeries} disabled={series.length >= COLORS.length}>
            <Plus className="mr-2 h-4 w-4" /> Añadir Serie
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Filter Rows */}
        <div className="space-y-3">
          {series.map((s, idx) => (
            <div key={s.id} className="flex flex-wrap items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/50 transition-all hover:bg-muted/40">
              <div 
                className="w-4 h-4 rounded-full shrink-0 border border-border shadow-sm" 
                style={{ backgroundColor: s.color }}
              />
              
              <Select value={s.recipe} onValueChange={(v) => updateSeries(s.id, { recipe: v, machine: FILTER_ALL, step: "" })}>
                <SelectTrigger className="w-[140px] h-8 text-xs">
                  <SelectValue placeholder="Receta" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={FILTER_ALL}>Todas las Recetas</SelectItem>
                  {uniqueRecipes.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>

              <Select value={s.machine} onValueChange={(v) => updateSeries(s.id, { machine: v, step: "" })}>
                <SelectTrigger className="w-[140px] h-8 text-xs">
                  <SelectValue placeholder="Equipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={FILTER_ALL}>Todos los Equipos</SelectItem>
                  {getMachinesForSeries(s).map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>

              <Select value={s.step} onValueChange={(v) => updateSeries(s.id, { step: v })}>
                <SelectTrigger className={`w-[160px] h-8 text-xs font-semibold ${s.step === "" ? 'border-amber-500/50' : 'border-blue-500/30'}`}>
                  <SelectValue placeholder="Seleccionar Paso" />
                </SelectTrigger>
                <SelectContent>
                  {getStepsForSeries(s).map(step => <SelectItem key={step} value={step}>{step}</SelectItem>)}
                </SelectContent>
              </Select>

              <Select value={s.param} onValueChange={(v) => updateSeries(s.id, { param: v })}>
                <SelectTrigger className="w-[140px] h-8 text-xs">
                  <SelectValue placeholder="Parámetro" />
                </SelectTrigger>
                <SelectContent>
                  {getParamsForSeries(s).map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>

              {series.length > 1 && (
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => removeSeries(s.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>

        {/* Chart */}
        {series.every(s => s.step === "") ? (
          <div className="h-[350px] flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed border-border rounded-xl bg-muted/20">
            <Filter className="h-12 w-12 mb-4 opacity-20" />
            <p className="text-lg font-medium">Configura las series para visualizar la tendencia</p>
            <p className="text-sm opacity-60">Selecciona un paso en al menos una de las series.</p>
          </div>
        ) : chartData.length === 0 ? (
          <div className="h-[350px] flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed border-border rounded-xl bg-muted/20">
            <Activity className="h-12 w-12 mb-4 opacity-20" />
            <p className="text-lg font-medium">No hay datos coincidentes</p>
            <p className="text-sm opacity-60">Las combinaciones seleccionadas no generaron datos.</p>
          </div>
        ) : (
          <div className="h-[400px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.3} />
                <XAxis 
                  dataKey="batchId" 
                  stroke="#94a3b8" 
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  angle={-45}
                  textAnchor="end"
                  interval={chartData.length > 20 ? Math.floor(chartData.length / 20) : 0}
                />
                <YAxis 
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "rgba(15, 23, 42, 0.9)", 
                    borderRadius: "12px", 
                    border: "1px solid rgba(59, 130, 246, 0.2)",
                    backdropFilter: "blur(8px)",
                    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.5)"
                  }}
                  itemStyle={{ fontSize: '12px' }}
                  labelStyle={{ color: "#f8fafc", marginBottom: "4px", fontWeight: "bold" }}
                  labelFormatter={(label) => `Lote: ${label}`}
                />
                <Legend verticalAlign="top" align="right" height={36}/>
                
                {series.map(s => s.step !== "" && (
                  <Line 
                    key={s.id}
                    type="monotone" 
                    dataKey={s.id} 
                    name={`${s.machine === FILTER_ALL ? 'Global' : s.machine} - ${s.step}`}
                    stroke={s.color} 
                    strokeWidth={2}
                    dot={{ r: 3, fill: s.color, strokeWidth: 1, stroke: "#0f172a" }}
                    activeDot={{ r: 5, stroke: s.color, strokeWidth: 2, fill: "#fff" }}
                    connectNulls
                    animationDuration={1000}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
