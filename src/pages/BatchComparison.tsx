import { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, AreaChart, Area, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from "recharts";
import { ArrowRight, BarChart as BarChartIcon, LineChart as LineChartIcon, Radar as RadarIcon, AreaChart as AreaChartIcon, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useData } from "@/context/DataContext";
import { getUniqueBatchIds, getBatchById, getMachineData } from "@/data/mockData";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { exportToCSV } from "@/utils/exportUtils";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { TemperatureTrendChart, SeriesConfig } from "@/components/machine-detail/TemperatureTrendChart";
import { useReactToPrint } from "react-to-print";
import { Printer } from "lucide-react";
import { useRef } from "react";

// Definición de colores para las múltiples series
// Aseguramos que haya suficientes colores para rotar
const COLORS = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6', '#f43f5e', '#64748b'];

export default function BatchComparison() {
  const { data } = useData();
  const { toast } = useToast();
  const batchIds = getUniqueBatchIds(data);


  const batchProductMap = useMemo(() => {
    const map = new Map<string, string>();
    data.forEach(d => {
      if (d.productName) map.set(d.CHARG_NR, d.productName);
    });
    return map;
  }, [data]);

  const [batchA, setBatchA] = useLocalStorage<string>("batch-comparison-a", "");
  const [batchB, setBatchB] = useLocalStorage<string>("batch-comparison-b", "");
  const [chartType, setChartType] = useLocalStorage<string>("batch-comparison-chart-type", "bar");

  // --- STATE ---
  // Using useState instead of useLocalStorage so that it resets on reload
  const [seriesList, setSeriesList] = useState<any[]>([
    { id: '1', recipe: 'ALL', machine: 'ALL', batch: 'ALL', color: COLORS[0] }
  ]);

  const [selectedTempParam, setSelectedTempParam] = useState<string>("");
  const [selectedTempIndices, setSelectedTempIndices] = useState<number[]>([]);

  const uniqueRecipes = useMemo(() => Array.from(new Set(data.map(d => d.productName || "Desconocido"))).sort(), [data]);

  // Helper to compute available options based on current selection for a specific series
  const getOptions = (currentRecipe: string, currentMachine: string) => {
    let filtered = data;

    // 1. Available Recipes: Filter by Machine (if selected)
    let recipes = new Set<string>();
    let recipeSource = data;
    if (currentMachine && currentMachine !== "ALL") {
        recipeSource = recipeSource.filter(d => d.TEILANL_GRUPO === currentMachine);
    }
    recipeSource.forEach(d => {
        if(d.productName) recipes.add(d.productName);
    });

    // 2. Available Machines: Filter by Recipe (if selected)
    let machines = new Set<string>();
    let machineSource = data;
    if (currentRecipe && currentRecipe !== "ALL") {
        machineSource = machineSource.filter(d => d.productName === currentRecipe);
    }
    machineSource.forEach(d => {
        // Only include machines that have temp parameters
        if (d.parameters && d.parameters.some(p => {
            const u = (p.unit || "").toLowerCase();
            return u.includes("°c") || u.includes("temp") || p.name.toLowerCase().includes("temp");
        })) {
            machines.add(d.TEILANL_GRUPO);
        }
    });

    // 3. Available Batches: Filter by Recipe AND Machine
    let batches = new Set<string>();
    let batchSource = data;
    if (currentRecipe && currentRecipe !== "ALL") {
        batchSource = batchSource.filter(d => d.productName === currentRecipe);
    }
    if (currentMachine && currentMachine !== "ALL") {
        batchSource = batchSource.filter(d => d.TEILANL_GRUPO === currentMachine);
    }
    batchSource.forEach(d => {
         if (d.parameters && d.parameters.some(p => {
            const u = (p.unit || "").toLowerCase();
            return u.includes("°c") || u.includes("temp") || p.name.toLowerCase().includes("temp");
        })) {
            batches.add(d.CHARG_NR);
        }
    });

    return {
        recipes: Array.from(recipes).sort(),
        machines: Array.from(machines).sort(),
        batches: Array.from(batches).sort()
    };
  };

  // Compute available params based on ALL data (Global Y Axis)
  const availableTempParams = useMemo(() => {
    const temps = new Set<string>();
    data.forEach((d) => {
        d.parameters?.forEach((p) => {
            const u = (p.unit || "").toLowerCase();
            if (u.includes("°c") || u.includes("temp") || p.name.toLowerCase().includes("temp")) {
                temps.add(p.name);
            }
        });
    });
    return Array.from(temps).sort();
  }, [data]);

  // Auto-select first param if none selected or invalid
  useEffect(() => {
    if (availableTempParams.length > 0) {
      // If we have params available, ensure one is selected
      if (!selectedTempParam || !availableTempParams.includes(selectedTempParam)) {
        // If current selection is invalid or empty, default to first available
        setSelectedTempParam(availableTempParams[0]);
      }
    }
    // Remove the else block that clears it immediately. 
    // Persist the value even if temporarily unavailable during loading.
  }, [availableTempParams, selectedTempParam, setSelectedTempParam]);

  // Data Calculation Helper (Single Series)
  const calculateTrendData = (tMachine: string, tRecipe: string, tBatch: string, param: string) => {
    // Helper to find best parameter match in a record
    const getParamValue = (record: any) => {
      if (!record || !record.parameters) return null;
      
      // 1. Try exact match
      const exact = record.parameters.find((p: any) => p.name === param);
      if (exact) return exact;

      // 2. Try partial match or semantic match for "Temperature"
      // This is crucial if different machines use slightly different param names for the "Main Temp"
      // or if we have hidden the selector and just want "The Temperature".
      const fallback = record.parameters.find((p: any) => {
         const u = (p.unit || "").toLowerCase();
         const n = (p.name || "").toLowerCase();
         return u.includes("°c") || u.includes("temp") || n.includes("temp");
      });
      return fallback;
    };

    // Mode 1: Detailed Batch View (Specific Batch Selected)
    if (tBatch && tBatch !== "ALL") {
      let record;
      // Strict matching if machine is selected, otherwise find first occurrence
      if (tMachine && tMachine !== "ALL") {
        record = data.find((d) => d.CHARG_NR === tBatch && d.TEILANL_GRUPO === tMachine);
      } else {
        record = data.find((d) => d.CHARG_NR === tBatch);
      }

      const pVal = getParamValue(record);
      if (!pVal) return [];

      // If we found a valid param (either exact or fallback), return it as a single point series?
      // Wait, Detailed View expects an ARRAY of steps?
      // Actually, record.parameters is an array of ALL params for that batch.
      // But usually 'parameters' in this dataset seems to be [ {name: 'Temp', value: 10}, {name: 'Pressure', value: 5} ]
      // It does NOT seem to be a time-series within one record, based on "Mode 1" logic returning:
      // record.parameters.filter(p => p.name === param).map(...)
      
      // If the data structure is: One Record = One Batch Summary?
      // The original code: record.parameters.filter(p => p.name === param).map(...)
      // This suggests 'parameters' might contain MULTIPLE entries for 'Temp' (time series)?
      // OR 'parameters' contains different params.
      
      // Let's assume 'parameters' might contain multiple values for the same param name (TimeSeries-like)
      // OR we just return the single value.
      // The map: .map((p, index) => ({ stepName: ..., value: ... }))
      
      // If we use getParamValue, it returns ONE item.
      // If the original code filtered by name, it could return MULTIPLE items (TimeSeries).
      
      // So precise logic:
      if (!record || !record.parameters) return [];
      
      // 1. Try exact match filter
      const exactMatches = record.parameters.filter((p: any) => p.name === param);
      if (exactMatches.length > 0) {
          return exactMatches.map((p: any, index: number) => ({
            stepName: p.stepName || `Paso ${index + 1}`,
            value: Number(p.value),
            unit: p.unit,
            date: record.timestamp
          }));
      }
      
      // 2. Fallback: Filter by "Is Temperature"
      const fallbackMatches = record.parameters.filter((p: any) => {
         const u = (p.unit || "").toLowerCase();
         const n = (p.name || "").toLowerCase();
         return u.includes("°c") || u.includes("temp") || n.includes("temp");
      });
      
      return fallbackMatches.map((p: any, index: number) => ({
          stepName: p.stepName || `Paso ${index + 1}`,
          value: Number(p.value),
          unit: p.unit,
          date: record.timestamp
      }));
    }

    // Mode 2: Historical Trend (ALL Batches)
    let records = tMachine === "ALL" ? data : getMachineData(data, tMachine);

    if (tRecipe && tRecipe !== "ALL") {
      records = records.filter((d) => d.productName === tRecipe);
    }

    return records
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .map((record) => {
        const pVal = getParamValue(record); // Use helper to find ANY temp
        return {
          batchId: record.CHARG_NR,
          value: pVal ? Number(pVal.value) : null,
          date: new Date(record.timestamp).toLocaleString([], {
            dateStyle: "short",
            timeStyle: "short",
          }),
          machine: record.TEILANL_GRUPO,
          stepName: new Date(record.timestamp).toLocaleString([], { dateStyle: "short", timeStyle: "short" }) // Use date as stepName for history
        };
      })
      .filter((d): d is any => d.value !== null && Number.isFinite(d.value));
  };

  // Compute Merged Data for Chart
  const chartData = useMemo(() => {
    const dataMap = new Map<string, any>();

    seriesList.forEach((series) => {
        const points = calculateTrendData(series.machine, series.recipe, series.batch, selectedTempParam);
        points.forEach((p, index) => {
            // Use index as the primary key to ensure sequential alignment even with duplicate step names
            // If we are in historical mode (batch=ALL), stepName is actually a unique date string or batch ID, so it's safe.
            // If we are in batch mode, stepName might be "Calentar", "Calentar", etc.
            // So we use index to distinguish them: 0_Calentar, 1_Calentar, etc.
            
            // However, we want to align "Step 1" of Series A with "Step 1" of Series B.
            // So key should be based on index.
            // But we want to preserve the display name.
            
            const isBatchMode = series.batch && series.batch !== 'ALL';
            const key = isBatchMode ? index.toString() : p.stepName; 
            
            if (!dataMap.has(key)) {
                dataMap.set(key, { 
                    originalIndex: index,
                    // Use the step name from the first series that populates this index
                    stepName: p.stepName, 
                    date: p.date, 
                    unit: p.unit 
                });
            }
            const entry = dataMap.get(key);
            entry[`value_${series.id}`] = p.value;
            // Preserve unit if found
            if(p.unit) entry.unit = p.unit;
        });
    });

    // Convert to array
    const result = Array.from(dataMap.values());

    // Sort
    if (result.length > 0) {
        const isBatchModeGlobal = seriesList.some(s => s.batch && s.batch !== 'ALL');
        
        if (isBatchModeGlobal) {
            // Sort by original index to ensure sequence (Step 1, Step 2, ...)
             result.sort((a, b) => a.originalIndex - b.originalIndex);
        } else {
            // Sort by date/string for historical view
            result.sort((a, b) => {
                 const dA = new Date(a.date || a.stepName).getTime();
                 const dB = new Date(b.date || b.stepName).getTime();
                 return dA - dB;
            });
        }
    }

    return result;
  }, [seriesList, selectedTempParam, data]);

  // Series Management Actions
  const addSeries = () => {
    const nextId = Math.max(0, ...seriesList.map(s => parseInt(s.id))) + 1;
    const newId = nextId.toString();
    // Use modulo of the ID (minus 1 to start at 0) to cycle through colors consistently 
    // regardless of how many items are currently in the list
    const color = COLORS[(nextId - 1) % COLORS.length];
    
    // Duplicate the last series settings for convenience
    const lastSeries = seriesList[seriesList.length - 1];
    setSeriesList([...seriesList, { 
        id: newId, 
        recipe: lastSeries ? lastSeries.recipe : 'ALL', 
        machine: lastSeries ? lastSeries.machine : 'ALL', 
        batch: lastSeries ? lastSeries.batch : 'ALL', 
        color 
    }]);
  };

  const removeSeries = (id: string) => {
      setSeriesList(seriesList.filter(s => s.id !== id));
  };

  const updateSeries = (index: number, field: string, value: string) => {
      const newList = [...seriesList];
      newList[index] = { ...newList[index], [field]: value };
      
      // Reset dependent fields
      if (field === 'recipe') {
          newList[index].batch = 'ALL';
          // Keep machine if it's still valid? Simpler to reset or keep. 
          // Let's keep machine but user might need to change it if invalid. 
          // The getOptions will handle showing validity.
      }
      if (field === 'machine') {
          newList[index].batch = 'ALL';
      }
      
      setSeriesList(newList);
  };

  const seriesConfig: SeriesConfig[] = seriesList.map((s, index) => {
    const options = getOptions(s.recipe, s.machine);
    return {
        ...s,
        availableRecipes: options.recipes,
        availableMachines: options.machines,
        availableBatches: options.batches,
        setRecipe: (val) => updateSeries(index, 'recipe', val),
        setMachine: (val) => updateSeries(index, 'machine', val),
        setBatch: (val) => updateSeries(index, 'batch', val),
        onRemove: seriesList.length > 1 ? () => removeSeries(s.id) : undefined
    };
  });

  // ... (Keep the rest of the file layout)
  
  // (Previous Effect for Batch Comparison Top Chart)
  useEffect(() => {
    if (batchIds.length >= 2) {
      if (!batchA || !batchIds.includes(batchA)) {
        setBatchA(batchIds[0]);
      }
      if (!batchB || !batchIds.includes(batchB)) {
        setBatchB(batchIds[1]);
      }
    }
  }, [batchIds, batchA, batchB, setBatchA, setBatchB]);

  if (data.length === 0) {
    return (
      <DashboardLayout>
        <div className="p-8 text-center text-muted-foreground">
          Por favor carga un archivo Excel en la pestaña "Overview" primero.
        </div>
      </DashboardLayout>
    );
  }

  const batchAData = getBatchById(data, batchA);
  const batchBData = getBatchById(data, batchB);

  const relevantMachines = useMemo(() => {
    const machinesA = batchAData.map(d => d.TEILANL_GRUPO);
    const machinesB = batchBData.map(d => d.TEILANL_GRUPO);
    return Array.from(new Set([...machinesA, ...machinesB])).sort();
  }, [batchAData, batchBData]);

  const comparisonData = relevantMachines.map(machineName => {
    const recordA = batchAData.find(d => d.TEILANL_GRUPO === machineName);
    const recordB = batchBData.find(d => d.TEILANL_GRUPO === machineName);

    return {
      machine: machineName,
      [batchA || 'Lote A']: recordA?.real_total_min || 0,
      [batchB || 'Lote B']: recordB?.real_total_min || 0,
    };
  });

  const componentRef = useRef<HTMLDivElement>(null);
  
  const handlePrint = useReactToPrint({
      contentRef: componentRef,
      documentTitle: `Reporte_Comparacion_${format(new Date(), 'yyyy-MM-dd_HHmm')}`,
      pageStyle: `
        @page { size: auto; margin: 15mm; }
        @media print {
          body { -webkit-print-color-adjust: exact; }
          .print:hidden { display: none !important; }
        }
      `
  });

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Comparación de Lotes</h1>
            <p className="text-muted-foreground">Analiza diferencias de tiempo entre dos cocimientos</p>
          </div>

          <div className="flex items-center gap-2">
            <Tabs value={chartType} onValueChange={setChartType} className="w-full md:w-auto">
                <TabsList className="grid w-full grid-cols-4 md:w-[300px]">
                <TabsTrigger value="bar" title="Barras"><BarChartIcon className="h-4 w-4" /></TabsTrigger>
                <TabsTrigger value="line" title="Línea"><LineChartIcon className="h-4 w-4" /></TabsTrigger>
                <TabsTrigger value="area" title="Área"><AreaChartIcon className="h-4 w-4" /></TabsTrigger>
                <TabsTrigger value="radar" title="Radar"><RadarIcon className="h-4 w-4" /></TabsTrigger>
                </TabsList>
            </Tabs>

            <Button
                variant="outline"
                onClick={() => handlePrint()}
                className="gap-2"
            >
                <Printer className="h-4 w-4" />
                <span className="hidden sm:inline">Imprimir PDF</span>
            </Button>

            <Button
                variant="outline"
                onClick={() => {
                if (comparisonData.length === 0) {
                    toast({ title: "Sin datos", description: "No hay comparación activa para exportar.", variant: "destructive" });
                    return;
                }
                exportToCSV(comparisonData, `Comparativa_${batchA}_vs_${batchB}_${format(new Date(), 'yyyyMMdd')}`);
                toast({ title: "Exportación exitosa", description: "Tabla comparativa descargada." });
                }}
            >
                <ArrowRight className="mr-2 h-4 w-4 rotate-90 sm:rotate-0" /> Exportar CSV
            </Button>
          </div>
        </div>
        
        {/* Printable Content Wrapper */}
        <div ref={componentRef} className="space-y-6">
            {/* Title for Print View Only */}
            <div className="hidden print:block mb-6">
                <h1 className="text-3xl font-bold text-black mb-2">Reporte de Comparación de Lotes</h1>
                <p className="text-gray-600">Generado el {format(new Date(), "PPP p")}</p>
                {batchA && batchB && (
                  <p className="text-lg mt-2 text-black">Comparando: <strong>{batchA}</strong> vs <strong>{batchB}</strong></p>
                )}
            </div>

            <Card className="bg-card border-border print:hidden">
          <CardHeader><CardTitle>Seleccionar Lotes</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="flex-1 w-full">
                <Select value={batchA} onValueChange={setBatchA}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar Lote A" /></SelectTrigger>
                  <SelectContent>
                    {batchIds.map(id => (
                      <SelectItem key={id} value={id}>
                        {id} - {batchProductMap.get(id) || "Sin producto"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <ArrowRight className="h-6 w-6 text-muted-foreground hidden sm:block" />
              <div className="flex-1 w-full">
                <Select value={batchB} onValueChange={setBatchB}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar Lote B" /></SelectTrigger>
                  <SelectContent>
                    {batchIds.map(id => (
                      <SelectItem key={id} value={id}>
                        {id} - {batchProductMap.get(id) || "Sin producto"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {batchA && batchB && (
          <Card className="bg-card border-border">
            <CardContent className="pt-6">
              <div className="h-[500px]">
                <ResponsiveContainer width="100%" height="100%">
                  {chartType === "bar" ? (
                    <BarChart
                      data={comparisonData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                      <XAxis
                        dataKey="machine"
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                        axisLine={{ stroke: 'hsl(var(--border))' }}
                        interval={0}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis
                        label={{ value: 'Minutos', angle: -90, position: 'insideLeft', fill: 'hsl(var(--muted-foreground))' }}
                        tick={{ fill: 'hsl(var(--muted-foreground))' }}
                        axisLine={false}
                      />
                      <Tooltip
                        contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--popover-foreground))' }}
                        cursor={{ fill: 'hsl(var(--muted)/0.2)' }}
                      />
                      <Legend wrapperStyle={{ paddingTop: '20px' }} />
                      <Bar
                        dataKey={batchA}
                        fill="hsl(var(--primary))"
                        name={`Lote ${batchA} (${batchProductMap.get(batchA) || ''})`}
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        dataKey={batchB}
                        fill="#3b82f6"
                        name={`Lote ${batchB} (${batchProductMap.get(batchB) || ''})`}
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  ) : chartType === "line" ? (
                    <LineChart
                      data={comparisonData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                      <XAxis
                        dataKey="machine"
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                        axisLine={{ stroke: 'hsl(var(--border))' }}
                        interval={0}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis
                        label={{ value: 'Minutos', angle: -90, position: 'insideLeft', fill: 'hsl(var(--muted-foreground))' }}
                        tick={{ fill: 'hsl(var(--muted-foreground))' }}
                        axisLine={false}
                      />
                      <Tooltip
                        contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--popover-foreground))' }}
                      />
                      <Legend wrapperStyle={{ paddingTop: '20px' }} />
                      <Line
                        type="monotone"
                        dataKey={batchA}
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        name={`Lote ${batchA}`}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                      <Line
                        type="monotone"
                        dataKey={batchB}
                        stroke="#3b82f6"
                        strokeWidth={2}
                        name={`Lote ${batchB}`}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  ) : chartType === "area" ? (
                    <AreaChart
                      data={comparisonData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
                    >
                      <defs>
                        <linearGradient id="colorBatchA" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorBatchB" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                      <XAxis
                        dataKey="machine"
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                        axisLine={{ stroke: 'hsl(var(--border))' }}
                        interval={0}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis
                        label={{ value: 'Minutos', angle: -90, position: 'insideLeft', fill: 'hsl(var(--muted-foreground))' }}
                        tick={{ fill: 'hsl(var(--muted-foreground))' }}
                        axisLine={false}
                      />
                      <Tooltip
                        contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--popover-foreground))' }}
                      />
                      <Legend wrapperStyle={{ paddingTop: '20px' }} />
                      <Area
                        type="monotone"
                        dataKey={batchA}
                        stroke="hsl(var(--primary))"
                        fill="url(#colorBatchA)"
                        fillOpacity={0.4}
                        name={`Lote ${batchA}`}
                      />
                      <Area
                        type="monotone"
                        dataKey={batchB}
                        stroke="#3b82f6"
                        fill="url(#colorBatchB)"
                        fillOpacity={0.4}
                        name={`Lote ${batchB}`}
                      />
                    </AreaChart>
                  ) : (
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={comparisonData}>
                      <PolarGrid stroke="hsl(var(--muted-foreground))" opacity={0.2} />
                      <PolarAngleAxis dataKey="machine" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                      <Radar
                        name={`Lote ${batchA}`}
                        dataKey={batchA}
                        stroke="hsl(var(--primary))"
                        fill="hsl(var(--primary))"
                        fillOpacity={0.4}
                      />
                      <Radar
                        name={`Lote ${batchB}`}
                        dataKey={batchB}
                        stroke="#3b82f6"
                        fill="#3b82f6"
                        fillOpacity={0.4}
                      />
                      <Legend />
                      <Tooltip
                        contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--popover-foreground))' }}
                      />
                    </RadarChart>
                  )}
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}


        {/* Temperatura Trend Chart (Refactored for Multi-Series) */}
        <div className="space-y-6 mt-6">
          <TemperatureTrendChart
            data={chartData}
            selectedTempParam={selectedTempParam}
            availableTempParams={availableTempParams}
            setSelectedTempParam={setSelectedTempParam}
            selectedTempIndices={selectedTempIndices}
            setSelectedTempIndices={setSelectedTempIndices}
            chartType="line"
            title="Análisis de Tendencias (Detallado)"
            hideParamSelector={true}
            series={seriesConfig}
            onAddSeries={addSeries}
          />
        </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
