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
import { Plus, Trash2, Droplets } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FILTER_ALL } from "@/lib/constants";
import { SeriesConfig } from "./sic_temperature_chart";

interface SicAguaAdjuntosChartProps {
    data: any[];
    series: SeriesConfig[];
    onAddSeries: () => void;
}

const truncateLabel = (v: any, max = 15) => {
    const s = String(v ?? "");
    return s.length > max ? s.slice(0, max - 1) + "…" : s;
};

export function SicAguaAdjuntosChart({
    data,
    series,
    onAddSeries,
}: SicAguaAdjuntosChartProps) {
    const hasData = data && data.length > 0;

    // Calculate dynamic limits for the chart to match the SIC aesthetic
    let yMin = 0;
    let yMax = 10; // Default max for ratio
    let threshold = 3.6; // Assuming 500hl/140kg = 3.57 as baseline example

    if (hasData && series.length > 0) {
        const allValues = data.flatMap(d => series.map(s => d[`value_${s.id}`])).filter(v => typeof v === 'number') as number[];
        if (allValues.length > 0) {
            const maxVal = Math.max(...allValues);
            const minVal = Math.min(...allValues);
            const range = maxVal - minVal || maxVal * 0.2 || 1;
            
            // Adjust threshold based on the data average
            const avg = allValues.reduce((a, b) => a + b, 0) / allValues.length;
            threshold = Number(avg.toFixed(2));
            
            yMin = Math.max(0, Math.floor(minVal - (range * 0.5)));
            yMax = Math.ceil(maxVal + (range * 0.5));
        }
    }

    return (
        <Card className="bg-card border-border w-full p-6 opacity-90 hover:opacity-100 transition-opacity">
            <CardHeader className="px-0 pt-0 pb-6">
                <div className="flex flex-col gap-4">
                    <div className="space-y-1">
                        <CardTitle className="text-lg font-semibold flex items-center gap-2">
                            <Droplets className="h-5 w-5 text-blue-500" />
                            Relación Agua / Adjuntos (SIC)
                        </CardTitle>
                        <CardDescription>
                            Proporción de Agua (hl) sobre Arroz/Adjuntos (kg) por lote producido.
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
                                    <SelectTrigger className="w-full sm:w-[200px] h-8 text-xs">
                                        <SelectValue placeholder="Receta" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={FILTER_ALL}>Todas</SelectItem>
                                        {s.availableRecipes.map((r) => (
                                            <SelectItem key={r} value={r}>{r}</SelectItem>
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
                        <Droplets className="h-8 w-8 opacity-50" />
                        <p>No hay datos de Agua/Adjuntos para la configuración seleccionada.</p>
                        <p className="text-sm">Asegúrate de que los lotes tengan materiales registrados.</p>
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                            data={data}
                            margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" opacity={0.3} vertical={false} stroke="#94a3b8" />
                            
                            {/* Mean Threshold Line */}
                            <ReferenceLine y={threshold} stroke="#3b82f6" strokeDasharray="5 5" strokeWidth={1.5} label={{ position: 'top', value: `Media: ${threshold}`, fill: '#3b82f6', fontSize: 12 }} />

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
                                    value: "Ratio (hl/kg)", 
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
                                                    
                                                    const aguaVal = entry.payload[`agua_${seriesId}`];
                                                    const arrozVal = entry.payload[`arroz_${seriesId}`];

                                                    return (
                                                        <div key={`item-${index}`} className="flex flex-col gap-1 mb-2">
                                                            <div className="flex items-center gap-2">
                                                                <div 
                                                                    className="w-3 h-3 rounded-full shrink-0" 
                                                                    style={{ backgroundColor: entry.color }}
                                                                />
                                                                <span className="text-sm font-medium opacity-90">
                                                                    {config.recipe !== FILTER_ALL ? config.recipe : 'Todas las recetas'}:
                                                                </span>
                                                                <span className="text-sm font-bold ml-auto">{entry.value}</span>
                                                            </div>
                                                            {aguaVal !== undefined && arrozVal !== undefined && (
                                                                <div className="text-xs text-muted-foreground ml-5 flex flex-col gap-0.5">
                                                                    <span>Agua: {aguaVal.toFixed(1)} hl</span>
                                                                    <span>Adjunto: {arrozVal.toFixed(1)} kg</span>
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
                                    strokeWidth={0} // Hide the connecting line
                                    name={`${s.recipe !== FILTER_ALL ? s.recipe : 'Todas las recetas'}`}
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
