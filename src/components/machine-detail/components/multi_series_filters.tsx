import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { SeriesConfig } from "../types";
import { FILTER_ALL } from "@/lib/constants";

interface MultiSeriesFiltersProps {
    series: SeriesConfig[];
    onAddSeries?: () => void;
    hideParamSelector?: boolean;
    selectedTempParam: string;
    setSelectedTempParam: (val: string) => void;
    availableTempParams: string[];
}

export function MultiSeriesFilters({
    series, onAddSeries, hideParamSelector, 
    selectedTempParam, setSelectedTempParam, availableTempParams
}: MultiSeriesFiltersProps) {
    return (
        <div className="flex flex-col gap-3 w-full print:hidden">
            {series.map((s) => (
                <div key={s.id} className="flex flex-col sm:flex-row gap-2 w-full items-center p-2 rounded-md bg-muted/30 border border-border/50">
                    <div 
                        className="w-4 h-4 rounded-full shrink-0 border border-border" 
                        style={{ backgroundColor: s.color }}
                        title={`Serie ${s.id}`}
                    />
                    <Select value={s.recipe} onValueChange={s.setRecipe}>
                        <SelectTrigger className="w-full sm:w-[180px] h-8 text-xs">
                            <SelectValue placeholder="Receta" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={FILTER_ALL}>Todas</SelectItem>
                            {s.availableRecipes.map((r) => (
                                <SelectItem key={r} value={r}>{r}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={s.machine} onValueChange={s.setMachine}>
                        <SelectTrigger className="w-full sm:w-[180px] h-8 text-xs">
                            <SelectValue placeholder="Equipo" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={FILTER_ALL}>Todos</SelectItem>
                            {s.availableMachines.map((m) => (
                                <SelectItem key={m} value={m}>{m}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={s.batch} onValueChange={s.setBatch}>
                        <SelectTrigger className="w-full sm:w-[180px] h-8 text-xs">
                            <SelectValue placeholder="Lote" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={FILTER_ALL}>Histórico</SelectItem>
                            {s.availableBatches.map((b) => (
                                <SelectItem key={b} value={b}>{b}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {s.onRemove && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={s.onRemove}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            ))}
            <div className="flex flex-col sm:flex-row gap-2 justify-between items-center mt-2">
                {onAddSeries && (
                    <Button variant="outline" size="sm" onClick={onAddSeries} className="w-full sm:w-auto">
                        <Plus className="mr-2 h-4 w-4" /> Añadir Serie
                    </Button>
                )}
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
        </div>
    );
}
