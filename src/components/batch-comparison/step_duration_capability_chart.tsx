import React, { useState, useMemo, useEffect } from "react";
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
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BatchRecord } from "@/types";
import { Activity, Beaker, FileSpreadsheet, Filter, Clock } from "lucide-react";
import { FILTER_ALL } from "@/lib/constants";
import { DateRange } from "react-day-picker";
import { DatePickerWithRange } from "@/components/ui/date_range_picker";
import { startOfDay, endOfDay } from "date-fns";

interface StepDurationCapabilityChartProps {
  data: BatchRecord[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background/90 backdrop-blur-md border border-border p-3 rounded-lg shadow-xl">
        <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Duración: {label} min</p>
        <p className="text-sm font-bold text-blue-500">
          Densidad: <span className="font-mono">{parseFloat(payload[0].value).toFixed(4)}</span>
        </p>
      </div>
    );
  }
  return null;
};

export function StepDurationCapabilityChart({ data }: StepDurationCapabilityChartProps) {
  // Filters
  const [selectedRecipe, setSelectedRecipe] = useState<string>("");
  const [selectedMachine, setSelectedMachine] = useState<string>("");
  const [selectedStep, setSelectedStep] = useState<string>("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  // Calculate Min/Max Dates from data
  const { minDataDate, maxDataDate } = useMemo(() => {
    if (!data || data.length === 0) return { minDataDate: undefined, maxDataDate: undefined };
    let minT = new Date(data[0].timestamp).getTime();
    let maxT = minT;
    data.forEach(d => {
      const t = new Date(d.timestamp).getTime();
      if (!isNaN(t)) {
        if (t < minT) minT = t;
        if (t > maxT) maxT = t;
      }
    });
    return {
      minDataDate: isNaN(minT) ? undefined : new Date(minT),
      maxDataDate: isNaN(maxT) ? undefined : new Date(maxT),
    };
  }, [data]);

  // Specification Limits (LEI/LES) - Persisted per unique analysis key
  const analysisKey = `step-duration-cap-${selectedMachine}-${selectedStep}`;
  const [lei, setLei] = useState<number | "">(0);
  const [les, setLes] = useState<number | "">(0);

  // Load/Save LEI/LES from localStorage manually
  useEffect(() => {
    const savedLei = localStorage.getItem(`${analysisKey}-lei`);
    const savedLes = localStorage.getItem(`${analysisKey}-les`);
    if (savedLei !== null) setLei(parseFloat(savedLei));
    else setLei(0);
    if (savedLes !== null) setLes(parseFloat(savedLes));
    else setLes(0);
  }, [analysisKey]);

  const handleLeiChange = (val: number | "") => {
    setLei(val);
    if (val !== "") {
      localStorage.setItem(`${analysisKey}-lei`, val.toString());
    }
  };

  const handleLesChange = (val: number | "") => {
    setLes(val);
    if (val !== "") {
      localStorage.setItem(`${analysisKey}-les`, val.toString());
    }
  };

  // 1. Unique Recipes
  const uniqueRecipes = useMemo(() => {
    return Array.from(new Set(data.map((d) => d.productName).filter(Boolean))).sort();
  }, [data]);

  // 2. Unique Machines
  const uniqueMachines = useMemo(() => {
    return Array.from(new Set(data.map((d) => d.TEILANL_GRUPO).filter(Boolean))).sort();
  }, [data]);

  // 3. Unique Steps for the selected Machine
  const uniqueSteps = useMemo(() => {
    if (selectedMachine === FILTER_ALL) return [];
    const steps = new Set<string>();
    data.forEach(d => {
      if (d.TEILANL_GRUPO === selectedMachine) {
        d.steps.forEach(s => steps.add(s.stepName));
      }
    });
    return Array.from(steps).sort();
  }, [data, selectedMachine]);

  // Reset Step when Machine changes
  useEffect(() => {
    if (selectedMachine !== FILTER_ALL && uniqueSteps.length > 0) {
      if (!uniqueSteps.includes(selectedStep)) {
         setSelectedStep(uniqueSteps[0]);
      }
    }
  }, [selectedMachine, uniqueSteps, selectedStep]);

  // Extract Durations for Analysis
  const analysisValues = useMemo(() => {
    if (selectedMachine === FILTER_ALL || selectedStep === FILTER_ALL) return [];
    
    return data
      .filter((d) => {
        const recipeMatch = selectedRecipe === FILTER_ALL || d.productName === selectedRecipe;
        const machineMatch = d.TEILANL_GRUPO === selectedMachine;

        // Date filter
        let dateMatch = true;
        if (dateRange?.from) {
          const itemDate = new Date(d.timestamp);
          if (!isNaN(itemDate.getTime())) {
            const start = startOfDay(dateRange.from);
            const end = dateRange.to ? endOfDay(dateRange.to) : endOfDay(dateRange.from);
            dateMatch = itemDate >= start && itemDate <= end;
          }
        }

        return recipeMatch && machineMatch && dateMatch;
      })
      .flatMap((d) => 
        d.steps
          .filter(s => s.stepName === selectedStep)
          .map(s => s.durationMin)
      )
      .filter((v): v is number => typeof v === "number" && !isNaN(v));
  }, [data, selectedRecipe, selectedMachine, selectedStep, dateRange]);

  // Statistical calculations
  const stats = useMemo(() => {
    const n = analysisValues.length;
    if (n < 2) return null;

    const mean = analysisValues.reduce((a, b) => a + b, 0) / n;
    const min = Math.min(...analysisValues);
    const max = Math.max(...analysisValues);
    
    const sumSqDiff = analysisValues.reduce((a, b) => a + Math.pow(b - mean, 2), 0);
    const variance = sumSqDiff / (n - 1);
    const stdDev = Math.sqrt(variance);

    const nLei = Number(lei);
    const nLes = Number(les);
    const hasLimits = (nLei !== 0 || nLes !== 0) && nLes > nLei;
    
    const cp = hasLimits ? (nLes - nLei) / (6 * stdDev) : 0;
    const cpkUpper = hasLimits ? (nLes - mean) / (3 * stdDev) : 0;
    const cpkLower = hasLimits ? (mean - nLei) / (3 * stdDev) : 0;
    const cpk = hasLimits ? Math.min(cpkUpper, cpkLower) : 0;

    const target = hasLimits ? (nLei + nLes) / 2 : 0;

    return { n, mean, min, max, stdDev, cp, cpk, lei: nLei, les: nLes, target, hasLimits };
  }, [analysisValues, lei, les]);

  // Gaussian Curve Data Generation
  const chartData = useMemo(() => {
    if (!stats) return [];
    const { mean, stdDev, lei, les, hasLimits } = stats;
    if (stdDev === 0) return [];
    
    const points = [];
    const sigmaCount = 4;
    
    const dataStart = mean - sigmaCount * stdDev;
    const dataEnd = mean + sigmaCount * stdDev;
    
    const start = hasLimits ? Math.min(dataStart, lei - stdDev) : dataStart;
    const end = hasLimits ? Math.max(dataEnd, les + stdDev) : dataEnd;
    
    const step = (end - start) / 100;

    for (let x = start; x <= end; x += step) {
      const y = (1 / (stdDev * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * Math.pow((x - mean) / stdDev, 2));
      points.push({ x: parseFloat(x.toFixed(2)), y: parseFloat(y.toFixed(5)) });
    }
    return points;
  }, [stats]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-2 shadow-md border-border bg-card/40 backdrop-blur-md">
        <CardHeader>
          <div className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-500" />
                  Capacidad del Proceso - Duración de Pasos
                </CardTitle>
                <CardDescription>
                  Análisis de tiempos en el paso {selectedStep === FILTER_ALL ? '...' : selectedStep}
                </CardDescription>
              </div>
              
              <div className="flex items-center gap-3 bg-secondary/40 p-2 rounded-lg border border-border">
                <div className="flex flex-col">
                  <UILabel htmlFor="dur-lei" className="text-[10px] uppercase font-bold text-muted-foreground mb-1">LEI (min)</UILabel>
                  <Input
                    id="dur-lei"
                    type="number"
                    value={lei}
                    onChange={(e) => handleLeiChange(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    onFocus={(e) => e.target.select()}
                    className="h-8 w-20 text-xs font-mono"
                  />
                </div>
                <div className="flex flex-col">
                  <UILabel htmlFor="dur-les" className="text-[10px] uppercase font-bold text-muted-foreground mb-1">LES (min)</UILabel>
                  <Input
                    id="dur-les"
                    type="number"
                    value={les}
                    onChange={(e) => handleLesChange(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    onFocus={(e) => e.target.select()}
                    className="h-8 w-20 text-xs font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Filters Row */}
            <div className="flex flex-wrap items-center gap-4 p-3 bg-muted/20 rounded-lg border border-border/50">
              <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium mr-2">
                <Filter className="h-4 w-4" /> Filtros:
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 flex-1 flex-wrap">
                <DatePickerWithRange 
                  className="w-full sm:w-auto [&>div>button]:h-9"
                  date={dateRange} 
                  setDate={setDateRange} 
                  minDate={minDataDate} 
                  maxDate={maxDataDate} 
                />

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
                    <SelectValue placeholder="Equipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={FILTER_ALL}>Seleccionar equipo</SelectItem>
                    {uniqueMachines.map((m) => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedStep} onValueChange={setSelectedStep} disabled={selectedMachine === FILTER_ALL}>
                  <SelectTrigger className="w-full sm:w-[200px] h-9 bg-background">
                    <SelectValue placeholder="Paso" />
                  </SelectTrigger>
                  <SelectContent>
                    {uniqueSteps.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="text-xs text-muted-foreground ml-auto bg-background px-2 py-1 rounded border border-border/50">
                Muestra: <span className="font-bold text-foreground">{analysisValues.length}</span> registros
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="h-[400px] w-full">
            {selectedMachine === FILTER_ALL ? (
              <div className="flex h-full items-center justify-center flex-col gap-2 text-muted-foreground p-8 text-center">
                <Activity className="h-10 w-10 opacity-20" />
                <p>Selecciona un equipo y paso para comenzar el análisis de tiempos.</p>
              </div>
            ) : analysisValues.length === 0 ? (
               <div className="flex h-full items-center justify-center flex-col gap-2 text-muted-foreground">
                 <Beaker className="h-10 w-10 opacity-20" />
                 <p>No se encontraron datos para la combinación seleccionada.</p>
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
                    <linearGradient id="colorDur" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} vertical={false} />
                  <XAxis 
                    dataKey="x" 
                    type="number" 
                    domain={['dataMin', 'dataMax']} 
                    tick={{ fontSize: 10 }}
                    tickFormatter={(val) => `${val}m`}
                  />
                  <YAxis hide />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="y"
                    stroke="#3b82f6"
                    fill="url(#colorDur)"
                    strokeWidth={2}
                    animationDuration={1000}
                  />
                  
                  {/* Media Line */}
                  <ReferenceLine x={stats.mean} stroke="#3b82f6" strokeDasharray="3 3">
                    <Label value="Media" position="top" fill="#3b82f6" fontSize={10} />
                  </ReferenceLine>

                  {/* Limits Lines */}
                  {stats.hasLimits && (
                    <>
                      <ReferenceLine x={stats.target} stroke="#10b981" strokeWidth={2} strokeDasharray="5 5">
                        <Label value={`Target: ${stats.target.toFixed(1)}`} position="top" fill="#10b981" fontSize={10} fontWeight="bold" />
                      </ReferenceLine>
                      <ReferenceLine x={stats.lei} stroke="#ef4444" strokeWidth={2}>
                        <Label value={`LEI: ${stats.lei}`} position="insideTopLeft" fill="#ef4444" fontSize={10} fontWeight="bold" />
                      </ReferenceLine>
                      <ReferenceLine x={stats.les} stroke="#ef4444" strokeWidth={2}>
                        <Label value={`LES: ${stats.les}`} position="insideTopRight" fill="#ef4444" fontSize={10} fontWeight="bold" />
                      </ReferenceLine>
                    </>
                  )}
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-md border-border bg-card/40 backdrop-blur-md h-full">
        <CardHeader>
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-accent" />
            Performance Duración
          </CardTitle>
          <CardDescription>Métricas de capacidad del paso</CardDescription>
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
                <TableCell className="text-right font-mono font-bold text-blue-600">{stats?.mean.toFixed(2) || "---"} min</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-semibold text-muted-foreground uppercase text-[10px]">Min / Máx</TableCell>
                <TableCell className="text-right font-mono text-xs">{stats?.min.toFixed(1) || "---"} - {stats?.max.toFixed(1) || "---"} min</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-semibold text-muted-foreground uppercase text-[10px]">Desv. Est. σ</TableCell>
                <TableCell className="text-right font-mono">{stats?.stdDev.toFixed(3) || "---"}</TableCell>
              </TableRow>
              <TableRow className="bg-blue-500/5 border-t-2 border-primary/20">
                <TableCell className="font-bold text-blue-600 uppercase text-[10px]">Cp</TableCell>
                <TableCell className="text-right font-mono font-bold text-blue-600">
                    {stats?.cp !== undefined && isFinite(stats.cp) ? stats.cp.toFixed(3) : "---"}
                </TableCell>
              </TableRow>
              <TableRow className="bg-blue-500/10">
                <TableCell className="font-bold text-blue-600 uppercase text-[10px]">Cpk</TableCell>
                <TableCell className="text-right font-mono font-bold text-blue-600">
                    {stats?.cpk !== undefined && isFinite(stats.cpk) ? stats.cpk.toFixed(3) : "---"}
                </TableCell>
              </TableRow>
              <TableRow className="bg-green-500/5">
                <TableCell className="font-semibold text-green-600 uppercase text-[10px]">Target</TableCell>
                <TableCell className="text-right font-mono font-bold text-green-600">{stats?.target.toFixed(2) || "---"}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-semibold text-muted-foreground uppercase text-[10px]">LEI / LES</TableCell>
                <TableCell className="text-right font-mono text-destructive text-xs">{stats?.lei || 0} - {stats?.les || 0} min</TableCell>
              </TableRow>
            </TableBody>
          </Table>

          {stats && stats.hasLimits && (
             <div className="mt-6 space-y-3">
               {stats.cpk < 1 ? (
                 <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-start gap-2">
                   <Activity className="h-4 w-4 shrink-0 mt-0.5" />
                   <p><strong>Baja Capacidad:</strong> El proceso excede los límites de tiempo establecidos frecuentemente.</p>
                 </div>
               ) : stats.cpk >= 1.33 ? (
                 <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-600 text-xs flex items-start gap-2">
                   <Beaker className="h-4 w-4 shrink-0 mt-0.5" />
                   <p><strong>Proceso Capaz:</strong> Estabilidad de tiempos excelente.</p>
                 </div>
               ) : (
                 <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-600 text-xs flex items-start gap-2">
                   <Activity className="h-4 w-4 shrink-0 mt-0.5" />
                   <p><strong>Control Adecuado:</strong> Los tiempos están mayormente dentro de los límites.</p>
                 </div>
               )}
             </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
