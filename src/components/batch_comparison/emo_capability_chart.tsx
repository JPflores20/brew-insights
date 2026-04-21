import React, { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ReferenceLine,
  Label,
} from "recharts";
import { Input } from "@/components/ui/input";
import { Label as UILabel } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BatchRecord } from "@/types";
import { useLocalStorage } from "@/hooks/use_local_storage";
import { Activity, Beaker, FileSpreadsheet, Filter } from "lucide-react";
import { FILTER_ALL } from "@/lib/constants";

interface EmoCapabilityChartProps {
  data: BatchRecord[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background/90 backdrop-blur-md border border-border p-3 rounded-lg shadow-xl">
        <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Valor: {label}</p>
        <p className="text-sm font-bold text-primary">
          Densidad: <span className="font-mono">{parseFloat(payload[0].value).toFixed(4)}</span>
        </p>
      </div>
    );
  }
  return null;
};

export function EmoCapabilityChart({ data }: EmoCapabilityChartProps) {
  // Manual specification limits (LEI = LSL, LES = USL)
  const [lei, setLei] = useLocalStorage<number | "">("emo-lei", 18);
  const [les, setLes] = useLocalStorage<number | "">("emo-les", 22);

  // Filters
  const [selectedRecipe, setSelectedRecipe] = useState<string>("");
  const [selectedMachine, setSelectedMachine] = useState<string>("");

  // Derived options for filters
  const uniqueRecipes = useMemo(() => {
    return Array.from(new Set(data.map((d) => d.productName).filter(Boolean))).sort();
  }, [data]);

  const uniqueMachines = useMemo(() => {
    // Only show Rotapool units in the filter
    return Array.from(new Set(data.map((d) => d.TEILANL_GRUPO).filter(Boolean)))
      .filter(m => m.toLowerCase().includes('rotapool'))
      .sort();
  }, [data]);

  // Extract EMO values (IW_DFM8) with filtering
  const emoValues = useMemo(() => {
    if (!selectedMachine) return [];

    const filtered = data
      .filter((d) => {
        const recipeMatch = selectedRecipe === FILTER_ALL || d.productName === selectedRecipe;
        
        // If "Todos" is selected, we still restrict to Rotapools only
        if (selectedMachine === FILTER_ALL) {
          const isRotapool = d.TEILANL_GRUPO && d.TEILANL_GRUPO.toLowerCase().includes('rotapool');
          return recipeMatch && isRotapool;
        }
        
        return recipeMatch && d.TEILANL_GRUPO === selectedMachine;
      })
      .map((d) => d.emo_iw_dfm8)
      .filter((v): v is number => typeof v === "number" && !isNaN(v));
    
    console.log(`EMO Values check: Found ${filtered.length} values for recipe=${selectedRecipe}, machine=${selectedMachine}`);
    return filtered;
  }, [data, selectedRecipe, selectedMachine]);

  // Check if there are ANY EMO values in the entire raw data
  const hasEverSeenEmo = useMemo(() => {
    return data.some(d => typeof d.emo_iw_dfm8 === 'number');
  }, [data]);

  // Statistical calculations
  const stats = useMemo(() => {
    const n = emoValues.length;
    if (n < 2) return null;

    const mean = emoValues.reduce((a, b) => a + b, 0) / n;
    const min = Math.min(...emoValues);
    const max = Math.max(...emoValues);
    
    const sumSqDiff = emoValues.reduce((a, b) => a + Math.pow(b - mean, 2), 0);
    const variance = sumSqDiff / (n - 1);
    const stdDev = Math.sqrt(variance);

    // Cp = (LES - LEI) / (6 * deviation)
    const nLei = Number(lei);
    const nLes = Number(les);
    const cp = (nLes - nLei) / (6 * stdDev);

    // Cpk = MIN((LES - media) / (3 * deviation), (media - LEI) / (3 * deviation))
    const cpkUpper = (nLes - mean) / (3 * stdDev);
    const cpkLower = (mean - nLei) / (3 * stdDev);
    const cpk = Math.min(cpkUpper, cpkLower);
    
    // Target is exactly in the middle of LEI and LES
    const target = (nLei + nLes) / 2;

    return { n, mean, min, max, stdDev, cp, cpk, lei: nLei, les: nLes, target };
  }, [emoValues, lei, les]);

  // Gaussian Curve Data Generation
  const chartData = useMemo(() => {
    if (!stats) return [];
    const { mean, stdDev, lei: sLei, les: sLes } = stats;
    if (stdDev === 0) return [];
    
    const points = [];
    const sigmaCount = 4;
    
    // We want to show at least 4 sigma, but also include the LEI/LES if they are outside that range
    const dataStart = mean - sigmaCount * stdDev;
    const dataEnd = mean + sigmaCount * stdDev;
    
    const start = Math.min(dataStart, sLei - stdDev);
    const end = Math.max(dataEnd, sLes + stdDev);
    
    const step = (end - start) / 100;

    for (let x = start; x <= end; x += step) {
      const y = (1 / (stdDev * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * Math.pow((x - mean) / stdDev, 2));
      points.push({ x: parseFloat(x.toFixed(3)), y: parseFloat(y.toFixed(5)) });
    }
    return points;
  }, [stats]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-2 shadow-sm border-border bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <div className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  Capacidad del Proceso - EMO
                </CardTitle>
                <CardDescription>Distribución Gaussian (Campana de Gauss) de IW_DFM8</CardDescription>
              </div>
              
              <div className="flex items-center gap-3 bg-secondary/30 p-2 rounded-lg border border-border">
                <div className="flex flex-col">
                  <UILabel htmlFor="lei" className="text-[10px] uppercase font-bold text-muted-foreground mb-1">LEI</UILabel>
                  <Input
                    id="lei"
                    type="number"
                    value={lei}
                    onChange={(e) => setLei(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    onFocus={(e) => e.target.select()}
                    className="h-8 w-20 text-xs font-mono"
                  />
                </div>
                <div className="flex flex-col">
                  <UILabel htmlFor="les" className="text-[10px] uppercase font-bold text-muted-foreground mb-1">LES</UILabel>
                  <Input
                    id="les"
                    type="number"
                    value={les}
                    onChange={(e) => setLes(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    onFocus={(e) => e.target.select()}
                    className="h-8 w-20 text-xs font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Filters Row */}
            <div className="flex flex-wrap items-center gap-4 p-3 bg-muted/30 rounded-lg border border-border/50">
              <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium mr-2">
                <Filter className="h-4 w-4" /> Filtros:
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 flex-1">
                <Select value={selectedRecipe} onValueChange={setSelectedRecipe}>
                  <SelectTrigger className="w-full sm:w-[200px] h-9 bg-background">
                    <SelectValue placeholder="Receta" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={FILTER_ALL}>Todas las recetas</SelectItem>
                    {uniqueRecipes.map((r) => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedMachine} onValueChange={setSelectedMachine}>
                  <SelectTrigger className="w-full sm:w-[200px] h-9 bg-background">
                    <SelectValue placeholder="Seleccionar Rotapool" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={FILTER_ALL}>Todos los Rotapool</SelectItem>
                    {uniqueMachines.map((m) => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="text-xs text-muted-foreground ml-auto bg-background px-2 py-1 rounded border border-border/50">
                Muestra: <span className="font-bold text-foreground">{emoValues.length}</span> registros
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="h-[400px] w-full">
            {!hasEverSeenEmo ? (
               <div className="flex h-full items-center justify-center flex-col gap-2 text-center text-muted-foreground p-8">
                 <Beaker className="h-12 w-12 text-primary/20 mb-2" />
                 <p className="font-bold">No se detectaron datos de EMO en el dataset actual.</p>
                 <p className="text-sm max-w-md">Es posible que necesites recargar la página o volver a procesar los archivos DBF para capturar la columna <code className="bg-muted px-1 rounded">IW_DFM8</code>.</p>
               </div>
            ) : !selectedMachine ? (
               <div className="flex h-full items-center justify-center flex-col gap-2 text-muted-foreground p-8 text-center">
                 <Activity className="h-10 w-10 opacity-20" />
                 <p>Selecciona un Rotapool para comenzar el análisis.</p>
               </div>
            ) : emoValues.length === 0 ? (
               <div className="flex h-full items-center justify-center flex-col gap-2 text-muted-foreground">
                 <Activity className="h-10 w-10 opacity-20" />
                 <p>No hay datos disponibles para los filtros seleccionados.</p>
               </div>
            ) : !stats ? (
              <div className="flex h-full items-center justify-center flex-col gap-2 text-muted-foreground">
                <FileSpreadsheet className="h-10 w-10 opacity-20" />
                <p>Se requieren al menos 2 datos para generar el análisis estadístico.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <defs>
                    <linearGradient id="colorY" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} vertical={false} />
                  <XAxis 
                    dataKey="x" 
                    type="number" 
                    domain={['dataMin', 'dataMax']} 
                    tick={{ fontSize: 10 }}
                    tickFormatter={(val) => val.toFixed(2)}
                  />
                  <YAxis hide />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="y"
                    stroke="hsl(var(--primary))"
                    fill="url(#colorY)"
                    strokeWidth={2}
                    animationDuration={1000}
                  />
                  
                  {/* Media Line */}
                  <ReferenceLine x={stats.mean} stroke="hsl(var(--primary))" strokeDasharray="3 3">
                    <Label value="Media" position="top" fill="hsl(var(--primary))" fontSize={10} />
                  </ReferenceLine>

                  {/* LEI Line */}
                  <ReferenceLine x={stats.lei} stroke="#ef4444" strokeWidth={2}>
                    <Label value={`LEI: ${stats.lei}`} position="insideTopLeft" fill="#ef4444" fontSize={10} fontWeight="bold" />
                  </ReferenceLine>

                  {/* Target Line */}
                  {(stats.lei !== 0 || stats.les !== 0) && (
                    <ReferenceLine x={stats.target} stroke="#10b981" strokeWidth={2} strokeDasharray="5 5">
                      <Label value={`Target: ${stats.target.toFixed(2)}`} position="top" fill="#10b981" fontSize={10} fontWeight="bold" />
                    </ReferenceLine>
                  )}

                  {/* LES Line */}
                  <ReferenceLine x={stats.les} stroke="#ef4444" strokeWidth={2}>
                    <Label value={`LES: ${stats.les}`} position="insideTopRight" fill="#ef4444" fontSize={10} fontWeight="bold" />
                  </ReferenceLine>
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm border-border bg-card/50 backdrop-blur-sm h-full">
        <CardHeader>
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-accent" />
            Performance estadístico EMO
          </CardTitle>
          <CardDescription>Resumen de métricas de capacidad</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableBody>
              <TableRow>
                <TableCell className="font-semibold text-muted-foreground uppercase text-[10px]">n</TableCell>
                <TableCell className="text-right font-mono">{stats?.n || 0}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-semibold text-muted-foreground uppercase text-[10px]">Media</TableCell>
                <TableCell className="text-right font-mono font-bold text-primary">{stats?.mean.toFixed(3) || "---"}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-semibold text-muted-foreground uppercase text-[10px]">Min</TableCell>
                <TableCell className="text-right font-mono">{stats?.min.toFixed(3) || "---"}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-semibold text-muted-foreground uppercase text-[10px]">Máx.</TableCell>
                <TableCell className="text-right font-mono">{stats?.max.toFixed(3) || "---"}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-semibold text-muted-foreground uppercase text-[10px]">Desv. Est. σ</TableCell>
                <TableCell className="text-right font-mono">{stats?.stdDev.toFixed(4) || "---"}</TableCell>
              </TableRow>
              <TableRow className="bg-primary/5">
                <TableCell className="font-bold text-primary uppercase text-[10px]">Cp</TableCell>
                <TableCell className="text-right font-mono font-bold text-primary">
                    {stats?.cp !== undefined && isFinite(stats.cp) ? stats.cp.toFixed(3) : "---"}
                </TableCell>
              </TableRow>
              <TableRow className="bg-primary/10">
                <TableCell className="font-bold text-primary uppercase text-[10px]">Cpk</TableCell>
                <TableCell className="text-right font-mono font-bold text-primary">
                    {stats?.cpk !== undefined && isFinite(stats.cpk) ? stats.cpk.toFixed(3) : "---"}
                </TableCell>
              </TableRow>
              <TableRow className="bg-green-500/5">
                <TableCell className="font-semibold text-green-600 uppercase text-[10px]">Target</TableCell>
                <TableCell className="text-right font-mono font-bold text-green-600">{stats?.target.toFixed(3) || "---"}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-semibold text-muted-foreground uppercase text-[10px]">LES</TableCell>
                <TableCell className="text-right font-mono text-destructive">{stats?.les.toFixed(3) || "---"}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-semibold text-muted-foreground uppercase text-[10px]">LEI</TableCell>
                <TableCell className="text-right font-mono text-destructive">{stats?.lei.toFixed(3) || "---"}</TableCell>
              </TableRow>
            </TableBody>
          </Table>

          {stats && (stats.cpk < 1) && (
             <div className="mt-6 p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-start gap-3">
               <Beaker className="h-5 w-5 mt-0.5 shrink-0" />
               <p><strong>Baja Capacidad:</strong> El Cpk es menor a 1.0, lo que indica que el proceso no está centrado o tiene demasiada variabilidad para los límites establecidos.</p>
             </div>
          )}
          {stats && (stats.cpk >= 1.33) && (
             <div className="mt-6 p-4 rounded-lg bg-green-500/10 border border-green-500/20 text-green-600 text-sm flex items-start gap-3">
               <Beaker className="h-5 w-5 mt-0.5 shrink-0" />
               <p><strong>Proceso Capaz:</strong> El Cpk es mayor a 1.33, lo cual es excelente.</p>
             </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
