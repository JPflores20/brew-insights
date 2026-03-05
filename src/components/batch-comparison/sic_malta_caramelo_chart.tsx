import { useMemo } from "react";
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

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

import { BatchRecord, SeriesItem } from "@/types";
import { FILTER_ALL, CHART_COLORS } from "@/lib/constants";
import { useSicMaltaCaramelo } from "@/hooks/use_batch_comparison/use_sic_malta_caramelo";

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
  // Hook for calculated ratio data
  const { chartData } = useSicMaltaCaramelo(data, series);

  // Calcula límites y Media (Promedio) para la UI
  const stats = useMemo(() => {
    if (!chartData || chartData.length === 0) return { min: 0, max: 100, threshold: 0 };
    
    let allValues: number[] = [];
    chartData.forEach(p => {
      series.forEach(s => {
        const val = p[`value_${s.id}`];
        if (typeof val === 'number') allValues.push(val);
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

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;

    const dataPoint = payload[0].payload;

    return (
      <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg shadow-xl text-sm min-w-[280px]">
        <p className="font-semibold text-slate-100 mb-2 border-b border-slate-800 pb-2">
          Lote: {label}
        </p>
        <p className="text-slate-400 text-xs mb-3">{dataPoint.date}</p>
        
        {payload.map((entry: any, index: number) => {
          const seriesId = entry.dataKey.replace('value_', '');
          const config = series.find(s => s.id === seriesId);
          const color = entry.color;
          const matchName = config 
            ? `${config.recipe === FILTER_ALL ? 'Todas las Recetas' : config.recipe}`
            : `Serie ${index + 1}`;
          
          const ratioVal = entry.value;
          const cloVal = dataPoint[`clo_${seriesId}`] || 0;
          const amM2bVal = dataPoint[`am_m2b_${seriesId}`] || 0;

          return (
            <div key={index} className="mb-3 last:mb-0">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                <span className="font-medium text-slate-200">{matchName}</span>
              </div>
              
              <div className="pl-4 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                <span className="text-slate-400">Proporción:</span>
                <span className="text-right font-mono text-slate-200 font-bold">{ratioVal}%</span>
                
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
  };

  return (
    <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-sm mt-6">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Droplets className="h-5 w-5 text-amber-500" />
          <CardTitle>Proporción de Malta Caramelo (SIC)</CardTitle>
        </div>
        <CardDescription>
          (Reclamo Malta / Descarga) * 100
        </CardDescription>
      </CardHeader>

      <CardContent>
        {/* Series Management */}
        <div className="space-y-4 mb-8">
          {series.map((s, index) => (
            <div key={s.id} className="flex flex-col sm:flex-row gap-3 items-start sm:items-center bg-slate-900/80 p-3 rounded-lg border border-slate-800">
              <div className="flex items-center gap-2">
                <div 
                  className="w-4 h-4 rounded-full shadow-sm"
                  style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                />
              </div>

              {/* Selector de Receta */}
              <div className="flex-1 min-w-[200px]">
                <Select
                  value={s.recipe}
                  onValueChange={(val) => updateSeries(s.id, "recipe", val)}
                >
                  <SelectTrigger className="bg-slate-950 border-slate-800">
                    <SelectValue placeholder="Seleccionar Receta" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-800">
                    <SelectItem value={FILTER_ALL}>Todas las Recetas</SelectItem>
                    {uniqueRecipes.map((r) => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {series.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-slate-500 hover:text-red-400 hover:bg-slate-800"
                  onClick={() => removeSeries(s.id)}
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
            <Plus className="h-4 w-4 mr-2" />
            Añadir Serie
          </Button>
        </div>

        {/* Chart Area */}
        <div className="h-[400px] w-full">
          {chartData && chartData.length > 0 ? (
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
                  tickFormatter={(val: string) => {
                    const match = val.match(/\d+$/);
                    return match ? `#${match[0]}` : val.substring(0, 6);
                  }}
                />
                <YAxis 
                  domain={[stats.min, stats.max]}
                  stroke="#94a3b8"
                  fontSize={12}
                  tickFormatter={(val) => `${val}%`}
                />
                <Tooltip content={<CustomTooltip />} />
                
                {/* Reference line for the average */}
                {stats.threshold > 0 && (
                  <ReferenceLine 
                    y={stats.threshold} 
                    stroke="#fbbf24" 
                    strokeDasharray="4 4"
                    label={{
                      position: 'insideTopLeft',
                      value: `Media: ${stats.threshold.toFixed(2)}%`,
                      fill: '#fbbf24',
                      fontSize: 12
                    }}
                  />
                )}

                {/* Highlight area below the threshold */}
                <ReferenceArea 
                  y1={stats.min} 
                  y2={stats.threshold > 0 ? stats.threshold : undefined} 
                  fill="#fbbf24" 
                  fillOpacity={0.03} 
                />

                {series.map((s, index) => (
                  <Line
                    key={s.id}
                    type="monotone"
                    dataKey={`value_${s.id}`}
                    name={`Serie ${index + 1}`}
                    stroke={CHART_COLORS[index % CHART_COLORS.length]}
                    strokeWidth={3}
                    dot={{ fill: CHART_COLORS[index % CHART_COLORS.length], r: 4, strokeWidth: 2, stroke: '#1e293b' }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-slate-800 rounded-xl">
              <Droplets className="h-8 w-8 mb-2 opacity-50" />
              <p>No hay datos de Malta/Descarga para la receta seleccionada.</p>
              <p className="text-sm">Asegúrate de que los lotes tengan registros CLO y AM M2B.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
