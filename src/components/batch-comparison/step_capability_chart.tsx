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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BatchRecord } from "@/types";
import { Activity, Beaker, FileSpreadsheet, Filter, Thermometer } from "lucide-react";
import { FILTER_ALL } from "@/lib/constants";

interface StepCapabilityChartProps {
  data: BatchRecord[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background/90 backdrop-blur-md border border-border p-3 rounded-lg shadow-xl">
        <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Valor: {label}</p>
        <p className="text-sm font-bold text-[#f97316]">
          Densidad: <span className="font-mono">{parseFloat(payload[0].value).toFixed(4)}</span>
        </p>
      </div>
    );
  }
  return null;
};

export function StepCapabilityChart({ data }: StepCapabilityChartProps) {
  // Filters
  const [selectedRecipe, setSelectedRecipe] = useState<string>(FILTER_ALL);
  const [selectedMachine, setSelectedMachine] = useState<string>(FILTER_ALL);
  const [selectedStep, setSelectedStep] = useState<string>(FILTER_ALL);
  const [selectedParam, setSelectedParam] = useState<string>(FILTER_ALL);

  // Initialize selectedMachine if it's FILTER_ALL but data is available
  useEffect(() => {
    if (selectedMachine === FILTER_ALL && data.length > 0) {
      setSelectedMachine(data[0].TEILANL_GRUPO);
    }
  }, [data, selectedMachine]);

  // Specification Limits (LEI/LES) - Persisted per unique analysis key
  const analysisKey = `step-cap-${selectedMachine}-${selectedStep}-${selectedParam}`;
  const [lei, setLei] = useState<number>(0);
  const [les, setLes] = useState<number>(0);

  // Load/Save LEI/LES from localStorage manually because the key is highly dynamic
  useEffect(() => {
    const savedLei = localStorage.getItem(`${analysisKey}-lei`);
    const savedLes = localStorage.getItem(`${analysisKey}-les`);
    if (savedLei !== null) setLei(parseFloat(savedLei));
    else setLei(0);
    if (savedLes !== null) setLes(parseFloat(savedLes));
    else setLes(0);
  }, [analysisKey]);

  const handleLeiChange = (val: number) => {
    setLei(val);
    localStorage.setItem(`${analysisKey}-lei`, val.toString());
  };

  const handleLesChange = (val: number) => {
    setLes(val);
    localStorage.setItem(`${analysisKey}-les`, val.toString());
  };

  // 1. Unique Recipes
  const uniqueRecipes = useMemo(() => {
    return Array.from(new Set(data.map((d) => d.productName).filter(Boolean))).sort();
  }, [data]);

  // 2. Unique Machines (All machines)
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

  // 4. Unique Parameters for the selected Step/Machine
  const uniqueParams = useMemo(() => {
    if (selectedMachine === FILTER_ALL || selectedStep === FILTER_ALL) return [];
    const params = new Set<string>();
    data.forEach(d => {
      if (d.TEILANL_GRUPO === selectedMachine) {
        d.parameters.forEach(p => {
          if (p.stepName === selectedStep) {
            params.add(p.name);
          }
        });
      }
    });
    return Array.from(params).sort();
  }, [data, selectedMachine, selectedStep]);

  // Auto-select first temperature parameter if available
  useEffect(() => {
    if (uniqueParams.length > 0) {
      if (selectedParam === FILTER_ALL || !uniqueParams.includes(selectedParam)) {
        const tempParam = uniqueParams.find(p => p.toUpperCase().includes('TEMP') || p.toUpperCase().includes('TEMP.'));
        setSelectedParam(tempParam || uniqueParams[0]);
      }
    }
  }, [uniqueParams, selectedParam]);

  // Extract Values for Analysis
  const analysisValues = useMemo(() => {
    if (selectedMachine === FILTER_ALL || selectedStep === FILTER_ALL || selectedParam === FILTER_ALL) return [];
    
    return data
      .filter((d) => {
        const recipeMatch = selectedRecipe === FILTER_ALL || d.productName === selectedRecipe;
        const machineMatch = d.TEILANL_GRUPO === selectedMachine;
        return recipeMatch && machineMatch;
      })
      .flatMap((d) => 
        d.parameters
          .filter(p => p.stepName === selectedStep && p.name === selectedParam)
          .map(p => p.value)
      )
      .filter((v): v is number => typeof v === "number" && !isNaN(v));
  }, [data, selectedRecipe, selectedMachine, selectedStep, selectedParam]);

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

    // Only calculate Cp/Cpk if limits are defined (not both zero)
    const hasLimits = lei !== 0 || les !== 0;
    const cp = hasLimits ? (les - lei) / (6 * stdDev) : 0;
    const cpkUpper = hasLimits ? (les - mean) / (3 * stdDev) : 0;
    const cpkLower = hasLimits ? (mean - lei) / (3 * stdDev) : 0;
    const cpk = hasLimits ? Math.min(cpkUpper, cpkLower) : 0;

    return { n, mean, min, max, stdDev, cp, cpk, lei, les };
  }, [analysisValues, lei, les]);

  // Gaussian Curve Data Generation
  const chartData = useMemo(() => {
    if (!stats) return [];
    const { mean, stdDev, lei, les } = stats;
    if (stdDev === 0) return [];
    
    const points = [];
    const sigmaCount = 4;
    
    const dataStart = mean - sigmaCount * stdDev;
    const dataEnd = mean + sigmaCount * stdDev;
    
    // Limits lines visibility
    const hasLimits = lei !== 0 || les !== 0;
    const start = hasLimits ? Math.min(dataStart, lei - stdDev) : dataStart;
    const end = hasLimits ? Math.max(dataEnd, les + stdDev) : dataEnd;
    
    const step = (end - start) / 100;

    for (let x = start; x <= end; x += step) {
      const y = (1 / (stdDev * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * Math.pow((x - mean) / stdDev, 2));
      points.push({ x: parseFloat(x.toFixed(3)), y: parseFloat(y.toFixed(5)) });
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
                  <Thermometer className="h-5 w-5 text-orange-500" />
                  Capacidad del Proceso - Variables por Paso
                </CardTitle>
                <CardDescription>
                  Análisis de {selectedParam === FILTER_ALL ? 'variable' : selectedParam} en el paso {selectedStep === FILTER_ALL ? '...' : selectedStep}
                </CardDescription>
              </div>
              
              <div className="flex items-center gap-3 bg-secondary/40 p-2 rounded-lg border border-border">
                <div className="flex flex-col">
                  <UILabel htmlFor="step-lei" className="text-[10px] uppercase font-bold text-muted-foreground mb-1">LEI</UILabel>
                  <Input
                    id="step-lei"
                    type="number"
                    value={lei}
                    onChange={(e) => handleLeiChange(parseFloat(e.target.value) || 0)}
                    className="h-8 w-20 text-xs font-mono"
                  />
                </div>
                <div className="flex flex-col">
                  <UILabel htmlFor="step-les" className="text-[10px] uppercase font-bold text-muted-foreground mb-1">LES</UILabel>
                  <Input
                    id="step-les"
                    type="number"
                    value={les}
                    onChange={(e) => handleLesChange(parseFloat(e.target.value) || 0)}
                    className="h-8 w-20 text-xs font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Filters Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 p-3 bg-muted/20 rounded-lg border border-border/50">
              <Select value={selectedRecipe} onValueChange={setSelectedRecipe}>
                <SelectTrigger className="h-9 bg-background">
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
                <SelectTrigger className="h-9 bg-background">
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
                <SelectTrigger className="h-9 bg-background">
                  <SelectValue placeholder="Paso" />
                </SelectTrigger>
                <SelectContent>
                  {uniqueSteps.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedParam} onValueChange={setSelectedParam} disabled={selectedStep === FILTER_ALL}>
                <SelectTrigger className="h-9 bg-background font-medium">
                  <SelectValue placeholder="Variable" />
                </SelectTrigger>
                <SelectContent>
                  {uniqueParams.map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="h-[400px] w-full">
            {selectedMachine === FILTER_ALL ? (
              <div className="flex h-full items-center justify-center flex-col gap-2 text-muted-foreground p-8 text-center">
                <Activity className="h-10 w-10 opacity-20" />
                <p>Selecciona un equipo y paso para comenzar el análisis.</p>
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
                    <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} vertical={false} />
                  <XAxis 
                    dataKey="x" 
                    type="number" 
                    domain={['dataMin', 'dataMax']} 
                    tick={{ fontSize: 10 }}
                    tickFormatter={(val) => val.toFixed(1)}
                  />
                  <YAxis hide />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="y"
                    stroke="#f97316"
                    fill="url(#colorTemp)"
                    strokeWidth={2}
                    animationDuration={1000}
                  />
                  
                  {/* Media Line */}
                  <ReferenceLine x={stats.mean} stroke="#f97316" strokeDasharray="3 3">
                    <Label value="Media" position="top" fill="#f97316" fontSize={10} />
                  </ReferenceLine>

                  {/* Limits Lines */}
                  {lei !== 0 && (
                    <ReferenceLine x={lei} stroke="#ef4444" strokeWidth={2}>
                      <Label value={`LEI: ${lei}`} position="insideTopLeft" fill="#ef4444" fontSize={10} fontWeight="bold" />
                    </ReferenceLine>
                  )}
                  {les !== 0 && (
                    <ReferenceLine x={les} stroke="#ef4444" strokeWidth={2}>
                      <Label value={`LES: ${les}`} position="insideTopRight" fill="#ef4444" fontSize={10} fontWeight="bold" />
                    </ReferenceLine>
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
            Performance {selectedParam === FILTER_ALL ? '' : selectedParam}
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
                <TableCell className="text-right font-mono font-bold text-orange-600">{stats?.mean.toFixed(2) || "---"}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-semibold text-muted-foreground uppercase text-[10px]">Min</TableCell>
                <TableCell className="text-right font-mono">{stats?.min.toFixed(2) || "---"}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-semibold text-muted-foreground uppercase text-[10px]">Máx.</TableCell>
                <TableCell className="text-right font-mono">{stats?.max.toFixed(2) || "---"}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-semibold text-muted-foreground uppercase text-[10px]">Desv. Est. σ</TableCell>
                <TableCell className="text-right font-mono">{stats?.stdDev.toFixed(3) || "---"}</TableCell>
              </TableRow>
              <TableRow className="bg-orange-500/5">
                <TableCell className="font-bold text-orange-600 uppercase text-[10px]">Cp</TableCell>
                <TableCell className="text-right font-mono font-bold text-orange-600">
                    {stats?.cp !== undefined && isFinite(stats.cp) ? stats.cp.toFixed(3) : "---"}
                </TableCell>
              </TableRow>
              <TableRow className="bg-orange-500/10">
                <TableCell className="font-bold text-orange-600 uppercase text-[10px]">Cpk</TableCell>
                <TableCell className="text-right font-mono font-bold text-orange-600">
                    {stats?.cpk !== undefined && isFinite(stats.cpk) ? stats.cpk.toFixed(3) : "---"}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-semibold text-muted-foreground uppercase text-[10px]">LES</TableCell>
                <TableCell className="text-right font-mono text-destructive">{lei === 0 && les === 0 ? "---" : les.toFixed(2)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-semibold text-muted-foreground uppercase text-[10px]">LEI</TableCell>
                <TableCell className="text-right font-mono text-destructive">{lei === 0 && les === 0 ? "---" : lei.toFixed(2)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>

          {stats && (lei !== 0 || les !== 0) && (
             <div className="mt-6 space-y-3">
               {stats.cpk < 1 ? (
                 <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-start gap-2">
                   <Activity className="h-4 w-4 shrink-0 mt-0.5" />
                   <p><strong>Baja Capacidad:</strong> Cpk &lt; 1.0. Proceso fuera de control o límites muy estrictos.</p>
                 </div>
               ) : stats.cpk >= 1.33 ? (
                 <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-600 text-xs flex items-start gap-2">
                   <Beaker className="h-4 w-4 shrink-0 mt-0.5" />
                   <p><strong>Proceso Capaz:</strong> Cpk &ge; 1.33. Nivel de calidad excelente.</p>
                 </div>
               ) : (
                 <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-600 text-xs flex items-start gap-2">
                   <Activity className="h-4 w-4 shrink-0 mt-0.5" />
                   <p><strong>Proceso Aceptable:</strong> 1.0 &le; Cpk &lt; 1.33. Control adecuado.</p>
                 </div>
               )}
             </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
