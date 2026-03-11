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
import { TrendingUp } from "lucide-react";
import { FILTER_ALL } from "@/lib/constants";
import { PARAM_TIME } from "@/hooks/use_batch_comparison/bc_utils";
import { SeriesConfig } from "@/types/series_config";
import { ChartCard } from "./chart-components/chart_card";
import { SeriesConfigPanel } from "./chart-components/series_config_panel";
import { ChartPlaceholder } from "./chart-components/chart_placeholder";

interface SicTemperatureChartProps {
    data: any[];
    selectedTempIndices: number[];
    setSelectedTempIndices: React.Dispatch<React.SetStateAction<number[]>>;
    series: SeriesConfig[];
    onAddSeries: () => void;
}

const truncateLabel = (value: any, max = 15) => {
    const stringValue = String(value ?? "");
    return stringValue.length > max ? stringValue.slice(0, max - 1) + "…" : stringValue;
};

export function SicTemperatureChart({
    data,
    selectedTempIndices,
    setSelectedTempIndices,
    series,
    onAddSeries,
}: SicTemperatureChartProps) {
    const hasData = data && data.length > 0;
    const isUnderConstruction = true; // Estado temporal: En construcción

    if (isUnderConstruction) {
        return (
            <ChartCard 
                title="Gráfica SIC (Control de Intervalo Corto)" 
                description="Evolución de la temperatura a lo largo del tiempo, por lote producido"
                icon={<TrendingUp className="h-5 w-5" />}
                isUnderConstruction={true}
            >
                <ChartPlaceholder 
                    isUnderConstruction={true}
                    icon={<TrendingUp className="h-full w-full" />}
                    title="Gráfica en Construcción"
                    description="Esta visualización está temporalmente deshabilitada por mantenimiento y mejoras."
                />
            </ChartCard>
        );
    }

    // Lógica para auto-calcular el rango "Gris" y "Azul" del SIC
    let yMin = 0;
    let yMax = 100;
    let threshold = 75;

    if (hasData && series.length > 0) {
        const allValues = data.flatMap(dataPoint => series.map(seriesItem => dataPoint[`value_${seriesItem.id}`])).filter(value => typeof value === 'number') as number[];
        if (allValues.length > 0) {
            const maxVal = Math.max(...allValues);
            const minVal = Math.min(...allValues);
            const range = maxVal - minVal || maxVal * 0.2 || 10;
            
            threshold = Math.floor(minVal - (range * 0.8));
            yMin = Math.floor(threshold - (range * 0.5));
            yMax = Math.ceil(maxVal + (range * 0.5));
        }
    }

    return (
        <ChartCard 
            title="Gráfica SIC (Control de Intervalo Corto)" 
            description="Evolución de la temperatura a lo largo del tiempo, por lote producido (Eje X: Número de Lote)"
            icon={<TrendingUp className="h-5 w-5 text-primary" />}
            headerContent={
                <SeriesConfigPanel seriesList={series} onAddSeries={onAddSeries} />
            }
        >
            {!hasData ? (
                <ChartPlaceholder 
                    icon={<TrendingUp className="h-full w-full" />}
                    title="No hay datos disponibles para la configuración seleccionada."
                    description="Asegúrate de haber seleccionado un equipo o receta válidos."
                />
            ) : (
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                        data={data}
                        margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
                        onClick={(dataObj) => {
                            if (dataObj && dataObj.activeTooltipIndex !== undefined) {
                                const index = dataObj.activeTooltipIndex;
                                setSelectedTempIndices((prev) =>
                                    prev.includes(index)
                                        ? prev.filter((i) => i !== index)
                                        : [...prev, index]
                                );
                            }
                        }}
                    >
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
                            label={{ value: data[0]?.unit || "Valor", angle: -90, position: "insideLeft", fill: "hsl(var(--muted-foreground))" }}
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
                                                const config = series.find(seriesItem => seriesItem.id === seriesId);
                                                if (!config) return null;
                                                
                                                const duration = entry.payload[`duration_${seriesId}`];

                                                return (
                                                    <div key={`item-${index}`} className="flex flex-col gap-1">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
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
                        {series.map((seriesItem) => (
                            <Line
                                key={seriesItem.id}
                                type="monotone"
                                dataKey={`value_${seriesItem.id}`}
                                stroke={seriesItem.color}
                                strokeWidth={2}
                                name={`${seriesItem.machine !== FILTER_ALL ? seriesItem.machine : 'Todos los eq.'} - ${seriesItem.recipe !== FILTER_ALL ? seriesItem.recipe : 'Todas las rec.'}`}
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
