import { useMemo, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useData } from "@/context/DataContext";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  ReferenceLine 
} from "recharts";
import { format, parseISO, isValid } from "date-fns";
import { AlertCircle, Clock, TrendingUp, Activity } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function CycleAnalysis() {
  const { data } = useData();
  
  // --- ESTADOS Y CONFIGURACIÓN ---
  const [selectedProduct, setSelectedProduct] = useLocalStorage<string>("cycle-product", "");
  const [theoreticalDuration, setTheoreticalDuration] = useLocalStorage<number>("cycle-theoretical", 120);
  const [selectedStep, setSelectedStep] = useState<string>("FULL_CYCLE");

  // --- PREPARACIÓN DE DATOS ---

  const uniqueProducts = useMemo(() => {
    const products = new Set(data.map(d => d.productName).filter(Boolean));
    return Array.from(products).sort();
  }, [data]);

  const uniqueSteps = useMemo(() => {
    if (data.length === 0) return [];
    const batchWithSteps = data.find(d => d.steps && d.steps.length > 0);
    return batchWithSteps 
      ? batchWithSteps.steps
          .map(s => s.stepName)
          .filter(name => !name.includes("⏳ Espera")) 
      : [];
  }, [data]);

  useMemo(() => {
    if (!selectedProduct && uniqueProducts.length > 0) {
      setSelectedProduct(uniqueProducts[0]);
    }
  }, [uniqueProducts, selectedProduct, setSelectedProduct]);

  // Filtrar datos por producto
  const filteredData = useMemo(() => {
    if (!selectedProduct) return [];
    return data.filter(d => d.productName === selectedProduct);
  }, [data, selectedProduct]);

  // --- ALGORITMO DE FUSIÓN DE INTERVALOS ---
  // Calcula la duración real unificando solapamientos y duplicados
  const calculateMergedDuration = (intervals: { start: number; end: number }[]): number => {
    if (intervals.length === 0) return 0;
    
    // 1. Ordenar por inicio
    intervals.sort((a, b) => a.start - b.start);
    
    const merged = [];
    let current = intervals[0];
    
    for (let i = 1; i < intervals.length; i++) {
      const next = intervals[i];
      
      if (next.start < current.end) {
        // Solapamiento: extendemos el final si es necesario (Fusión)
        current.end = Math.max(current.end, next.end);
      } else {
        // No hay solapamiento: guardamos el actual y avanzamos
        merged.push(current);
        current = next;
      }
    }
    merged.push(current);
    
    // Sumar duraciones de los intervalos fusionados
    const totalMs = merged.reduce((acc, interval) => acc + (interval.end - interval.start), 0);
    return totalMs / 60000; // Convertir a minutos
  };

  // --- LÓGICA DE DATOS PARA GRÁFICAS ---
  const chartData = useMemo(() => {
    if (selectedStep === "FULL_CYCLE") {
      // Agrupar por ID de Lote para consolidar partes
      const groupedBatches = new Map<string, {
        id: string;
        startTime: number;
        endTime: number;
        intervals: { start: number; end: number }[];
      }>();

      filteredData.forEach(batch => {
        const id = batch.CHARG_NR;
        if (!id) return;

        const batchStart = new Date(batch.timestamp).getTime();
        let batchEnd = batchStart + (batch.real_total_min * 60000);
        
        // Recolectar intervalos de tiempo de cada paso ACTIVO
        const batchIntervals: { start: number; end: number }[] = [];
        
        if (batch.steps && batch.steps.length > 0) {
          batch.steps.forEach(step => {
            // Ignorar esperas
            if (step.stepName.includes("⏳ Espera")) return;
            
            // Validar fechas del paso
            if (step.startTime && step.endTime) {
              const s = parseISO(step.startTime).getTime();
              const e = parseISO(step.endTime).getTime();
              if (!isNaN(s) && !isNaN(e) && e > s) {
                batchIntervals.push({ start: s, end: e });
              }
            }
          });
          
          // Actualizar fin del lote basado en el último paso real
          const lastStep = batch.steps[batch.steps.length - 1];
          if (lastStep.endTime) {
             const le = parseISO(lastStep.endTime).getTime();
             if (!isNaN(le)) batchEnd = le;
          }
        } else {
          // Fallback si no hay pasos detallados: Usamos el tiempo total del lote menos idle
          const idleTimeMs = (batch.idle_wall_minus_sumsteps_min || 0) * 60000;
          batchIntervals.push({ start: batchStart, end: Math.max(batchStart, batchEnd - idleTimeMs) });
        }

        if (!groupedBatches.has(id)) {
          groupedBatches.set(id, {
            id,
            startTime: batchStart,
            endTime: batchEnd,
            intervals: batchIntervals
          });
        } else {
          const existing = groupedBatches.get(id)!;
          existing.startTime = Math.min(existing.startTime, batchStart);
          existing.endTime = Math.max(existing.endTime, batchEnd);
          // Acumulamos intervalos para luego fusionarlos
          existing.intervals.push(...batchIntervals);
        }
      });

      // Procesar cada lote agrupado
      return Array.from(groupedBatches.values())
        .map(b => {
          // AQUI ESTÁ LA MAGIA: Calculamos duración fusionando intervalos
          const uniqueDuration = calculateMergedDuration(b.intervals);
          const fullDateFormat = "dd/MM/yyyy HH:mm";

          return {
            id: b.id,
            startTime: b.startTime,
            endTime: b.endTime,
            duration: Math.round(uniqueDuration * 100) / 100, // Duración Real Sin Duplicados
            startLabel: format(b.startTime, fullDateFormat),
            endLabel: format(b.endTime, fullDateFormat),
            startOffset: 0,
            durationMs: b.endTime - b.startTime
          };
        })
        .sort((a, b) => a.startTime - b.startTime)
        .filter(d => d.duration > 0.1);

    } else {
      // Lógica para pasos individuales (sin cambios mayores, solo validación)
      return filteredData.map(batch => {
        const step = batch.steps?.find(s => s.stepName === selectedStep);
        if (step) {
          const startTime = step.startTime ? parseISO(step.startTime).getTime() : 0;
          const endTime = step.endTime ? parseISO(step.endTime).getTime() : 0;
          const fullDateFormat = "dd/MM/yyyy HH:mm";
          if (!startTime || !endTime) return null;

          return {
            id: batch.CHARG_NR,
            machine: batch.TEILANL_GRUPO,
            startTime,
            endTime,
            duration: step.durationMin,
            startLabel: format(startTime, fullDateFormat),
            endLabel: format(endTime, fullDateFormat),
            startOffset: 0, 
            durationMs: endTime - startTime
          };
        }
        return null;
      })
      .filter(Boolean)
      .sort((a: any, b: any) => a.startTime - b.startTime) as any[];
    }
  }, [filteredData, selectedStep]);

  // Estadísticas
  const stats = useMemo(() => {
    if (chartData.length === 0) return { avg: 0, count: 0, max: 0, min: 0 };
    const durations = chartData.map(d => d.duration);
    const total = durations.reduce((acc, curr) => acc + curr, 0);
    return {
      avg: Math.round(total / chartData.length),
      count: chartData.length,
      max: Math.max(...durations),
      min: Math.min(...durations)
    };
  }, [chartData]);

  // Ajuste para Gantt
  const minTime = chartData.length > 0 ? Math.min(...chartData.map(d => d.startTime)) : 0;
  const maxTime = chartData.length > 0 ? Math.max(...chartData.map(d => d.endTime)) : 0;
  
  const ganttData = chartData.map(d => ({
    ...d,
    startOffset: d.startTime - minTime
  }));

  if (data.length === 0) {
    return (
      <DashboardLayout>
        <div className="flex h-[50vh] items-center justify-center">
          <Alert className="max-w-md">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Sin datos</AlertTitle>
            <AlertDescription>Carga un archivo en Resumen primero.</AlertDescription>
          </Alert>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-10">
        
        {/* ENCABEZADO Y CONTROLES */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Análisis de Tiempos</h1>
            <p className="text-muted-foreground">Comparativa de duración real (consolidada) vs teórica.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 bg-card p-2 rounded-lg border shadow-sm">
            <div className="w-full sm:w-[200px]">
              <Label className="text-xs text-muted-foreground mb-1 block">Producto</Label>
              <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {uniqueProducts.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="w-full sm:w-[200px]">
              <Label className="text-xs text-muted-foreground mb-1 block">Fase / Paso</Label>
              <Select value={selectedStep} onValueChange={setSelectedStep}>
                <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="FULL_CYCLE">Ciclo Completo (Total)</SelectItem>
                  {uniqueSteps.map(step => <SelectItem key={step} value={step}>{step}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="w-full sm:w-[120px]">
              <Label className="text-xs text-muted-foreground mb-1 block">Meta Teórica (min)</Label>
              <Input 
                type="number" 
                className="h-8" 
                value={theoreticalDuration} 
                onChange={(e) => setTheoreticalDuration(Number(e.target.value))} 
              />
            </div>
          </div>
        </div>

        {/* TARJETAS KPI */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Lotes Únicos</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{stats.count}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Promedio Real</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${stats.avg > theoreticalDuration ? 'text-red-500' : 'text-green-500'}`}>
                {stats.avg} min
              </div>
              <p className="text-xs text-muted-foreground">Meta: {theoreticalDuration} min</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Desviación Máxima</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">+{Math.round((stats.max - theoreticalDuration) * 100) / 100} min</div>
              <p className="text-xs text-muted-foreground">Peor caso: {stats.max} min</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cumplimiento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round((chartData.filter(d => d.duration <= theoreticalDuration).length / stats.count) * 100) || 0}%
              </div>
              <p className="text-xs text-muted-foreground">Lotes dentro de meta</p>
            </CardContent>
          </Card>
        </div>

        {/* 1. GRÁFICO DE TENDENCIA (AREA CHART) */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Tendencia de Duración Total vs Meta</CardTitle>
            <CardDescription>
              Cada punto representa un Lote Único. La duración es la suma real de tiempos activos (sin duplicados).
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorDuration" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis 
                  dataKey="id" 
                  tick={{ fontSize: 10 }} 
                  interval="preserveStartEnd"
                  angle={-45}
                  textAnchor="end"
                  height={60}
                  label={{ value: 'Nº Lote (Ordenado por Inicio)', position: 'insideBottom', offset: -10, fontSize: 12 }}
                />
                <YAxis label={{ value: 'Minutos Activos', angle: -90, position: 'insideLeft' }} />
                
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-popover border border-border p-3 rounded-md shadow-md text-sm text-popover-foreground">
                          <p className="font-bold mb-2 text-primary">Lote: {data.id}</p>
                          <div className="grid grid-cols-[60px_1fr] gap-x-2 gap-y-1">
                             <span className="text-muted-foreground">Duración:</span>
                             <span className="font-bold">{data.duration} min (Real)</span>
                             <span className="text-muted-foreground">Inicio:</span>
                             <span>{data.startLabel}</span>
                             <span className="text-muted-foreground">Fin:</span>
                             <span>{data.endLabel}</span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                
                <ReferenceLine 
                    y={theoreticalDuration} 
                    label={{ value: 'Meta', position: 'insideTopRight', fill: 'red', fontSize: 12 }} 
                    stroke="red" 
                    strokeDasharray="3 3" 
                />
                
                <Area 
                  type="monotone" 
                  dataKey="duration" 
                  stroke="hsl(var(--primary))" 
                  fillOpacity={1} 
                  fill="url(#colorDuration)" 
                  name="Duración Total"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 2. GANTT: Secuencia Global */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Cronograma Global de Producción</CardTitle>
            <CardDescription>Secuencia de lotes únicos en el tiempo (Inicio a Fin).</CardDescription>
          </CardHeader>
          <CardContent className="h-[400px] overflow-auto">
            <div className="min-w-[800px] h-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={ganttData}
                  layout="vertical"
                  barSize={15}
                  margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.2} />
                  <YAxis type="category" dataKey="id" width={80} tick={{ fontSize: 10 }} />
                  <XAxis 
                    type="number" 
                    domain={[minTime, maxTime]} 
                    tickFormatter={(unixTime) => format(new Date(unixTime), "dd/MM HH:mm")}
                    scale="time"
                    orientation="top"
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip 
                    cursor={{fill: 'transparent'}}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                          <div className="bg-popover border border-border p-2 rounded shadow text-xs">
                            <p className="font-bold">{d.id}</p>
                            <p>Inicia: {d.startLabel}</p>
                            <p>Termina: {d.endLabel}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="startOffset" stackId="a" fill="transparent" />
                  <Bar dataKey="durationMs" stackId="a" fill="hsl(var(--muted-foreground))" opacity={0.6} radius={[2, 2, 2, 2]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

      </div>
    </DashboardLayout>
  );
}