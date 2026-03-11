import React from "react";
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
import { Droplet } from "lucide-react";
import { FILTER_ALL } from "@/lib/constants";
import { SeriesConfig } from "@/types/series_config";
import { ChartCard } from "./chart-components/chart_card";
import { SeriesConfigPanel } from "./chart-components/series_config_panel";
import { ChartPlaceholder } from "./chart-components/chart_placeholder";

interface SicAguaAdjuntosChartProps {
    data: any[];
    series: SeriesConfig[];
    onAddSeries: () => void;
}

const truncateLabel = (value: any, max = 15) => {
    const stringValue = String(value ?? "");
    return stringValue.length > max ? stringValue.slice(0, max - 1) + "…" : stringValue;
};

export function SicAguaAdjuntosChart({
    data,
    series,
    onAddSeries,
}: SicAguaAdjuntosChartProps) {
    const hasData = data && data.length > 0;

    let yMin = 0;
    let yMax = 5.0;
    let threshold = 2.5;

    if (hasData && series.length > 0) {
        const allValues = data.flatMap(dataPoint => series.map(seriesItem => dataPoint[`value_${seriesItem.id}`])).filter(value => typeof value === 'number') as number[];
        if (allValues.length > 0) {
            const maxVal = Math.max(...allValues);
            const minVal = Math.min(...allValues);
            const range = maxVal - minVal || maxVal * 0.2 || 1;
            
            const avg = allValues.reduce((a, b) => a + b, 0) / allValues.length;
            threshold = Number(avg.toFixed(4));
            
            yMin = Math.max(0, minVal - (range * 0.1));
            yMax = maxVal + (range * 0.1);
        }
    }

    return (
        <ChartCard 
            title="Relación Agua / Adjuntos (SIC)" 
            description="Relación total del Lote calculada como (Suma Máx Agua / Suma Máx Arroz)"
            icon={<Droplet className="h-5 w-5 text-blue-500" />}
            headerContent={
                <SeriesConfigPanel 
                    seriesList={series} 
                    onAddSeries={onAddSeries} 
                    hideStepParameterFilters={true} 
                    onlyShowRecipe={true}
                />
            }
        >
            {!hasData ? (
                <ChartPlaceholder 
                    icon={<Droplet className="h-full w-full" />}
                    title="No hay datos de Agua/Adjuntos para la configuración seleccionada."
                    description=""
                />
            ) : (
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} vertical={false} stroke="#94a3b8" />
                        <ReferenceLine y={threshold} stroke="#3b82f6" strokeDasharray="5 5" strokeWidth={1.5} label={{ position: 'top', value: `Media: ${threshold}`, fill: '#3b82f6', fontSize: 12 }} />

                        <XAxis
                            dataKey="batchId"
                            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                            axisLine={{ stroke: "hsl(var(--border))" }}
                            interval="preserveStartEnd"
                            angle={-45}
                            textAnchor="end"
                            height={60}
                            tickFormatter={(value) => `Lote ${truncateLabel(value, 10)}`}
                        />
                        <YAxis
                            domain={[yMin, yMax]}
                            type="number"
                            label={{ value: "Ratio (Hl/Kg)", angle: -90, position: "insideLeft", fill: "hsl(var(--muted-foreground))" }}
                            tick={{ fill: "hsl(var(--muted-foreground))" }}
                            tickFormatter={(value) => value.toFixed(4)}
                            axisLine={false}
                        />

                        <Tooltip
                            content={({ active, payload, label }) => {
                                if (!active || !payload || !payload.length) return null;
                                return (
                                    <div className="bg-slate-900 text-white p-3 rounded-md shadow-lg border border-slate-700 min-w-[220px]">
                                        <p className="font-semibold mb-2">Lote {label}</p>
                                        <div className="flex flex-col gap-3">
                                            {payload.map((entry: any, index: number) => {
                                                const seriesId = entry.dataKey.split('_')[1];
                                                const config = series.find(seriesItem => seriesItem.id === seriesId);
                                                if (!config || entry.value === undefined) return null;
                                                
                                                const aguaValue = entry.payload[`agua_${seriesId}`];
                                                const arrozValue = entry.payload[`arroz_${seriesId}`];

                                                return (
                                                    <div key={`item-${index}`} className="flex flex-col gap-1">
                                                        <div className="flex items-center gap-2 border-t border-slate-700 pt-2">
                                                            <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                                                            <span className="text-xs font-medium opacity-80">{config.recipe !== FILTER_ALL ? config.recipe : 'Todas'}:</span>
                                                            <span className="text-sm font-bold ml-auto">{entry.value.toFixed(4)}</span>
                                                        </div>
                                                        {aguaValue !== undefined && arrozValue !== undefined && (
                                                            <div className="text-[10px] text-slate-400 ml-5 flex flex-col">
                                                                <span>Suma Máx Agua: {aguaValue.toFixed(1)} Hl</span>
                                                                <span>Suma Máx Arroz: {arrozValue.toFixed(1)} Kg</span>
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
                        {series.map((seriesItem) => (
                            <Line
                                key={seriesItem.id}
                                type="monotone"
                                dataKey={`value_${seriesItem.id}`}
                                stroke={seriesItem.color}
                                strokeWidth={2}
                                name={`${seriesItem.recipe !== FILTER_ALL ? seriesItem.recipe : 'Todas las recetas'}`}
                                connectNulls={true}
                                isAnimationActive={false}
                                dot={{ r: 5, fill: "#111827", stroke: seriesItem.color, strokeWidth: 2 }}
                                activeDot={{ r: 8, strokeWidth: 0, fill: seriesItem.color }}
                            />
                        ))}
                    </LineChart>
                </ResponsiveContainer>
            )}
        </ChartCard>
    );
}