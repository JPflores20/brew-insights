import { useState, useMemo } from "react";
import { BatchRecord } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { ChartTooltip } from "@/components/ui/chart_tooltip";
import { cn } from "@/lib/utils";
import { FILTER_ALL } from "@/lib/constants";

interface RecipeDeviationChartProps {
  data: BatchRecord[];
  recipeNames: string[];
  selectedRecipe: string | FILTER_ALL;
  setSelectedRecipe: (recipe: string | FILTER_ALL) => void;
  selectedMaterialName: string;
  setSelectedMaterialName: (name: string) => void;
}
export function RecipeDeviationChart({ data, recipeNames, selectedRecipe, setSelectedRecipe, selectedMaterialName, setSelectedMaterialName }: RecipeDeviationChartProps) {
  const [selectedMaterialUnit, setSelectedMaterialUnit] = useState<string>(FILTER_ALL);
  const chartData = useMemo(() => {
    let filteredData = data;
    if (selectedRecipe !== FILTER_ALL) {
        filteredData = data.filter(d => d.productName === selectedRecipe);
    }
    const materialMap = new Map<string, { exp: number, real: number, unit: string }>();
    filteredData.forEach(batch => {
        batch.materials.forEach(mat => {
            const matKey = `${mat.name} (${mat.unit})`;
            if (selectedMaterialUnit !== FILTER_ALL && mat.unit !== selectedMaterialUnit) return;
            if (selectedMaterialName !== FILTER_ALL && mat.name !== selectedMaterialName) return;
            if (!materialMap.has(matKey)) {
                materialMap.set(matKey, { exp: 0, real: 0, unit: mat.unit });
            }
            const current = materialMap.get(matKey)!;
            current.exp += mat.totalExpected;
            current.real += mat.totalReal;
        });
    });
    const result = Array.from(materialMap.entries()).map(([name, vals]) => ({
        name,
        "Total Esperado": parseFloat(vals.exp.toFixed(2)),
        "Total Real": parseFloat(vals.real.toFixed(2)),
        unit: vals.unit
    }));
    return result.sort((a,b) => b["Total Real"] - a["Total Real"]);
  }, [data, selectedRecipe, selectedMaterialUnit, selectedMaterialName]);
  const uniqueUnits = useMemo(() => {
      const units = new Set<string>();
      data.forEach(batch => batch.materials.forEach(mat => units.add(mat.unit)));
      return Array.from(units).sort();
  }, [data]);
  const uniqueNames = useMemo(() => {
    const names = new Set<string>();
    data.forEach(batch => batch.materials.forEach(mat => names.add(mat.name)));
    return Array.from(names).sort();
  }, [data]);
  return (
    <Card className="bg-card shadow-sm border-border flex flex-col overflow-hidden">
      <CardHeader className="flex flex-col md:flex-row items-start justify-between pb-4 gap-4">
        <div className="space-y-1 md:max-w-[40%]">
            <CardTitle className="text-xl font-semibold text-foreground">
              Desviación por Material
            </CardTitle>
            <CardDescription>
                Compara las cantidades objetivo del diseño de receta (SW) vs el consumo real en operación (IW).
            </CardDescription>
        </div>
        <div className="flex flex-wrap items-center gap-3">
            <Select value={selectedRecipe} onValueChange={setSelectedRecipe}>
                <SelectTrigger className="w-[180px] h-9">
                    <SelectValue placeholder="Todas las Recetas" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value={FILTER_ALL}>Todas las Recetas</SelectItem>
                    {recipeNames.map(r => (
                        <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <Select value={selectedMaterialName} onValueChange={setSelectedMaterialName}>
                <SelectTrigger className="w-[180px] h-9">
                    <SelectValue placeholder="Todos los Materiales" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value={FILTER_ALL}>Todos los Materiales</SelectItem>
                    {uniqueNames.map(n => (
                        <SelectItem key={n} value={n}>{n}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <Select value={selectedMaterialUnit} onValueChange={setSelectedMaterialUnit}>
                <SelectTrigger className="w-[140px] h-9">
                    <SelectValue placeholder="Tipo Unidad" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value={FILTER_ALL}>Todas (kg/hl/l..)</SelectItem>
                    {uniqueUnits.map(u => (
                        <SelectItem key={u} value={u}>Solo {u}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
      </CardHeader>
      <CardContent className="p-6 pt-0">
         {chartData.length > 0 ? (
            <div className="w-full h-[400px] mt-4">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={chartData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} vertical={false}/>
                        <XAxis
                            dataKey="name"
                            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                            axisLine={{ stroke: 'hsl(var(--border))' }}
                            tickLine={false}
                            interval={0}
                            angle={-45}
                            textAnchor="end"
                            height={80}
                        />
                        <YAxis
                            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={(value) => value.toLocaleString('es-MX')}
                        />
                        <Tooltip content={<ChartTooltip indicator="line" />} cursor={{ fill: 'hsl(var(--muted)/0.4)' }} />
                        <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
                        <Bar dataKey="Total Esperado" fill="hsl(var(--chart-expected))" radius={[4, 4, 0, 0]} maxBarSize={60} />
                        <Bar dataKey="Total Real" fill="hsl(var(--chart-real))" radius={[4, 4, 0, 0]} maxBarSize={60} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
         ) : (
            <div className="flex items-center justify-center h-[400px] w-full text-muted-foreground">
                No hay datos de consumo de materiales para la selección actual.
            </div>
         )}
      </CardContent>
    </Card>
  );
}
