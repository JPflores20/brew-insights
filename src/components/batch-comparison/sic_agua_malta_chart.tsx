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
import { Waves } from "lucide-react";
import { FILTER_ALL } from "@/lib/constants";
import { SeriesConfig } from "@/types/series_config";
import { ChartCard } from "./chart-components/chart_card";
import { SeriesConfigPanel } from "./chart-components/series_config_panel";
import { ChartPlaceholder } from "./chart-components/chart_placeholder";

interface SicAguaMaltaChartProps {
    data: any[];
    series: SeriesConfig[];
    onAddSeries: () => void;
}

const truncateLabel = (value: any, max = 15) => {
    const stringValue = String(value ?? "");
    return stringValue.length > max ? stringValue.slice(0, max - 1) + "…" : stringValue;
};

export function SicAguaMaltaChart({
    data,
    series,
    onAddSeries,
}: SicAguaMaltaChartProps) {
    const hasData = data && data.length > 0;
    const isUnderConstruction = true; // Estado temporal: En construcción

    if (isUnderConstruction) {
        return (
            <ChartCard 
                title="Relación Agua / Malta (SIC)" 
                description="Relación (Hl Agua / Kg Malta) × 100 por cada evento de descarga."
                icon={<Waves className="h-5 w-5" />}
                isUnderConstruction={true}
            >
                <ChartPlaceholder 
                    isUnderConstruction={true}
                    icon={<Waves className="h-full w-full" />}
                    title="Gráfica en Construcción"
                    description="Esta visualización está temporalmente deshabilitada por mantenimiento y mejoras."
                />
            </ChartCard>
        );
    }

    let yMin = 0;
    let yMax = 10;
    let threshold = 3.0;

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
            title="Relación Agua / Malta (SIC)" 
            description="Relación (Hl Agua / Kg Malta) por cada evento de descarga."
            icon={<Waves className="h-5 w-5 text-cyan-500" />}
            headerContent={
                <SeriesConfigPanel 
                    seriesList={series} 
                    onAddSeries={onAddSeries} 
                    hideStepParameterFilters={true} 
                    onlyShowRecipe={true}
                />
            }
        >
            {series.length === 0 ? (
                <ChartPlaceholder 
                    icon={<Waves className="h-full w-full" />}
                    title="No hay series configuradas"
                    description="Haz clic en 'Añadir Serie' en el panel superior para comparar la relación Agua/Malta."
                />
            ) : !hasData ? (
                <ChartPlaceholder 
                    icon={<Waves className="h-full w-full" />}
                    title="No hay datos de Agua/Malta para la configuración seleccionada."
                    description="Es posible que los lotes de la receta seleccionada no tengan registros de agua o malta."
                />
            ) : (
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
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
                            tickFormatter={(value) => `Lote ${truncateLabel(value, 8)}`}
                        />
                        <YAxis
                            domain={[yMin, yMax]}
                            type="number"
                            label={{ value: "Ratio (Hl/Kg)", angle: -90, position: "insideLeft", fill: "hsl(var(--muted-foreground))" }}
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
                                                const config = series.find(seriesItem => seriesItem.id === seriesId);
                                                if (!config || entry.value === undefined) return null;
                                                
                                                const aguaVal = entry.payload[`agua_${seriesId}`];
                                                const maltaVal = entry.payload[`malta_${seriesId}`];

                                                return (
                                                    <div key={`item-${index}`} className="flex flex-col gap-1">
                                                        <div className="flex items-center gap-2 border-t border-slate-700 pt-2">
                                                            <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                                                            <span className="text-xs font-medium opacity-80">{config.recipe !== FILTER_ALL ? config.recipe : 'Todas'}:</span>
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
