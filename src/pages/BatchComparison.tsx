import { useEffect, useMemo } from "react";
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
import { TemperatureTrendChart } from "@/components/machine-detail/TemperatureTrendChart";

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

  // --- TEMPERATURA TREND CHART STATE ---
  const [trendMachine, setTrendMachine] = useLocalStorage<string>("batch-comparison-trend-machine", "ALL");
  const [trendRecipe, setTrendRecipe] = useLocalStorage<string>("batch-comparison-trend-recipe", "ALL");
  const [trendBatch, setTrendBatch] = useLocalStorage<string>("batch-comparison-trend-batch", "ALL");
  const [selectedTempParam, setSelectedTempParam] = useLocalStorage<string>("batch-comparison-temp-param", "");
  const [selectedTempIndices, setSelectedTempIndices] = useLocalStorage<number[]>("batch-comparison-temp-indices", []);

  // Reset batch when filters change
  useEffect(() => {
    setTrendBatch("ALL");
  }, [trendRecipe, trendMachine, setTrendBatch]);

  // Derived Lists for Trend Chart
  const machinesWithTemps = useMemo(() => {
    const machines = new Set<string>();
    let filteredRecords = data;
    if (trendRecipe && trendRecipe !== "ALL") {
      filteredRecords = data.filter((d) => d.productName === trendRecipe);
    }
    filteredRecords.forEach((record) => {
      if (
        record.parameters &&
        record.parameters.some((p) => {
          const u = (p.unit || "").toLowerCase();
          return (
            u.includes("°c") ||
            u.includes("temp") ||
            p.name.toLowerCase().includes("temp")
          );
        })
      ) {
        machines.add(record.TEILANL_GRUPO);
      }
    });
    return Array.from(machines).sort();
  }, [data, trendRecipe]);

  const availableTrendBatches = useMemo(() => {
    const batches = new Set<string>();
    let filteredRecords = data;
    if (trendRecipe && trendRecipe !== "ALL") {
      filteredRecords = filteredRecords.filter((d) => d.productName === trendRecipe);
    }
    if (trendMachine && trendMachine !== "ALL") {
      filteredRecords = filteredRecords.filter((d) => d.TEILANL_GRUPO === trendMachine);
    }
    filteredRecords.forEach((record) => {
      if (
        record.parameters &&
        record.parameters.some((p) => {
          const u = (p.unit || "").toLowerCase();
          return (
            u.includes("°c") ||
            u.includes("temp") ||
            p.name.toLowerCase().includes("temp")
          );
        })
      ) {
        batches.add(record.CHARG_NR);
      }
    });
    return Array.from(batches).sort();
  }, [data, trendRecipe, trendMachine]);

  const availableTempParams = useMemo(() => {
    // If no specific machine selected, aggregate from all relevant data
    const relevantData = trendMachine === "ALL"
      ? data
      : data.filter(d => d.TEILANL_GRUPO === trendMachine);

    const allParams = relevantData.flatMap((d) => d.parameters || []);
    const temps = new Set<string>();

    allParams.forEach((p) => {
      const u = (p.unit || "").toLowerCase();
      if (
        u.includes("°c") ||
        u.includes("temp") ||
        p.name.toLowerCase().includes("temp")
      ) {
        temps.add(p.name);
      }
    });
    return Array.from(temps).sort();
  }, [data, trendMachine]);

  // Auto-select first param
  useEffect(() => {
    if (availableTempParams.length > 0) {
      if (!selectedTempParam || !availableTempParams.includes(selectedTempParam)) {
        setSelectedTempParam(availableTempParams[0]);
      }
    } else {
      setSelectedTempParam("");
    }
  }, [availableTempParams, selectedTempParam, setSelectedTempParam]);

  // Data Calculation Helper
  const calculateTrendData = (tMachine: string, tRecipe: string, tBatch: string, param: string) => {
    if (!param) return [];

    // Mode 1: Detailed Batch View
    if (tBatch && tBatch !== "ALL") {
      let record;
      if (tMachine && tMachine !== "ALL") {
        record = data.find((d) => d.CHARG_NR === tBatch && d.TEILANL_GRUPO === tMachine);
      } else {
        record = data.find((d) => d.CHARG_NR === tBatch);
      }

      if (!record || !record.parameters) return [];

      return record.parameters
        .filter((p) => p.name === param)
        .map((p, index) => ({
          stepName: p.stepName || `Paso ${index + 1}`,
          value: Number(p.value),
          unit: p.unit,
        }));
    }

    // Mode 2: Historical Trend
    let records = tMachine === "ALL" ? data : getMachineData(data, tMachine);

    if (tRecipe && tRecipe !== "ALL") {
      records = records.filter((d) => d.productName === tRecipe);
    }

    return records
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .map((record) => {
        const pVal = record.parameters?.find((p) => p.name === param);
        return {
          batchId: record.CHARG_NR,
          value: pVal ? Number(pVal.value) : null,
          date: new Date(record.timestamp).toLocaleString([], {
            dateStyle: "short",
            timeStyle: "short",
          }),
          machine: record.TEILANL_GRUPO,
        };
      })
      .filter((d): d is any => d.value !== null && Number.isFinite(d.value));
  };

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

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Comparación de Lotes</h1>
            <p className="text-muted-foreground">Analiza diferencias de tiempo entre dos cocimientos</p>
          </div>

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
            onClick={() => {
              if (comparisonData.length === 0) {
                toast({ title: "Sin datos", description: "No hay comparación activa para exportar.", variant: "destructive" });
                return;
              }
              exportToCSV(comparisonData, `Comparativa_${batchA}_vs_${batchB}_${format(new Date(), 'yyyyMMdd')}`);
              toast({ title: "Exportación exitosa", description: "Tabla comparativa descargada." });
            }}
          >
            <ArrowRight className="mr-2 h-4 w-4 rotate-90 sm:rotate-0" /> Exportar Tabla
          </Button>
        </div>

        <Card className="bg-card border-border">
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


        {/* Temperatura Trend Chart */}
        <div className="space-y-6 mt-6">
          <TemperatureTrendChart
            data={calculateTrendData(trendMachine, trendRecipe, trendBatch, selectedTempParam)}
            trendBatch={trendBatch}
            trendRecipe={trendRecipe}
            trendMachine={trendMachine}
            selectedTempParam={selectedTempParam}
            uniqueRecipes={Array.from(new Set(data.map(d => d.productName || "Desconocido"))).sort()}
            machinesWithTemps={machinesWithTemps}
            availableTrendBatches={availableTrendBatches}
            availableTempParams={availableTempParams}
            setTrendRecipe={setTrendRecipe}
            setTrendMachine={setTrendMachine}
            setTrendBatch={setTrendBatch}
            setSelectedTempParam={setSelectedTempParam}
            selectedTempIndices={selectedTempIndices}
            setSelectedTempIndices={setSelectedTempIndices}
            chartType="line"
            title="Análisis de Tendencias (Detallado)"
          />
        </div>
      </div>
    </DashboardLayout>
  );
}