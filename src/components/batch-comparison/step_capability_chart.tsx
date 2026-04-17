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
import { MultiSelect } from "@/components/ui/multi_select";
import { BatchRecord } from "@/types";
import { Activity, Beaker, FileSpreadsheet, Filter, Thermometer } from "lucide-react";
import { FILTER_ALL } from "@/lib/constants";
import { DateRange } from "react-day-picker";
import { DatePickerWithRange } from "@/components/ui/date_range_picker";
import { startOfDay, endOfDay } from "date-fns";

interface StepCapabilityChartProps {
  data: BatchRecord[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background/90 backdrop-blur-md border border-border p-3 rounded-lg shadow-xl">
        <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Valor: {label}</p>
        <p className="text-sm font-bold text-[#8b5cf6]">
          Densidad: <span className="font-mono">{parseFloat(payload[0].value).toFixed(4)}</span>
        </p>
      </div>
    );
  }
  return null;
};

const calculateStats = (values: number[], leiVal: number, lesVal: number) => {
  const n = values.length;
  if (n < 2) return null;

  const mean = values.reduce((a, b) => a + b, 0) / n;
  const min = Math.min(...values);
  const max = Math.max(...values);
  
  const sumSqDiff = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0);
  const variance = sumSqDiff / (n - 1);
  const stdDev = Math.sqrt(variance);

  const hasLimits = leiVal !== 0 || lesVal !== 0;
  const cp = hasLimits ? (lesVal - leiVal) / (6 * stdDev) : 0;
  const cpkUpper = hasLimits ? (lesVal - mean) / (3 * stdDev) : 0;
  const cpkLower = hasLimits ? (mean - leiVal) / (3 * stdDev) : 0;
  const cpk = hasLimits ? Math.min(cpkUpper, cpkLower) : 0;

  const target = hasLimits ? (leiVal + lesVal) / 2 : 0;

  return { n, mean, min, max, stdDev, cp, cpk, lei: leiVal, les: lesVal, target };
};

export function StepCapabilityChart({ data }: StepCapabilityChartProps) {
  // Filters
  const [selectedRecipe, setSelectedRecipe] = useState<string>("");
  const [selectedMachines, setSelectedMachines] = useState<string[]>([]);
  const [selectedSteps, setSelectedSteps] = useState<string[]>([]);
  const [selectedParams, setSelectedParams] = useState<string[]>([]);
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
  const analysisKey = `step-cap-${[...selectedMachines].sort().join('-')}-${[...selectedSteps].sort().join('-')}-${[...selectedParams].sort().join('-')}`;
  const [lei, setLei] = useState<number | "">(0);
  const [les, setLes] = useState<number | "">(0);

  // Load/Save LEI/LES from localStorage manually because the key is highly dynamic
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

  // 2. Unique Machines (All machines)
  const uniqueMachines = useMemo(() => {
    return Array.from(new Set(data.map((d) => d.TEILANL_GRUPO).filter(Boolean))).sort();
  }, [data]);

  // 3. Unique Steps for the selected Machine
  const uniqueSteps = useMemo(() => {
    if (selectedMachines.length === 0) return [];
    const steps = new Set<string>();
    data.forEach(d => {
      if (selectedMachines.includes(d.TEILANL_GRUPO)) {
        d.steps.forEach(s => steps.add(s.stepName));
      }
    });
    return Array.from(steps).sort();
  }, [data, selectedMachines]);

  // Reset Step when Machine changes
  useEffect(() => {
    setSelectedSteps(prev => {
      if (selectedMachines.length === 0) return [];
      const validSelections = prev.filter(s => uniqueSteps.includes(s));
      if (validSelections.length !== prev.length) {
        return validSelections;
      }
      return prev;
    });
  }, [uniqueSteps, selectedMachines]);

  // 4. Unique Parameters for the selected Step/Machine
  const uniqueParams = useMemo(() => {
    if (selectedMachines.length === 0 || selectedSteps.length === 0) return [];
    const params = new Set<string>();
    data.forEach(d => {
      if (selectedMachines.includes(d.TEILANL_GRUPO)) {
        d.parameters.forEach(p => {
          if (selectedSteps.includes(p.stepName)) {
            params.add(p.name);
          }
        });
      }
    });
    return Array.from(params).sort();
  }, [data, selectedMachines, selectedSteps]);

  // Reset Param when Steps change
  useEffect(() => {
    setSelectedParams(prev => {
      if (selectedSteps.length === 0) return [];
      const validSelections = prev.filter(p => uniqueParams.includes(p));
      if (validSelections.length !== prev.length) {
        return validSelections;
      }
      return prev;
    });
  }, [uniqueParams, selectedSteps]);

  // Extract Values for Analysis
  const analysisValues = useMemo(() => {
    if (selectedMachines.length === 0 || selectedSteps.length === 0 || selectedParams.length === 0) return [];
    
    return data
      .filter((d) => {
        const recipeMatch = selectedRecipe === FILTER_ALL || !selectedRecipe || d.productName === selectedRecipe;
        const machineMatch = selectedMachines.includes(d.TEILANL_GRUPO);

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
        d.parameters
          .filter(p => selectedSteps.includes(p.stepName) && selectedParams.includes(p.name))
          .map(p => Number(p.value))
      )
      .filter((v): v is number => typeof v === "number" && !isNaN(v));
  }, [data, selectedRecipe, selectedMachines, selectedSteps, selectedParams, dateRange]);

  // Statistical calculations
  const stats = useMemo(() => {
    return calculateStats(analysisValues, Number(lei), Number(les));
  }, [analysisValues, lei, les]);

  // Machine-specific stats
  const machineStats = useMemo(() => {
    const ms: Record<string, ReturnType<typeof calculateStats>> = {};
    if (selectedMachines.length <= 1) return ms;

    const nLei = Number(lei);
    const nLes = Number(les);

    selectedMachines.forEach(machine => {
      const mValues = data
        .filter((d) => {
          const recipeMatch = selectedRecipe === FILTER_ALL || !selectedRecipe || d.productName === selectedRecipe;
          const machineMatch = d.TEILANL_GRUPO === machine;

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
          d.parameters
            .filter(p => selectedSteps.includes(p.stepName) && selectedParams.includes(p.name))
            .map(p => Number(p.value))
        )
        .filter((v): v is number => typeof v === "number" && !isNaN(v));

      ms[machine] = calculateStats(mValues, nLei, nLes);
    });
    return ms;
  }, [data, selectedMachines, selectedRecipe, selectedSteps, selectedParams, dateRange, lei, les]);

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
                  <Thermometer className="h-5 w-5 text-purple-500" />
                  Capacidad del Proceso - Temperatura por Paso
                </CardTitle>
                <CardDescription>
                  Análisis de {selectedParams.length > 0 ? selectedParams.join(', ') : 'variable(s)'} en paso(s): {selectedSteps.length > 0 ? selectedSteps.join(', ') : '...'}
                </CardDescription>
              </div>
              
              <div className="flex items-center gap-3 bg-secondary/40 p-2 rounded-lg border border-border">
                <div className="flex flex-col">
                  <UILabel htmlFor="step-lei" className="text-[10px] uppercase font-bold text-muted-foreground mb-1">LEI</UILabel>
                  <Input
                    id="step-lei"
                    type="number"
                    value={lei}
                    onChange={(e) => handleLeiChange(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    onFocus={(e) => e.target.select()}
                    className="h-8 w-20 text-xs font-mono"
                  />
                </div>
                <div className="flex flex-col">
                  <UILabel htmlFor="step-les" className="text-[10px] uppercase font-bold text-muted-foreground mb-1">LES</UILabel>
                  <Input
                    id="step-les"
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
              <div className="flex flex-col sm:flex-row gap-3 flex-1 flex-wrap">
                <DatePickerWithRange 
                  className="w-full sm:w-auto [&>div>button]:h-9"
                  date={dateRange} 
                  setDate={setDateRange} 
                  minDate={minDataDate} 
                  maxDate={maxDataDate} 
                />

                <Select value={selectedRecipe} onValueChange={setSelectedRecipe}>
                  <SelectTrigger className="w-full sm:w-[150px] h-9 bg-background">
                    <SelectValue placeholder="Receta" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={FILTER_ALL}>Todas las recetas</SelectItem>
                    {uniqueRecipes.map((r) => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <MultiSelect
                  options={uniqueMachines}
                  selected={selectedMachines}
                  onChange={setSelectedMachines}
                  placeholder="Equipos"
                  className="bg-background w-full sm:w-[160px]"
                />

                <MultiSelect
                  options={uniqueSteps}
                  selected={selectedSteps}
                  onChange={setSelectedSteps}
                  placeholder="Pasos"
                  className="bg-background w-full sm:w-[160px]"
                />

                <MultiSelect
                  options={uniqueParams}
                  selected={selectedParams}
                  onChange={setSelectedParams}
                  placeholder="Variables"
                  className="bg-background font-medium w-full sm:w-[180px]"
                />
              </div>

              <div className="text-xs text-muted-foreground ml-auto bg-background px-2 py-1 rounded border border-border/50">
                Muestra: <span className="font-bold text-foreground">{analysisValues.length}</span> registros
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="h-[400px] w-full">
            {selectedMachines.length === 0 ? (
              <div className="flex h-full items-center justify-center flex-col gap-2 text-muted-foreground p-8 text-center">
                <Activity className="h-10 w-10 opacity-20" />
                <p>Selecciona uno o más equipos y paso para comenzar el análisis.</p>
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
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
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
                    stroke="#8b5cf6"
                    fill="url(#colorTemp)"
                    strokeWidth={2}
                    animationDuration={1000}
                  />
                  
                  {/* Media Line */}
                  <ReferenceLine x={stats.mean} stroke="#8b5cf6" strokeDasharray="3 3">
                    <Label value="Media" position="top" fill="#8b5cf6" fontSize={10} />
                  </ReferenceLine>

                  {/* Target Line */}
                  {(lei !== 0 || les !== 0) && (
                    <ReferenceLine x={stats.target} stroke="#10b981" strokeWidth={2} strokeDasharray="5 5">
                      <Label value={`Target: ${stats.target.toFixed(2)}`} position="top" fill="#10b981" fontSize={10} fontWeight="bold" />
                    </ReferenceLine>
                  )}

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
            Performance {selectedParams.length > 0 ? selectedParams.join(', ') : ''}
          </CardTitle>
          <CardDescription>Métricas de capacidad del paso</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-[10px]">Métrica</TableHead>
                <TableHead className="text-right text-[10px]">Global</TableHead>
                {selectedMachines.length > 1 && selectedMachines.map(m => (
                  <TableHead key={m} className="text-right text-[10px] truncate max-w-[60px]" title={m}>{m}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-semibold text-muted-foreground uppercase text-[10px]">n</TableCell>
                <TableCell className="text-right font-mono">{stats?.n || 0}</TableCell>
                {selectedMachines.length > 1 && selectedMachines.map(m => (
                  <TableCell key={m} className="text-right font-mono text-muted-foreground">{machineStats[m]?.n || 0}</TableCell>
                ))}
              </TableRow>
              <TableRow>
                <TableCell className="font-semibold text-muted-foreground uppercase text-[10px]">Media</TableCell>
                <TableCell className="text-right font-mono font-bold text-purple-600">{stats?.mean.toFixed(2) || "---"}</TableCell>
                {selectedMachines.length > 1 && selectedMachines.map(m => (
                  <TableCell key={m} className="text-right font-mono text-muted-foreground">{machineStats[m]?.mean?.toFixed(2) || "---"}</TableCell>
                ))}
              </TableRow>
              <TableRow>
                <TableCell className="font-semibold text-muted-foreground uppercase text-[10px]">Min</TableCell>
                <TableCell className="text-right font-mono">{stats?.min.toFixed(2) || "---"}</TableCell>
                {selectedMachines.length > 1 && selectedMachines.map(m => (
                  <TableCell key={m} className="text-right font-mono text-muted-foreground">{machineStats[m]?.min?.toFixed(2) || "---"}</TableCell>
                ))}
              </TableRow>
              <TableRow>
                <TableCell className="font-semibold text-muted-foreground uppercase text-[10px]">Máx.</TableCell>
                <TableCell className="text-right font-mono">{stats?.max.toFixed(2) || "---"}</TableCell>
                {selectedMachines.length > 1 && selectedMachines.map(m => (
                  <TableCell key={m} className="text-right font-mono text-muted-foreground">{machineStats[m]?.max?.toFixed(2) || "---"}</TableCell>
                ))}
              </TableRow>
              <TableRow>
                <TableCell className="font-semibold text-muted-foreground uppercase text-[10px]">Desv. Est. σ</TableCell>
                <TableCell className="text-right font-mono">{stats?.stdDev.toFixed(3) || "---"}</TableCell>
                {selectedMachines.length > 1 && selectedMachines.map(m => (
                  <TableCell key={m} className="text-right font-mono text-muted-foreground">{machineStats[m]?.stdDev?.toFixed(3) || "---"}</TableCell>
                ))}
              </TableRow>
              <TableRow className="bg-purple-500/5">
                <TableCell className="font-bold text-purple-600 uppercase text-[10px]">Cp</TableCell>
                <TableCell className="text-right font-mono font-bold text-purple-600">
                    {stats?.cp !== undefined && isFinite(stats.cp) ? stats.cp.toFixed(3) : "---"}
                </TableCell>
                {selectedMachines.length > 1 && selectedMachines.map(m => {
                  const s = machineStats[m];
                  return (
                    <TableCell key={m} className="text-right font-mono font-bold text-purple-600">
                      {s?.cp !== undefined && isFinite(s.cp) ? s.cp.toFixed(3) : "---"}
                    </TableCell>
                  );
                })}
              </TableRow>
              <TableRow className="bg-purple-500/10">
                <TableCell className="font-bold text-purple-600 uppercase text-[10px]">Cpk</TableCell>
                <TableCell className="text-right font-mono font-bold text-purple-600">
                    {stats?.cpk !== undefined && isFinite(stats.cpk) ? stats.cpk.toFixed(3) : "---"}
                </TableCell>
                {selectedMachines.length > 1 && selectedMachines.map(m => {
                  const s = machineStats[m];
                  return (
                    <TableCell key={m} className="text-right font-mono font-bold text-purple-600">
                      {s?.cpk !== undefined && isFinite(s.cpk) ? s.cpk.toFixed(3) : "---"}
                    </TableCell>
                  );
                })}
              </TableRow>
              <TableRow className="bg-green-500/5">
                <TableCell className="font-semibold text-green-600 uppercase text-[10px]">Target</TableCell>
                <TableCell className="text-right font-mono font-bold text-green-600">{stats?.target.toFixed(3) || "---"}</TableCell>
                {selectedMachines.length > 1 && selectedMachines.map(m => (
                    <TableCell key={m} className="text-right font-mono text-muted-foreground">---</TableCell>
                ))}
              </TableRow>
              <TableRow>
                <TableCell className="font-semibold text-muted-foreground uppercase text-[10px]">LES</TableCell>
                <TableCell className="text-right font-mono text-destructive">{stats?.les.toFixed(2) || "---"}</TableCell>
                {selectedMachines.length > 1 && selectedMachines.map(m => (
                    <TableCell key={m} className="text-right font-mono text-muted-foreground">---</TableCell>
                ))}
              </TableRow>
              <TableRow>
                <TableCell className="font-semibold text-muted-foreground uppercase text-[10px]">LEI</TableCell>
                <TableCell className="text-right font-mono text-destructive">{stats?.lei.toFixed(2) || "---"}</TableCell>
                {selectedMachines.length > 1 && selectedMachines.map(m => (
                    <TableCell key={m} className="text-right font-mono text-muted-foreground">---</TableCell>
                ))}
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
