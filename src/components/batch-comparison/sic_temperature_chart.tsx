import React from "react";
import {
    Card,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
    ReferenceArea,
    ReferenceLine
} from "recharts";
import { Thermometer, Plus, Trash2, TrendingUp } from "lucide-react";
import { ChartTooltip } from "@/components/ui/chart_tooltip";
import { Button } from "@/components/ui/button";
import { FILTER_ALL } from "@/lib/constants";
import { CustomDot } from "@/components/machine-detail/custom_dot";
import { PARAM_TIME } from "@/hooks/use_batch_comparison/bc_utils";

export interface SeriesConfig {
    id: string;
    recipe: string;
    machine: string;
    batch: string;
    color: string;
    parameter: string;
    step: string;
    availableRecipes: string[];
    availableMachines: string[];
    availableBatches: string[];
    availableParameters: string[];
    availableSteps: string[];
    setRecipe: (val: string) => void;
    setMachine: (val: string) => void;
    setBatch: (val: string) => void;
    setStep: (val: string) => void;
    setParameter: (val: string) => void;
    onRemove?: () => void;
}

interface SicTemperatureChartProps {
    data: any[];
    selectedTempIndices: number[];
    setSelectedTempIndices: React.Dispatch<React.SetStateAction<number[]>>;
    series: SeriesConfig[];
    onAddSeries: () => void;
}

const truncateLabel = (v: any, max = 15) => {
    const s = String(v ?? "");
    return s.length > max ? s.slice(0, max - 1) + "…" : s;
};

export function SicTemperatureChart({
    data,
    selectedTempIndices,
    setSelectedTempIndices,
    series,
    onAddSeries,
}: SicTemperatureChartProps) {
    const hasData = data && data.length > 0;

    // Calculate dynamic limits for the chart to match the SIC aesthetic
    let yMin = 0;
    let yMax = 100;
    let threshold = 75;

    if (hasData && series.length > 0) {
        const allValues = data.flatMap(d => series.map(s => d[`value_${s.id}`])).filter(v => typeof v === 'number') as number[];
        if (allValues.length > 0) {
            const maxVal = Math.max(...allValues);
            const minVal = Math.min(...allValues);
            const range = maxVal - minVal || maxVal * 0.2 || 10;
            
            // Target dashed line is below the minimum value
            threshold = Math.floor(minVal - (range * 0.8));
            yMin = Math.floor(threshold - (range * 0.5));
            yMax = Math.ceil(maxVal + (range * 0.5));
        }
    }

    return (
        <Card className="bg-card border-border w-full p-6 opacity-90 hover:opacity-100 transition-opacity">
            <CardHeader className="px-0 pt-0 pb-6">
                <div className="flex flex-col gap-4">
                    <div className="space-y-1">
                        <CardTitle className="text-lg font-semibold flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-primary" />
                            Gráfica SIC (Control de Intervalo Corto)
                        </CardTitle>
                        <CardDescription>
                            Evolución de la temperatura a lo largo del tiempo, por lote producido (Eje X: Número de Lote)
                        </CardDescription>
                    </div>

                    {/* Series configuration */}
                    <div className="flex flex-col gap-3 w-full print:hidden">
                        {series.map((s) => (
                            <div key={s.id} className="flex flex-col sm:flex-row gap-2 w-full items-center p-2 rounded-md bg-muted/30 border border-border/50">
                                <div 
                                    className="w-4 h-4 rounded-full shrink-0 border border-border" 
                                    style={{ backgroundColor: s.color }}
                                    title={`Serie ${s.id}`}
                                />
                                <Select value={s.recipe} onValueChange={s.setRecipe}>
                                    <SelectTrigger className="w-full sm:w-[180px] h-8 text-xs">
                                        <SelectValue placeholder="Receta" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={FILTER_ALL}>Todas</SelectItem>
                                        {s.availableRecipes.map((r) => (
                                            <SelectItem key={r} value={r}>{r}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Select value={s.machine} onValueChange={s.setMachine}>
                                    <SelectTrigger className="w-full sm:w-[180px] h-8 text-xs">
                                        <SelectValue placeholder="Equipo" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={FILTER_ALL}>Todos</SelectItem>
                                        {s.availableMachines.map((m) => (
                                            <SelectItem key={m} value={m}>{m}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Select value={s.batch} onValueChange={s.setBatch}>
                                    <SelectTrigger className="w-full sm:w-[150px] h-8 text-xs">
                                        <SelectValue placeholder="Lote" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={FILTER_ALL}>Todos (Histórico)</SelectItem>
                                        {s.availableBatches.map((b) => (
                                            <SelectItem key={b} value={b}>{b}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Select value={s.step} onValueChange={s.setStep}>
                                    <SelectTrigger className="w-full sm:w-[150px] h-8 text-xs">
                                        <SelectValue placeholder="Paso (GOP)" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={FILTER_ALL}>Todos los pasos</SelectItem>
                                        {s.availableSteps?.map((step) => (
                                            <SelectItem key={step} value={step}>{step}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Select value={s.parameter} onValueChange={s.setParameter}>
                                    <SelectTrigger className="w-full sm:w-[150px] h-8 text-xs">
                                        <SelectValue placeholder="Parámetro a graficar" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={FILTER_ALL}>Automático</SelectItem>
                                        {s.availableParameters?.map((p) => (
                                            <SelectItem key={p} value={p}>{p}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {s.onRemove && (
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={s.onRemove}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        ))}
                        
                        
                        <div className="flex flex-col sm:flex-row gap-2 justify-between items-center mt-2">
                            <Button variant="outline" size="sm" onClick={onAddSeries} className="w-full sm:w-auto">
                                <Plus className="mr-2 h-4 w-4" /> Añadir Serie
                            </Button>
                        </div>
                    </div>
                </div>
            </CardHeader>
            <div className="h-[340px] w-full">
                {!hasData ? (
                    <div className="flex h-full w-full items-center justify-center flex-col gap-2 text-muted-foreground p-8 border-2 border-dashed border-muted rounded-lg">
                        <TrendingUp className="h-8 w-8 opacity-50" />
                        <p>No hay datos disponibles para la configuración seleccionada.</p>
                        <p className="text-sm">Asegúrate de haber seleccionado un equipo o receta válidos.</p>
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                            data={data}
                            margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
                            onClick={(dataObj) => {
                                if (dataObj && dataObj.activeTooltipIndex !== undefined) {
                                    const idx = dataObj.activeTooltipIndex;
                                    setSelectedTempIndices((prev) =>
                                        prev.includes(idx)
                                            ? prev.filter((i) => i !== idx)
                                            : [...prev, idx]
                                    );
                                }
                            }}
                        >
                            {/* SIC Background Zones */}
                            <ReferenceArea y1={yMin} y2={threshold} fill="#e5e7eb" fillOpacity={1} strokeOpacity={0} />
                            <ReferenceArea y1={threshold} y2={yMax} fill="#bae6fd" fillOpacity={1} strokeOpacity={0} />
                            
                            <CartesianGrid strokeDasharray="3 3" opacity={0.3} vertical={false} stroke="#94a3b8" />
                            
                            {/* SIC Threshold Line */}
                            <ReferenceLine y={threshold} stroke="#b45309" strokeDasharray="6 4" strokeWidth={2} />

                            <XAxis
                                dataKey="batchId"
                                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                                axisLine={{ stroke: "hsl(var(--border))" }}
                                interval="preserveStartEnd"
                                angle={-45}
                                textAnchor="end"
                                height={60}
                                tickFormatter={(val) => `Lote ${truncateLabel(val, 10)}`}
                            />
                            <YAxis
                                domain={[yMin, yMax]}
                                type="number"
                                label={{
                                    value: data[0]?.unit || "Valor", 
                                    angle: -90,
                                    position: "insideLeft",
                                    fill: "hsl(var(--muted-foreground))",
                                }}
                                tick={{ fill: "hsl(var(--muted-foreground))" }}
                                axisLine={false}
                            />
                            <Tooltip
                                content={({ active, payload, label }) => {
                                    if (!active || !payload || !payload.length) return null;
                                    
                                    return (
                                        <div className="bg-slate-900 text-white p-3 rounded-md shadow-lg border border-slate-700 min-w-[200px]">
                                            <p className="font-semibold mb-2">{String(label).startsWith("Lote") ? label : `Lote ${label}`}</p>
                                            <div className="flex flex-col gap-2">
                                                {payload.map((entry: any, index: number) => {
                                                    const seriesId = entry.dataKey.split('_')[1];
                                                    const config = series.find(s => s.id === seriesId);
                                                    if (!config) return null;
                                                    
                                                    const durationKey = `duration_${seriesId}`;
                                                    const duration = entry.payload[durationKey];

                                                    return (
                                                        <div key={`item-${index}`} className="flex flex-col gap-1">
                                                            <div className="flex items-center gap-2">
                                                                <div 
                                                                    className="w-3 h-3 rounded-full shrink-0" 
                                                                    style={{ backgroundColor: entry.color }}
                                                                />
                                                                <span className="text-sm font-medium opacity-90">
                                                                    {config.machine !== FILTER_ALL ? config.machine : 'Todos los eq.'} - {config.recipe !== FILTER_ALL ? config.recipe : 'Todas las rec.'}:
                                                                </span>
                                                                <span className="text-sm font-bold ml-auto">{entry.value} {entry.payload[`unit_${seriesId}`] || "°C"}</span>
                                                            </div>
                                                            {config.parameter !== PARAM_TIME && duration !== undefined && duration !== null && (
                                                                <div className="text-xs text-muted-foreground ml-5 flex items-center gap-1">
                                                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                                                                    <span>Duración: {duration} min</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                }}
                                cursor={{ stroke: "hsl(var(--muted-foreground))", strokeWidth: 1, strokeDasharray: "4 4" }}
                            />
                            <Legend />
                            {series.map((s) => (
                                <Line
                                    key={s.id}
                                    type="monotone"
                                    dataKey={`value_${s.id}`}
                                    stroke={s.color}
                                    strokeWidth={0} // Hide the connecting line to emphasize dots like in SIC charts
                                    name={`${s.machine !== FILTER_ALL ? s.machine : 'Todos los eq.'} - ${s.recipe !== FILTER_ALL ? s.recipe : 'Todas las rec.'}`}
                                    connectNulls={true}
                                    isAnimationActive={false}
                                    dot={{ r: 5, fill: "#111827", stroke: s.color, strokeWidth: 2 }}
                                    activeDot={{ r: 8, strokeWidth: 0, fill: s.color }}
                                />
                            ))}
                        </LineChart>
                    </ResponsiveContainer>
                )}
            </div>
        </Card>
    );
}
