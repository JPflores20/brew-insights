import React, { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceArea,
  ReferenceLine,
} from "recharts";
import { Droplets, Plus, Trash2 } from "lucide-react"; 
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

import { BatchRecord, SeriesItem } from "@/types";
import { FILTER_ALL, CHART_COLORS } from "@/lib/constants";
import { useSicMaltaCaramelo } from "@/hooks/use_batch_comparison/use_sic_malta_caramelo";
import { ChartCard } from "./chart-components/chart_card";
import { ChartPlaceholder } from "./chart-components/chart_placeholder";

interface SicMaltaCarameloChartProps {
  data: BatchRecord[];
  series: SeriesItem[];
  addSeries: () => void;
  updateSeries: (id: string, field: keyof SeriesItem, value: string) => void;
  removeSeries: (id: string) => void;
  uniqueRecipes: string[];
}

export function SicMaltaCarameloChart({
  data,
  series,
  addSeries,
  updateSeries,
  removeSeries,
  uniqueRecipes,
}: SicMaltaCarameloChartProps) {
  const { chartData } = useSicMaltaCaramelo(data, series);

  const stats = useMemo(() => {
    if (!chartData || chartData.length === 0) return { min: 0, max: 100, threshold: 0 };
    
    let allValues: number[] = [];
    chartData.forEach(dataPoint => {
      series.forEach(seriesItem => {
        const value = dataPoint[`value_${seriesItem.id}`];
        if (typeof value === 'number') allValues.push(value);
      });
    });

    if (allValues.length === 0) return { min: 0, max: 100, threshold: 0 };

    const maxVal = Math.max(...allValues);
    const minVal = Math.min(...allValues);
    const avg = allValues.reduce((a, b) => a + b, 0) / allValues.length;

    return {
      min: Math.max(0, minVal - 1),
      max: maxVal + 1,
      threshold: avg
    };
  }, [chartData, series]);

  const hasData = chartData && chartData.length > 0;

  return (
    <div className="mt-6">
        <ChartCard
            title="Proporción de Malta Caramelo (SIC)"
            description="(Reclamo Malta / Descarga) * 100"
            icon={<Droplets className="h-5 w-5 text-amber-500" />}
            headerContent={
                <div className="space-y-4 mb-4">
                  {series.map((seriesItem, index) => (
                    <div key={seriesItem.id} className="flex flex-col sm:flex-row gap-3 items-start sm:items-center bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-4 h-4 rounded-full shadow-sm"
                          style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                        />
                      </div>
                      <div className="flex-1 min-w-[200px]">
                        <Select
                          value={seriesItem.recipe}
                          onValueChange={(val) => updateSeries(seriesItem.id, "recipe", val)}
                        >
                          <SelectTrigger className="bg-slate-950 border-slate-800">
                            <SelectValue placeholder="Seleccionar Receta" />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-900 border-slate-800">
                            <SelectItem value={FILTER_ALL}>Todas las Recetas</SelectItem>
                            {uniqueRecipes.map((recipeItem) => (
                              <SelectItem key={recipeItem} value={recipeItem}>{recipeItem}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
        
                      {series.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-slate-500 hover:text-red-400 hover:bg-slate-800"
                          onClick={() => removeSeries(seriesItem.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
        
                  <Button
                    variant="outline"
                    className="w-full sm:w-auto border-dashed border-slate-700 hover:border-slate-500 text-slate-400 hover:text-slate-300 bg-transparent hover:bg-slate-800"
                    onClick={addSeries}
                  >
                    <Plus className="h-4 w-4 mr-2" /> Añadir Serie
                  </Button>
                </div>
            }
        >
            {!hasData ? (
                <ChartPlaceholder 
                    icon={<Droplets className="h-full w-full" />}
                    title="No hay datos de Malta/Descarga para la receta seleccionada."
                    description="Asegúrate de que los lotes tengan registros CLO y AM M2B."
                />
            ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={chartData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                    <XAxis 
                      dataKey="batchId" 
                      stroke="#94a3b8"
                      fontSize={12}
                      tickMargin={10}
                      tickFormatter={(value: string) => {
                        const match = value.match(/\d+$/);
                        return match ? `#${match[0]}` : value.substring(0, 6);
                      }}
                    />
                    <YAxis 
                      domain={[stats.min, stats.max]}
                      stroke="#94a3b8"
                      fontSize={12}
                      tickFormatter={(value) => `${value}%`}
                    />
                    <Tooltip 
                        content={({ active, payload, label }) => {
                            if (!active || !payload || !payload.length) return null;
                            const dataPoint = payload[0].payload;
                            return (
                                <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg shadow-xl text-sm min-w-[280px]">
                                    <p className="font-semibold text-slate-100 mb-2 border-b border-slate-800 pb-2">Lote: {label}</p>
                                    <p className="text-slate-400 text-xs mb-3">{dataPoint.date}</p>
                                    {payload.map((entry: any, index: number) => {
                                        const seriesId = entry.dataKey.replace('value_', '');
                                        const config = series.find(seriesItem => seriesItem.id === seriesId);
                                        const cloVal = dataPoint[`clo_${seriesId}`] || 0;
                                        const amM2bVal = dataPoint[`am_m2b_${seriesId}`] || 0;
                                        const matchName = config 
                                            ? `${config.recipe === FILTER_ALL ? 'Todas las Recetas' : config.recipe}`
                                            : `Serie ${index + 1}`;
                            
                                        return (
                                            <div key={index} className="mb-3 last:mb-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                                                    <span className="font-medium text-slate-200">{matchName}</span>
                                                </div>
                                                <div className="pl-4 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                                                    <span className="text-slate-400">Proporción:</span>
                                                    <span className="text-right font-mono text-slate-200 font-bold">{entry.value}%</span>
                                                    <span className="text-slate-500">Reclamo Malta:</span>
                                                    <span className="text-right font-mono text-slate-400">{cloVal.toLocaleString()} kg</span>
                                                    <span className="text-slate-500">Descarga:</span>
                                                    <span className="text-right font-mono text-slate-400">{amM2bVal.toLocaleString()} kg</span>
                                                </div>
                                            </div>
                                        );
                                  })}
                                </div>
                            );
                        }}
                    />
                    
                    {stats.threshold > 0 && (
                      <ReferenceLine 
                        y={stats.threshold} 
                        stroke="#fbbf24" 
                        strokeDasharray="4 4"
                        label={{ position: 'insideTopLeft', value: `Media: ${stats.threshold.toFixed(2)}%`, fill: '#fbbf24', fontSize: 12 }}
                      />
                    )}
    
                    <ReferenceArea y1={stats.min} y2={stats.threshold > 0 ? stats.threshold : undefined} fill="#fbbf24" fillOpacity={0.03} />
    
                    {series.map((seriesItem, index) => (
                      <Line
                        key={seriesItem.id}
                        type="monotone"
                        dataKey={`value_${seriesItem.id}`}
                        name={`Serie ${index + 1}`}
                        stroke={CHART_COLORS[index % CHART_COLORS.length]}
                        strokeWidth={3}
                        dot={{ fill: CHART_COLORS[index % CHART_COLORS.length], r: 4, strokeWidth: 2, stroke: '#1e293b' }}
                        activeDot={{ r: 6, strokeWidth: 0 }}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
            )}
        </ChartCard>
    </div>
  );
}
