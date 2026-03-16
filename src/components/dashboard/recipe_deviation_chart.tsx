import { useState, useMemo, useEffect } from "react";
import { BatchRecord } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MultiSelect } from "@/components/ui/multi_select";
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
  selectedRecipe: string | typeof FILTER_ALL;
  setSelectedRecipe: (recipe: string | typeof FILTER_ALL) => void;
  selectedMaterialNames: string[];
  setSelectedMaterialNames: (names: string[]) => void;
}

const getBatchLine = (batch: BatchRecord): string => {
  const validLines = ["1", "2", "3", "4"];

  if (batch.TEILANL_GRUPO) {
      const match = batch.TEILANL_GRUPO.match(/(\d+)\s*$/);
      if (match && validLines.includes(match[1])) return match[1];
  }
  
  if (batch.steps && batch.steps.length > 0) {
      for (const step of batch.steps) {
          const match = step.stepName.match(/(\d+)\s*$/);
          if (match && validLines.includes(match[1])) return match[1];
      }
  }
  
  return "1";
};

export function RecipeDeviationChart({ 
  data, 
  recipeNames, 
  selectedRecipe, 
  setSelectedRecipe, 
  selectedMaterialNames, 
  setSelectedMaterialNames 
}: RecipeDeviationChartProps) {
  // Inicializamos todos los estados locales en blanco ("") para que los selectores muestren su placeholder
  const [selectedMaterialUnit, setSelectedMaterialUnit] = useState<string>("");
  const [selectedBatch, setSelectedBatch] = useState<string>("");
  const [selectedLine, setSelectedLine] = useState<string>("");

  // Forzamos a que la receta general (que viene del padre) también arranque en blanco al cargar la página
  useEffect(() => {
    if (selectedRecipe === FILTER_ALL) {
      setSelectedRecipe("");
    }
  }, []);

  // Reiniciar filtros en cascada si cambia la receta seleccionada
  useEffect(() => {
    setSelectedLine("");
    setSelectedBatch("");
  }, [selectedRecipe]);

  const availableLines = useMemo(() => {
    if (!selectedRecipe || selectedRecipe === "") return [];

    let baseData = data;
    if (selectedRecipe !== FILTER_ALL) {
      baseData = data.filter(d => d.productName === selectedRecipe);
    }
    const lines = new Set<string>();
    baseData.forEach(d => {
      lines.add(getBatchLine(d));
    });
    return Array.from(lines).sort((a, b) => parseInt(a) - parseInt(b));
  }, [data, selectedRecipe]);

  const availableBatches = useMemo(() => {
    if (!selectedRecipe || selectedRecipe === "") return [];
    if (!selectedLine || selectedLine === "") return [];

    let baseData = data;
    if (selectedRecipe !== FILTER_ALL) {
      baseData = baseData.filter(d => d.productName === selectedRecipe);
    }
    if (selectedLine !== FILTER_ALL) {
      baseData = baseData.filter(d => getBatchLine(d) === selectedLine);
    }
    
    const batchMap = new Map<string, string>();
    baseData.forEach(d => {
      if (d.CHARG_NR && !batchMap.has(d.CHARG_NR)) {
        batchMap.set(d.CHARG_NR, d.productName || "Desconocido");
      }
    });
    
    return Array.from(batchMap.entries())
      .map(([batch, productName]) => ({ batch, productName }))
      .sort((a, b) => a.batch.localeCompare(b.batch));
  }, [data, selectedRecipe, selectedLine]);

  // Modificamos el filtro maestro para devolver un arreglo vacío si faltan selecciones obligatorias
  const baseFilteredData = useMemo(() => {
    if (!selectedRecipe || selectedRecipe === "") return [];
    if (!selectedLine || selectedLine === "") return [];
    if (!selectedBatch || selectedBatch === "") return [];

    let filtered = data;
    if (selectedRecipe !== FILTER_ALL) {
        filtered = filtered.filter(d => d.productName === selectedRecipe);
    }
    if (selectedLine !== FILTER_ALL) {
        filtered = filtered.filter(d => getBatchLine(d) === selectedLine);
    }
    if (selectedBatch !== FILTER_ALL) {
        filtered = filtered.filter(d => d.CHARG_NR === selectedBatch);
    }
    return filtered;
  }, [data, selectedRecipe, selectedLine, selectedBatch]);

  const uniqueNames = useMemo(() => {
    const names = new Set<string>();
    baseFilteredData.forEach(batch => batch.materials.forEach(mat => names.add(mat.name)));
    return Array.from(names).sort();
  }, [baseFilteredData]);

  const uniqueUnits = useMemo(() => {
      const units = new Set<string>();
      baseFilteredData.forEach(batch => batch.materials.forEach(mat => units.add(mat.unit)));
      return Array.from(units).sort();
  }, [baseFilteredData]);

  const chartData = useMemo(() => {
    if (baseFilteredData.length === 0) return [];

    const materialMap = new Map<string, { exp: number, real: number, unit: string, name: string }>();
    
    baseFilteredData.forEach(batch => {
        batch.materials.forEach(mat => {
            const matKey = `${mat.name} (${mat.unit})`;
            
            if (selectedMaterialUnit !== FILTER_ALL && selectedMaterialUnit !== "" && mat.unit !== selectedMaterialUnit) return;
            if (selectedMaterialNames.length > 0 && !selectedMaterialNames.includes(mat.name)) return;
            
            if (!materialMap.has(matKey)) {
                materialMap.set(matKey, { exp: 0, real: 0, unit: mat.unit, name: mat.name });
            }
            const current = materialMap.get(matKey)!;
            current.exp += mat.totalExpected;
            current.real += mat.totalReal;
        });
    });

    const result = Array.from(materialMap.entries()).map(([key, vals]) => ({
        name: key,
        displayName: vals.name,
        "Setpoint": parseFloat(vals.exp.toFixed(2)),
        "Total Real": parseFloat(vals.real.toFixed(2)),
        unit: vals.unit
    }));

    return result.sort((a,b) => b["Total Real"] - a["Total Real"]);
  }, [baseFilteredData, selectedMaterialUnit, selectedMaterialNames]);

  const handleLineChange = (val: string) => {
    setSelectedLine(val);
    setSelectedBatch(""); 
    setSelectedMaterialNames([]);
    setSelectedMaterialUnit("");
  };

  const handleBatchChange = (val: string) => {
      setSelectedBatch(val);
      setSelectedMaterialNames([]);
      setSelectedMaterialUnit("");
  };

  // Condición para saber si mostramos el mensaje de inicio
  const isSelectionIncomplete = !selectedRecipe || selectedRecipe === "" || !selectedLine || selectedLine === "" || !selectedBatch || selectedBatch === "";

  return (
    <Card className="bg-card shadow-sm border-border flex flex-col overflow-hidden">
      <CardHeader className="flex flex-col xl:flex-row items-start justify-between pb-4 gap-4">
        <div className="space-y-1 xl:max-w-[20%]">
            <CardTitle className="text-xl font-semibold text-foreground">
              Desviación por Material
            </CardTitle>
            <CardDescription>
                Compara las cantidades objetivo del diseño de receta (SW) vs el consumo real en operación (IW).
            </CardDescription>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 xl:max-w-[80%] justify-end">
            
            <Select value={selectedRecipe} onValueChange={setSelectedRecipe}>
                <SelectTrigger className="w-[160px] h-9">
                    <SelectValue placeholder="Seleccionar Receta" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value={FILTER_ALL}>Todas las Recetas</SelectItem>
                    {recipeNames.map(r => (
                        <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                </SelectContent>
            </Select>

            {/* Selector de Línea (bloqueado si no hay receta) */}
            <Select value={selectedLine} onValueChange={handleLineChange} disabled={!selectedRecipe || selectedRecipe === ""}>
                <SelectTrigger className="w-[150px] h-9">
                    <SelectValue placeholder="Seleccionar Casa" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value={FILTER_ALL}>Todas (Casas)</SelectItem>
                    {availableLines.map(line => (
                        <SelectItem key={line} value={line}>
                            Casa {line}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            {/* Selector de Lote (bloqueado si no hay Casa) */}
            <Select value={selectedBatch} onValueChange={handleBatchChange} disabled={!selectedLine || selectedLine === ""}>
                <SelectTrigger className="w-[180px] h-9">
                    <SelectValue placeholder="Seleccionar Lote" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value={FILTER_ALL}>Todos los Lotes</SelectItem>
                    {availableBatches.map(({ batch, productName }) => (
                        <SelectItem key={batch} value={batch}>
                            {batch} {productName}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            
            <MultiSelect 
                options={uniqueNames}
                selected={selectedMaterialNames}
                onChange={setSelectedMaterialNames}
                placeholder="Todos los Materiales"
                className="w-[200px]"
            />

            {/* Selector de Unidad (bloqueado si no hay lote) */}
            <Select value={selectedMaterialUnit} onValueChange={setSelectedMaterialUnit} disabled={!selectedBatch || selectedBatch === ""}>
                <SelectTrigger className="w-[130px] h-9">
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
         {isSelectionIncomplete ? (
            <div className="flex items-center justify-center h-[400px] w-full text-muted-foreground text-center px-4 border-2 border-dashed rounded-lg">
                Selecciona una Receta, una Casa y un Lote en los filtros superiores para comenzar a visualizar el consumo de materiales.
            </div>
         ) : chartData.length > 0 ? (
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
                        <Bar 
                          dataKey="Setpoint" 
                          fill="hsl(var(--chart-expected))" 
                          radius={[4, 4, 0, 0]} 
                          maxBarSize={60} 
                        />
                        <Bar 
                          dataKey="Total Real" 
                          fill="hsl(var(--chart-real))" 
                          radius={[4, 4, 0, 0]} 
                          maxBarSize={60} 
                        />
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