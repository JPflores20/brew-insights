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
    ReferenceLine
} from "recharts";
import { Plus, Trash2, Waves } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FILTER_ALL } from "@/lib/constants";
import { SeriesConfig } from "./sic_temperature_chart";

interface SicAguaMaltaChartProps {
    data: any[];
    series: SeriesConfig[];
    onAddSeries: () => void;
}

const truncateLabel = (v: any, max = 15) => {
    const s = String(v ?? "");
    return s.length > max ? s.slice(0, max - 1) + "…" : s;
};

export function SicAguaMaltaChart({
    data,
    series,
    onAddSeries,
}: SicAguaMaltaChartProps) {
    const hasData = data && data.length > 0;

    // Calculate dynamic limits
    let yMin = 0;
    let yMax = 10;
    let threshold = 3.0;

    if (hasData && series.length > 0) {
        const allValues = data.flatMap(d => series.map(s => d[`value_${s.id}`])).filter(v => typeof v === 'number') as number[];
        if (allValues.length > 0) {
            const maxVal = Math.max(...allValues);
            const minVal = Math.min(...allValues);
            const range = maxVal - minVal || maxVal * 0.2 || 1;
            
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
                            <Waves className="h-5 w-5 text-cyan-500" />
                            Relación Agua / Malta (SIC)
                        </CardTitle>
                        <CardDescription>
                            Relación (Hl Agua / Kg Malta) × 100 por cada evento de descarga.
                        </CardDescription>
                    </div>

                    <div className="flex flex-col gap-3 w-full print:hidden">
                        {series.map((s) => (
                            <div key={s.id} className="flex flex-col sm:flex-row gap-2 w-full items-center p-2 rounded-md bg-muted/30 border border-border/50">
                                <div 
                                    className="w-4 h-4 rounded-full shrink-0 border border-border" 
                                    style={{ backgroundColor: s.color }}
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
                        <Waves className="h-8 w-8 opacity-50" />
                        <p>No hay datos de Agua/Malta para la configuración seleccionada.</p>
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                            data={data}
                            margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" opacity={0.3} vertical={false} stroke="#94a3b8" />
                            <ReferenceLine y={threshold} stroke="#06b6d4" strokeDasharray="5 5" strokeWidth={1.5} label={{ position: 'top', value: `Media: ${threshold}`, fill: '#06b6d4', fontSize: 12 }} />

                            <XAxis
                                dataKey="batchId"
                                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                                axisLine={{ stroke: "hsl(var(--border))" }}
                                interval="preserveStartEnd"
                                angle={-45}
                                textAnchor="end"
                                height={60}
                                tickFormatter={(val, index) => {
                                    // Show batch ID, but notice we might have multiple points for same batch
                                    return `Lote ${truncateLabel(val, 8)}`;
                                }}
                            />
                            <YAxis
                                domain={[yMin, yMax]}
                                type="number"
                                label={{
                                    value: "Ratio ((Hl/Kg) * 100)", 
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
                                    const pointData = payload[0].payload;
                                    
                                    return (
                                        <div className="bg-slate-900 text-white p-3 rounded-md shadow-lg border border-slate-700 min-w-[220px]">
                                            <p className="font-semibold mb-1">Lote {label}</p>
                                            <p className="text-xs text-cyan-400 mb-2">{pointData.stepName}</p>
                                            <div className="flex flex-col gap-3">
                                                {payload.map((entry: any, index: number) => {
                                                    const seriesId = entry.dataKey.split('_')[1];
                                                    const config = series.find(s => s.id === seriesId);
                                                    if (!config) return null;
                                                    
                                                    const aguaVal = entry.payload[`agua_${seriesId}`];
                                                    const maltaVal = entry.payload[`malta_${seriesId}`];

                                                    if (entry.value === undefined) return null;

                                                    return (
                                                        <div key={`item-${index}`} className="flex flex-col gap-1">
                                                            <div className="flex items-center gap-2 border-t border-slate-700 pt-2">
                                                                <div 
                                                                    className="w-3 h-3 rounded-full shrink-0" 
                                                                    style={{ backgroundColor: entry.color }}
                                                                />
                                                                <span className="text-xs font-medium opacity-80">
                                                                    {config.recipe !== FILTER_ALL ? config.recipe : 'Todas'}:
                                                                </span>
                                                                <span className="text-sm font-bold ml-auto">{entry.value}</span>
                                                            </div>
                                                            {aguaVal !== undefined && maltaVal !== undefined && (
                                                                <div className="text-[10px] text-slate-400 ml-5 flex flex-col">
                                                                    <span>Agua: {aguaVal.toFixed(1)} Hl</span>
                                                                    <span>Malta: {maltaVal.toFixed(0)} Kg</span>
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
                                    strokeWidth={0}
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
