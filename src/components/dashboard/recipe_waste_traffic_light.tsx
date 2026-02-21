import { useMemo } from "react";
import { BatchRecord } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Target, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { FILTER_ALL } from "@/lib/constants";

interface RecipeWasteTrafficLightProps {
  data: BatchRecord[];
  onSelectRecipe: (recipe: string | 'ALL') => void;
  selectedRecipe: string | 'ALL';
}
interface RecipeWasteStatus {
    name: string;
    totalExpected: number;
    totalReal: number;
    delta: number;
    percentDeviation: number;
    status: "good" | "warning" | "danger" | "no-data";
}
export function RecipeWasteTrafficLight({ data, onSelectRecipe, selectedRecipe }: RecipeWasteTrafficLightProps) {
  const recipeData: RecipeWasteStatus[] = useMemo(() => {
    const rawMap = new Map<string, { exp: number, real: number }>();
    data.forEach(batch => {
        const name = batch.productName || "Desconocido";
        if (!rawMap.has(name)) rawMap.set(name, { exp: 0, real: 0 });
        const current = rawMap.get(name)!;
        batch.materials.forEach(mat => {
            current.exp += mat.totalExpected;
            current.real += mat.totalReal;
        });
    });
    const result: RecipeWasteStatus[] = [];
    rawMap.forEach((vals, name) => {
        const delta = vals.real - vals.exp;
        const pct = vals.exp > 0 ? (delta / vals.exp) * 100 : 0;
        let status: RecipeWasteStatus["status"] = "good";
        if (vals.exp === 0) status = "no-data";
        else if (pct > 5) status = "danger";
        else if (pct > 2) status = "warning";
        result.push({
            name,
            totalExpected: vals.exp,
            totalReal: vals.real,
            delta,
            percentDeviation: pct,
            status
        });
    });
    return result.sort((a,b) => b.percentDeviation - a.percentDeviation);
  }, [data]);
  const getStatusColor = (status: RecipeWasteStatus["status"]) => {
      switch(status) {
          case "danger": return "bg-red-500/10 text-red-600 border-red-500/20";
          case "warning": return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
          case "good": return "bg-green-500/10 text-green-600 border-green-500/20";
          default: return "bg-gray-500/10 text-gray-600 border-gray-500/20";
      }
  };
  const getStatusIcon = (status: RecipeWasteStatus["status"]) => {
      switch(status) {
          case "danger": return <AlertCircle className="w-5 h-5 text-red-500" />;
          case "warning": return <Target className="w-5 h-5 text-yellow-500" />;
          case "good": return <CheckCircle2 className="w-5 h-5 text-green-500" />;
          default: return null;
      }
  };
  return (
    <Card className="glass shadow-inner overflow-hidden border-t-4 border-t-amber-500/50">
        <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
                Semáforo de Desperdicio
            </CardTitle>
            <CardDescription>
                Evalúa rápidamente el diferencial de materia prima (Real vs Esperado) para cada receta procesada.
                Rojo = +5% desviación, Amarillo = +2% desviación.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <div className="flex flex-wrap gap-4">
                {}
                <div 
                    onClick={() => onSelectRecipe(FILTER_ALL)}
                    className={cn(
                        "cursor-pointer p-4 rounded-xl border transition-all hover:shadow-md flex items-center justify-between min-w-[200px]",
                        selectedRecipe === FILTER_ALL ? "ring-2 ring-primary bg-primary/5" : "bg-card"
                    )}
                >
                    <div className="flex flex-col">
                        <span className="font-semibold text-foreground truncate">Todas las Recetas</span>
                        <span className="text-sm text-muted-foreground mt-1">
                           Vista General
                        </span>
                    </div>
                </div>
                {recipeData.map(r => (
                    <Tooltip key={r.name}>
                        <TooltipTrigger asChild>
                            <div 
                                onClick={() => onSelectRecipe(r.name)}
                                className={cn(
                                    "cursor-pointer p-4 rounded-xl border transition-all hover:shadow-md flex items-center justify-between min-w-[240px] flex-1 md:flex-none",
                                    getStatusColor(r.status),
                                    selectedRecipe === r.name ? "ring-2 ring-current shadow-lg scale-[1.02]" : "hover:scale-[1.01]"
                                )}
                            >
                                <div className="flex flex-col">
                                    <span className="font-semibold text-current truncate pr-4">{r.name}</span>
                                    <div className="flex items-center gap-2 mt-2">
                                        <Badge variant="outline" className={cn("bg-background", getStatusColor(r.status))}>
                                            {r.delta > 0 ? "+" : ""}{r.percentDeviation.toFixed(2)}%
                                        </Badge>
                                        <span className="text-xs opacity-80">
                                            Vs Total Plan
                                        </span>
                                    </div>
                                </div>
                                <div className="shrink-0 p-2 bg-background/50 rounded-full">
                                    {getStatusIcon(r.status)}
                                </div>
                            </div>
                        </TooltipTrigger>
                        <TooltipContent className="w-64 p-3 bg-popover/95 backdrop-blur-md border border-border shadow-xl">
                            <p className="font-semibold mb-2">{r.name}</p>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <span className="text-muted-foreground">Total Esperado:</span>
                                <span className="font-medium text-right">{r.totalExpected.toLocaleString('es-MX', { maximumFractionDigits: 1 })}</span>
                                <span className="text-muted-foreground">Total Real:</span>
                                <span className="font-medium text-right">{r.totalReal.toLocaleString('es-MX', { maximumFractionDigits: 1 })}</span>
                                <span className="text-muted-foreground mt-1">Diferencia:</span>
                                <span className={cn("font-bold text-right mt-1", r.delta > 0 ? "text-destructive" : "text-green-500")}>
                                    {r.delta > 0 ? "+" : ""}{r.delta.toLocaleString('es-MX', { maximumFractionDigits: 1 })}
                                </span>
                            </div>
                        </TooltipContent>
                    </Tooltip>
                ))}
            </div>
        </CardContent>
    </Card>
  );
}
