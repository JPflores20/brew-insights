import { useState } from "react";
import {
    Card,
    CardTitle,
} from "@/components/ui/card";
import {
    AreaChart,
    Area,
    BarChart,
    Bar,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ScatterChart,
    Scatter,
    ComposedChart,
    Legend
} from "recharts";
import { FileBarChart, LineChart as LineChartIcon, Activity, Dot, Layers, Plus } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { CustomDot } from "./custom_dot";
import { ChartTooltip } from "@/components/ui/chart_tooltip";
import { FILTER_ALL } from "@/lib/constants";
import { useBcSeries } from "@/hooks/use_batch_comparison/use_bc_series";
import { useTimeSeries } from "./hooks/use_time_series";
import { MultiSeriesFilters } from "./components/multi_series_filters";
import { SingleSeriesFilters } from "./components/single_series_filters";
import { getUniqueBatchIds } from "@/data/mock_data";

interface MachineHistoryChartProps {
    data: any[];
    fullData: any[];
    selectedHistoryIndices: number[];
    setSelectedHistoryIndices: React.Dispatch<React.SetStateAction<number[]>>;
    trendBatch: string;
    selectedMachine: string;
}

export function MachineHistoryChart({
    data,
    fullData,
    selectedHistoryIndices,
    setSelectedHistoryIndices,
    trendBatch,
    selectedMachine,
}: MachineHistoryChartProps) {
    const [chartType, setChartType] = useState<"area" | "bar" | "line" | "scatter" | "composed">("area");
    const { seriesList, addSeries, seriesOptions, removeSeries } = useBcSeries(fullData, 0);

    const isMultiSeries = seriesOptions.length > 0;
    const { unifiedData, xAxisMode } = useTimeSeries(fullData, isMultiSeries, seriesOptions);

    // Fallback original history data
    const originalHistoryData = data
        .filter(d => trendBatch === FILTER_ALL || d.CHARG_NR === trendBatch)
        .filter(d => selectedMachine === FILTER_ALL || d.TEILANL_GRUPO === selectedMachine)
        .map(record => ({
            batchId: record.CHARG_NR,
            realTime: record.real_total_min,
            date: new Date(record.timestamp).toLocaleString([], { dateStyle: "short" }),
        }));

    const chartData = isMultiSeries ? unifiedData : originalHistoryData;

    if (data.length === 0) return null;

    const renderChart = () => {
        const commonProps = {
            data: chartData,
            margin: { top: 10, right: 30, left: 0, bottom: 0 },
            onClick: (d: any) => {
                if (d && d.activeTooltipIndex !== undefined) {
                    const idx = d.activeTooltipIndex;
                    setSelectedHistoryIndices((prev) =>
                        prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
                    );
                }
            },
        };

        const singleXAxisKey = trendBatch && trendBatch !== FILTER_ALL ? "date" : "batchId";
        const multiXAxisKey = xAxisMode === "steps" ? "stepName" : (xAxisMode === "machines" ? "TEILANL_GRUPO" : "date");
        const finalXAxisKey = isMultiSeries ? multiXAxisKey : singleXAxisKey;

        const commonAxes = (
            <>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} vertical={false} />
                <XAxis
                    dataKey={finalXAxisKey}
                    tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={{ stroke: "hsl(var(--border))" }}
                    interval={0} angle={-20} textAnchor="end" height={60}
                    tickFormatter={(val) => String(val).length > 15 ? String(val).slice(0, 14) + "…" : val}
                />
                <YAxis
                    label={{ value: "Minutos", angle: -90, position: "insideLeft", fill: "hsl(var(--muted-foreground))" }}
                    tick={{ fill: "hsl(var(--muted-foreground))" }}
                    axisLine={false}
                />
                <Tooltip
                    content={<ChartTooltip valueSuffix="min" />}
                    cursor={{ stroke: "hsl(var(--muted-foreground))", strokeWidth: 1, strokeDasharray: "4 4" }}
                />
            </>
        );

        if (isMultiSeries) {
            return (
                <LineChart {...commonProps}>
                    {commonAxes}
                    <Legend />
                    {seriesOptions.map((s) => (
                        <Line
                            key={s.id} type="monotone" dataKey={`value_${s.id}`}
                            stroke={s.color} strokeWidth={2} name={`Lote ${s.batch} (${s.recipe})`}
                            dot={({ key, ...props }: any) => (
                                <CustomDot key={key} {...props} selectedIndices={selectedHistoryIndices} fill={s.color} />
                            )}
                            activeDot={{ r: 6, strokeWidth: 0 }}
                        />
                    ))}
                </LineChart>
            );
        }

        if (chartType === "bar") {
            return (
                <BarChart {...commonProps}>
                    {commonAxes}
                    <Bar dataKey="realTime" fill="#8884d8" radius={[4, 4, 0, 0]} name="Tiempo Real" />
                </BarChart>
            );
        }
        if (chartType === "line") {
            return (
                <LineChart {...commonProps}>
                    {commonAxes}
                    <Line type="monotone" dataKey="realTime" stroke="#8884d8" strokeWidth={2} dot={(props: any) => <CustomDot {...props} selectedIndices={selectedHistoryIndices} />} activeDot={{ r: 6, strokeWidth: 0 }} name="Tiempo Real" />
                </LineChart>
            );
        }
        if (chartType === "scatter") {
            return (
                <ScatterChart {...commonProps}>
                    {commonAxes}
                    <Scatter dataKey="realTime" fill="#8884d8" name="Tiempo Real" />
                </ScatterChart>
            );
        }
        if (chartType === "composed") {
            return (
                <ComposedChart {...commonProps}>
                    {commonAxes}
                    <Bar dataKey="realTime" fill="#8884d8" fillOpacity={0.6} radius={[4, 4, 0, 0]} name="Tiempo Real" />
                    <Line type="monotone" dataKey="realTime" stroke="#ff7300" strokeWidth={2} dot={false} activeDot={{ r: 6, strokeWidth: 0 }} name="Tendencia" />
                </ComposedChart>
            );
        }
        return (
            <AreaChart {...commonProps}>
                <defs>
                    <linearGradient id="colorRealTime" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                    </linearGradient>
                </defs>
                {commonAxes}
                <Area type="monotone" dataKey="realTime" stroke="#8884d8" strokeWidth={2} fillOpacity={1} fill="url(#colorRealTime)" name="Tiempo Real" dot={(props: any) => <CustomDot {...props} selectedIndices={selectedHistoryIndices} />} activeDot={{ r: 6, strokeWidth: 0 }} />
            </AreaChart>
        );
    };

    return (
        <Card className="bg-card border-border w-full p-6 opacity-90 hover:opacity-100 transition-opacity">
            <div className="flex flex-col mb-6 gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <CardTitle className="text-lg font-semibold">
                        <div className="flex flex-col">
                            <span>{isMultiSeries ? "Análisis de Tiempos Multiseries" : "Tendencia Histórica De Tiempos"}</span>
                            <span className="text-sm font-normal text-muted-foreground mt-1">
                                {isMultiSeries ? "Comparación superpuesta de múltiples lotes o equipos" : `Comparativa cronológica en ${selectedMachine}`}
                            </span>
                        </div>
                    </CardTitle>

                    {!isMultiSeries && (
                        <div className="flex items-center gap-4">
                            <Tabs value={chartType} onValueChange={(v) => setChartType(v as any)} className="w-[200px] hidden sm:block">
                                <TabsList className="grid w-full grid-cols-5">
                                    <TabsTrigger value="area" title="Área"><Activity className="h-4 w-4" /></TabsTrigger>
                                    <TabsTrigger value="bar" title="Barras"><FileBarChart className="h-4 w-4" /></TabsTrigger>
                                    <TabsTrigger value="line" title="Línea"><LineChartIcon className="h-4 w-4" /></TabsTrigger>
                                    <TabsTrigger value="scatter" title="Dispersión"><Dot className="h-4 w-4" /></TabsTrigger>
                                    <TabsTrigger value="composed" title="Compuesto"><Layers className="h-4 w-4" /></TabsTrigger>
                                </TabsList>
                            </Tabs>
                            <Button variant="outline" size="sm" onClick={() => addSeries()} className="w-full sm:w-auto">
                                <Plus className="mr-2 h-4 w-4" /> Añadir Serie
                            </Button>
                        </div>
                    )}
                </div>

                {isMultiSeries && (
                    <MultiSeriesFilters 
                        series={seriesOptions} 
                        onAddSeries={addSeries} 
                        hideParamSelector={true} 
                        selectedTempParam="" 
                        setSelectedTempParam={() => {}} 
                        availableTempParams={[]} 
                    />
                )}
            </div>

            <div className="h-[340px] w-full">
                {isMultiSeries && (!seriesList || seriesList.length === 0) ? (
                    <div className="flex h-full w-full items-center justify-center flex-col gap-2 text-muted-foreground p-8 border-2 border-dashed border-muted rounded-lg">
                        <Plus className="h-8 w-8 opacity-50" /><p className="text-lg font-medium">No hay series configuradas</p><p className="text-sm">Configura al menos una serie para visualizar en pantalla.</p>
                    </div>
                ) : chartData.length === 0 ? (
                     <div className="flex h-full w-full items-center justify-center flex-col gap-2 text-muted-foreground p-8 border-2 border-dashed border-muted rounded-lg">
                         <Activity className="h-8 w-8 opacity-50" /><p>No hay datos disponibles con los filtros actuales.</p>
                     </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        {renderChart()}
                    </ResponsiveContainer>
                )}
            </div>
        </Card>
    );
}
