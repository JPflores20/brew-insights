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
import { format, parseISO } from "date-fns";
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
    return batchWithSteps ? batchWithSteps.steps.map(s => s.stepName) : [];
  }, [data]);

  useMemo(() => {
    if (!selectedProduct && uniqueProducts.length > 0) {
      setSelectedProduct(uniqueProducts[0]);
    }
  }, [uniqueProducts, selectedProduct, setSelectedProduct]);

  // Filtrar y ordenar datos
  const filteredData = useMemo(() => {
    if (!selectedProduct) return [];
    const batches = data.filter(d => d.productName === selectedProduct);
    // Orden cronológico
    return batches.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [data, selectedProduct]);

  // Transformar para Gráficas
  const chartData = useMemo(() => {
    return filteredData.map(batch => {
      let startTime: number;
      let endTime: number;
      let duration: number;

      if (selectedStep === "FULL_CYCLE") {
        startTime = new Date(batch.timestamp).getTime();
        if (batch.steps && batch.steps.length > 0) {
           const lastStep = batch.steps[batch.steps.length - 1];
           endTime = lastStep.endTime ? parseISO(lastStep.endTime).getTime() : startTime + (batch.real_total_min * 60000);
        } else {
           endTime = startTime + (batch.real_total_min * 60000);
        }
        duration = batch.real_total_min;
      } else {
        const step = batch.steps?.find(s => s.stepName === selectedStep);
        if (step) {
          startTime = step.startTime ? parseISO(step.startTime).getTime() : 0;
          endTime = step.endTime ? parseISO(step.endTime).getTime() : 0;
          duration = step.durationMin;
        } else {
          return null;
        }
      }

      if (!startTime || !endTime) return null;

      // --- CAMBIO AQUÍ: FORMATO DE FECHA COMPLETA ---
      const fullDateFormat = "dd/MM/yyyy HH:mm";

      return {
        id: batch.CHARG_NR,
        machine: batch.TEILANL_GRUPO,
        startTime,
        endTime,
        duration,
        startLabel: format(startTime, fullDateFormat), // Fecha completa inicio
        endLabel: format(endTime, fullDateFormat),     // Fecha completa fin
        // Datos para Gantt
        startOffset: 0, 
        durationMs: endTime - startTime
      };
    }).filter(Boolean) as any[];
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

  // Ajuste para Gantt (Offsets)
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
            <p className="text-muted-foreground">Comparativa de duración real vs teórica y secuencia.</p>
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
                  <SelectItem value="FULL_CYCLE">Ciclo Completo</SelectItem>
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
              <CardTitle className="text-sm font-medium">Lotes</CardTitle>
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
              <div className="text-2xl font-bold">+{stats.max - theoreticalDuration} min</div>
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

        {/* 1. GRÁFICO DE ÁREA: Tendencia y Comparación Teórica */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Tendencia de Duración vs Meta</CardTitle>
            <CardDescription>
              La línea roja indica el tiempo teórico ({theoreticalDuration} min).
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
                <XAxis 
                  dataKey="id" 
                  tick={{ fontSize: 10 }} 
                  interval="preserveStartEnd"
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis label={{ value: 'Minutos', angle: -90, position: 'insideLeft' }} />
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                
                {/* TOOLTIP PERSONALIZADO CON FECHA COMPLETA */}
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-popover border border-border p-3 rounded-md shadow-md text-sm text-popover-foreground">
                          <p className="font-bold mb-2 text-primary">{data.id}</p>
                          <div className="grid grid-cols-[60px_1fr] gap-x-2 gap-y-1">
                             <span className="text-muted-foreground">Duración:</span>
                             <span className="font-bold">{data.duration} min</span>
                             
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
                  name="Duración"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 2. GANTT: Secuencia y Solapamiento */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Secuencia de Lotes (Gantt)</CardTitle>
            <CardDescription>Visualización de horarios de inicio y fin para detectar solapamientos.</CardDescription>
          </CardHeader>
          <CardContent className="h-[400px] overflow-auto">
            <div className="min-w-[800px] h-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={ganttData}
                  layout="vertical"
                  barSize={15}
                  margin={{ top: 20, right: 30, left: 40, bottom: 20 }}
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