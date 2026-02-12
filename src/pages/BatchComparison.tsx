import { useEffect, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, AreaChart, Area, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from "recharts";
import { ArrowRight, BarChart as BarChartIcon, LineChart as LineChartIcon, Radar as RadarIcon, AreaChart as AreaChartIcon, Thermometer, Plus, Trash2, SlidersHorizontal } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useData } from "@/context/DataContext";
import { getUniqueBatchIds, getBatchById, generateTemperatureComparisonData, getUniqueMachineGroups } from "@/data/mockData";
import { useLocalStorage } from "@/hooks/use-local-storage";

export default function BatchComparison() {
  const { data } = useData();
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

  // --- DYNAMIC SERIES STATE ---
  interface ComparisonSeries {
    id: string;
    recipe: string;
    machine: string;
    batchId: string;
    color: string;
  }

  const [comparisonSeries, setComparisonSeries] = useLocalStorage<ComparisonSeries[]>("batch-comparison-series", [
    { id: "1", recipe: "ALL", machine: "ALL", batchId: "", color: "hsl(var(--primary))" },
    { id: "2", recipe: "ALL", machine: "ALL", batchId: "", color: "#3b82f6" } // Blue
  ]);

  const COLORS = [
    "hsl(var(--primary))",
    "#3b82f6", // Blue
    "#10b981", // Emerald
    "#f59e0b", // Amber
    "#8b5cf6", // Violet
    "#ec4899", // Pink
    "#06b6d4", // Cyan
    "#84cc16", // Lime
  ];

  const addSeries = () => {
    const newId = Math.random().toString(36).substring(7);
    const color = COLORS[comparisonSeries.length % COLORS.length];
    setComparisonSeries([...comparisonSeries, { id: newId, recipe: "ALL", machine: "ALL", batchId: "", color }]);
  };

  const removeSeries = (id: string) => {
    if (comparisonSeries.length > 1) {
      setComparisonSeries(comparisonSeries.filter(s => s.id !== id));
    }
  };

  const updateSeries = (id: string, field: keyof ComparisonSeries, value: string) => {
    setComparisonSeries(comparisonSeries.map(s => {
      if (s.id !== id) return s;
      // Reset sub-selections when parent changes
      if (field === 'recipe') return { ...s, recipe: value, batchId: "" };
      if (field === 'machine') return { ...s, machine: value, batchId: "" };
      return { ...s, [field]: value };
    }));
  };

  // Shared Lists
  const uniqueRecipes = useMemo(() => Array.from(new Set(data.map(d => d.productName || "Desconocido"))).sort(), [data]);
  const uniqueMachines = useMemo(() => getUniqueMachineGroups(data), [data]);


  // Nuevos estados para filtros de temperatura
  const [tempMachine, setTempMachine] = useLocalStorage<string>("batch-comparison-temp-machine", "");
  const [tempParam, setTempParam] = useLocalStorage<string>("batch-comparison-temp-param", "");

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

  // Calculate Temperature Data dynamically for all series
  const activeBatches = comparisonSeries.filter(s => s.batchId).map(s => s.batchId);

  const temperatureData = useMemo(() => {
    if (activeBatches.length === 0) return [];

    // We pass the list of active batch IDs to the generator
    // The generator returns points with keys matching the batch IDs
    return generateTemperatureComparisonData(activeBatches, data, tempParam);
  }, [activeBatches, data, tempParam]);

  // Available parameters for the selected batches (union of all params)
  const availableTempFilters = useMemo(() => {
    const relevantRecords = data.filter(d => activeBatches.includes(d.CHARG_NR));
    const machines = Array.from(new Set(relevantRecords.map(r => r.TEILANL_GRUPO))).sort();

    const parameters = Array.from(new Set(
      relevantRecords
        .filter(r => !tempMachine || tempMachine === "ALL" || r.TEILANL_GRUPO === tempMachine)
        .flatMap(r => r.parameters || [])
        .map(p => p.name)
    )).sort();

    return { machines, parameters };
  }, [data, activeBatches, tempMachine]);

  // Seleccionar valores por defecto si no existen
  useEffect(() => {
    if (availableTempFilters.machines.length > 0 && (!tempMachine || !availableTempFilters.machines.includes(tempMachine))) {
      setTempMachine(availableTempFilters.machines[0]);
    }
    if (availableTempFilters.parameters.length > 0 && (!tempParam || !availableTempFilters.parameters.includes(tempParam))) {
      setTempParam(availableTempFilters.parameters[0]);
    }
  }, [availableTempFilters, tempMachine, tempParam, setTempMachine, setTempParam]);

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

        {/* DYNAMIC SERIES TEMPERATURE CHART */}
        <Card className="bg-card border-border">
          <CardHeader>
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Thermometer className="h-5 w-5 text-red-500" />
                  Comparación Dinámica de Temperaturas
                </CardTitle>

                {/* Global Param Filters for the Chart */}
                <div className="flex items-center gap-2">
                  <Select value={tempMachine} onValueChange={setTempMachine}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filtrar Variable por Equipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">Todos los equipos</SelectItem>
                      {availableTempFilters.machines.map(m => (
                        <SelectItem key={m} value={m}>{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={tempParam} onValueChange={setTempParam}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Variable a Comparar" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableTempFilters.parameters.map(p => (
                        <SelectItem key={p} value={p}>{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* SERIES BUILDER */}
              <div className="space-y-2 bg-muted/30 p-4 rounded-lg border border-border">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
                  <SlidersHorizontal className="h-4 w-4" />
                  Configuración de Series
                </div>

                {comparisonSeries.map((series, index) => {
                  // Filter batches for this specific row based on recipe/machine selection
                  const rowBatches = data.filter(d =>
                    (series.recipe === "ALL" || d.productName === series.recipe) &&
                    (series.machine === "ALL" || d.TEILANL_GRUPO === series.machine)
                  ).map(d => d.CHARG_NR).sort();

                  // Unique set of batches for this row (deduplicated)
                  const uniqueRowBatches = Array.from(new Set(rowBatches));

                  return (
                    <div key={series.id} className="flex flex-col sm:flex-row items-center gap-2 animate-in fade-in slide-in-from-left-2">
                      <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: series.color }} />

                      <Select value={series.recipe} onValueChange={(v) => updateSeries(series.id, 'recipe', v)}>
                        <SelectTrigger className="w-full sm:w-[200px] h-9">
                          <SelectValue placeholder="Receta" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ALL">Todas las Recetas</SelectItem>
                          {uniqueRecipes.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                        </SelectContent>
                      </Select>

                      <Select value={series.machine} onValueChange={(v) => updateSeries(series.id, 'machine', v)}>
                        <SelectTrigger className="w-full sm:w-[200px] h-9">
                          <SelectValue placeholder="Equipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ALL">Todos los Equipos</SelectItem>
                          {uniqueMachines.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                        </SelectContent>
                      </Select>

                      <Select value={series.batchId} onValueChange={(v) => updateSeries(series.id, 'batchId', v)}>
                        <SelectTrigger className="w-full sm:w-[240px] h-9">
                          <SelectValue placeholder="Seleccionar Lote" />
                        </SelectTrigger>
                        <SelectContent>
                          {uniqueRowBatches.slice(0, 50).map(b => (
                            <SelectItem key={b} value={b}>{b}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <button
                        onClick={() => removeSeries(series.id)}
                        className="p-2 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded-md transition-colors"
                        title="Eliminar serie"
                        disabled={comparisonSeries.length === 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  );
                })}

                <button
                  onClick={addSeries}
                  className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 font-medium mt-2 px-2 py-1 rounded-md hover:bg-primary/10 transition-colors w-fit"
                >
                  <Plus className="h-4 w-4" />
                  Añadir Comparación
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={temperatureData} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis
                    dataKey="stepName"
                    label={{ value: 'Paso del Proceso', position: 'insideBottomRight', offset: -5, fill: 'hsl(var(--muted-foreground))' }}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                    interval="preserveStartEnd"
                    minTickGap={30}
                  />
                  <YAxis
                    label={{ value: 'Temp (°C)', angle: -90, position: 'insideLeft', fill: 'hsl(var(--muted-foreground))' }}
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    axisLine={false}
                    domain={[0, 'auto']}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--popover-foreground))' }}
                    labelFormatter={(value) => `Paso: ${value}`}
                  />
                  <Legend wrapperStyle={{ paddingTop: '20px' }} />

                  {comparisonSeries.map(series => (
                    series.batchId && (
                      <Line
                        key={series.id}
                        type="monotone"
                        dataKey={series.batchId}
                        name={`Lote ${series.batchId} (${series.recipe !== 'ALL' ? series.recipe : '...'})`}
                        stroke={series.color}
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 6 }}
                      />
                    )
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}