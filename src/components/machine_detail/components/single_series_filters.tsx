import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FILTER_ALL } from "@/lib/constants";

interface SingleSeriesFiltersProps {
    trendRecipe?: string;
    setTrendRecipe?: (val: string) => void;
    uniqueRecipes: string[];
    trendMachine?: string;
    setTrendMachine?: (val: string) => void;
    machinesWithTemps: string[];
    trendBatch?: string;
    setTrendBatch?: (val: string) => void;
    availableTrendBatches: string[];
    hideParamSelector?: boolean;
    selectedTempParam: string;
    setSelectedTempParam: (val: string) => void;
    availableTempParams: string[];
}

export function SingleSeriesFilters({
    trendRecipe, setTrendRecipe, uniqueRecipes,
    trendMachine, setTrendMachine, machinesWithTemps,
    trendBatch, setTrendBatch, availableTrendBatches,
    hideParamSelector, selectedTempParam, setSelectedTempParam, availableTempParams
}: SingleSeriesFiltersProps) {
    return (
        <div className="flex flex-col sm:flex-row gap-2 w-full items-center">
            <div 
                className="w-4 h-4 rounded-full bg-red-500 shrink-0 border border-border" 
                title="Color de la serie actual"
            />
            <Select value={trendRecipe} onValueChange={setTrendRecipe}>
                <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Receta" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value={FILTER_ALL}>Todas las recetas</SelectItem>
                    {uniqueRecipes.map((r) => (
                        <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <Select value={trendMachine} onValueChange={setTrendMachine}>
                <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Equipo" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value={FILTER_ALL}>Todos los equipos</SelectItem>
                    {machinesWithTemps.map((m) => (
                        <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <Select value={trendBatch} onValueChange={setTrendBatch}>
                <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Lote" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value={FILTER_ALL}>Todos los lotes (Histórico)</SelectItem>
                    {availableTrendBatches.map((b) => (
                        <SelectItem key={b} value={b}>{b}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
            {!hideParamSelector && (
                <Select value={selectedTempParam} onValueChange={setSelectedTempParam}>
                    <SelectTrigger className="w-full sm:w-[200px]">
                        <SelectValue placeholder="Variable" />
                    </SelectTrigger>
                    <SelectContent>
                        {availableTempParams.map((p) => (
                            <SelectItem key={p} value={p}>{p}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            )}
        </div>
    );
}
