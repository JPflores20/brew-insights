import React, { useMemo, useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from "recharts";
import { Layers, Search } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { BatchRecord } from "@/types";
import { CHART_COLORS } from "@/lib/constants";
import { ChartCard } from "./chart-components/chart_card";
import { ChartPlaceholder } from "./chart-components/chart_placeholder";
import { MultiSelect } from "@/components/ui/multi_select";

interface MostoVolumeChartProps {
  data: BatchRecord[];
}

export function MostoVolumeChart({ data }: MostoVolumeChartProps) {
  const [selectedRecipe, setSelectedRecipe] = useState<string>("all_recipes");

  // Unique recipes from data
  const uniqueRecipes = useMemo(() => {
    return Array.from(new Set(data.map(d => d.productName).filter(Boolean))).sort();
  }, [data]);

  // Final chart data
  const chartData = useMemo(() => {
    let filtered = data.filter(d => (d.mosto_volume_hl || 0) > 0);
    
    if (selectedRecipe !== "all_recipes") {
      filtered = filtered.filter(d => d.productName === selectedRecipe);
    }

    return filtered
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .map(d => ({
        batchId: d.CHARG_NR,
        value: d.mosto_volume_hl || 0,
        recipe: d.productName,
        timestamp: d.timestamp,
        date: new Date(d.timestamp).toLocaleString()
      }));
  }, [data, selectedRecipe]);

  const hasData = chartData.length > 0;

  return (
    <div className="mt-6">
      <ChartCard
        title="Volumen de Coctos (Mosto)"
        description="Valor IW_DFM2 del paso 'DLM PRIMERO Most.'"
        icon={<Layers className="h-5 w-5 text-emerald-500" />}
        headerContent={
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="w-full sm:w-[300px]">
              <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Filtrar por Receta</label>
              <Select
                value={selectedRecipe}
                onValueChange={setSelectedRecipe}
              >
                <SelectTrigger className="bg-slate-950 border-slate-800">
                  <SelectValue placeholder="Seleccionar Receta" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800">
                  <SelectItem value="all_recipes">Todas las Recetas</SelectItem>
                  {uniqueRecipes.map((recipe) => (
                    <SelectItem key={recipe} value={recipe}>{recipe}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        }
      >
        {!hasData ? (
          <ChartPlaceholder
            icon={<Layers className="h-full w-full" />}
            title="Sin datos de volumen"
            description="No se encontraron registros con el paso 'DLM PRIMERO Most.' en los lotes seleccionados."
          />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis
                dataKey="batchId"
                stroke="#94a3b8"
                fontSize={12}
                tickMargin={10}
                tickFormatter={(value) => {
                  const match = value.match(/\d+$/);
                  return match ? `#${match[0]}` : value.substring(0, 6);
                }}
              />
              <YAxis
                stroke="#94a3b8"
                fontSize={12}
                tickFormatter={(value) => `${value} hl`}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload || !payload.length) return null;
                  const d = payload[0].payload;
                  return (
                    <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg shadow-xl text-sm min-w-[200px]">
                      <p className="font-semibold text-slate-100 mb-1 border-b border-slate-800 pb-1">Lote: {label}</p>
                      <p className="text-emerald-400 font-mono text-lg mb-1">{d.value.toLocaleString()} hl</p>
                      <p className="text-slate-400 text-xs mb-1">Receta: {d.recipe}</p>
                      <p className="text-slate-500 text-[10px]">{d.date}</p>
                    </div>
                  );
                }}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={CHART_COLORS[index % CHART_COLORS.length]} 
                    fillOpacity={0.8}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>
    </div>
  );
}
