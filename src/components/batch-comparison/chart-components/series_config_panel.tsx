import React from "react";
import { Plus, Trash2 } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { FILTER_ALL } from "@/lib/constants";
import { SeriesConfig } from "@/types/series_config";

interface SeriesConfigPanelProps {
    seriesList: SeriesConfig[];
    onAddSeries: () => void;
    hideStepParameterFilters?: boolean;
    onlyShowRecipe?: boolean;
}

export function SeriesConfigPanel({
    seriesList,
    onAddSeries,
    hideStepParameterFilters = false,
    onlyShowRecipe = false
}: SeriesConfigPanelProps) {
    const isEmpty = !seriesList || seriesList.length === 0;

    return (
        <div className="flex flex-col gap-3 w-full print:hidden">
            {!isEmpty && seriesList.map((seriesItem) => (
                <div key={seriesItem.id} className="flex flex-col sm:flex-row gap-2 w-full items-center p-2 rounded-md bg-muted/30 border border-border/50">
                    <div 
                        className="w-4 h-4 rounded-full shrink-0 border border-border" 
                        style={{ backgroundColor: seriesItem.color }}
                        title={`Serie ${seriesItem.id}`}
                    />
                    <Select value={seriesItem.recipe} onValueChange={seriesItem.setRecipe}>
                        <SelectTrigger className="w-full sm:w-[150px] lg:w-[180px] h-8 text-xs">
                            <SelectValue placeholder="Receta" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={FILTER_ALL}>Todas las rec.</SelectItem>
                            {seriesItem.availableRecipes.map((r) => (
                                <SelectItem key={r} value={r}>{r}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {!onlyShowRecipe && seriesItem.availableMachines && seriesItem.availableMachines.length > 0 && (
                        <Select value={seriesItem.machine} onValueChange={seriesItem.setMachine}>
                            <SelectTrigger className="w-full sm:w-[150px] lg:w-[180px] h-8 text-xs">
                                <SelectValue placeholder="Equipo" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={FILTER_ALL}>Todos los eq.</SelectItem>
                                {seriesItem.availableMachines.map((m) => (
                                    <SelectItem key={m} value={m}>{m}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}

                    {!onlyShowRecipe && seriesItem.availableBatches && seriesItem.availableBatches.length > 0 && (
                        <Select value={seriesItem.batch} onValueChange={seriesItem.setBatch}>
                            <SelectTrigger className="w-full sm:w-[120px] lg:w-[150px] h-8 text-xs">
                                <SelectValue placeholder="Lote" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={FILTER_ALL}>Todos (Histótico)</SelectItem>
                                {seriesItem.availableBatches.map((b) => (
                                    <SelectItem key={b} value={b}>{b}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}

                    {!hideStepParameterFilters && seriesItem.availableSteps && seriesItem.availableSteps.length > 0 && (
                        <Select value={seriesItem.step} onValueChange={seriesItem.setStep}>
                            <SelectTrigger className="w-full sm:w-[120px] lg:w-[150px] h-8 text-xs">
                                <SelectValue placeholder="Paso (GOP)" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={FILTER_ALL}>Todos los pasos</SelectItem>
                                {seriesItem.availableSteps.map((step) => (
                                    <SelectItem key={step} value={step}>{step}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}

                    {!hideStepParameterFilters && seriesItem.availableParameters && seriesItem.availableParameters.length > 0 && (
                        <Select value={seriesItem.parameter} onValueChange={seriesItem.setParameter}>
                            <SelectTrigger className="w-full sm:w-[120px] lg:w-[150px] h-8 text-xs">
                                <SelectValue placeholder="Parámetro a graficar" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={FILTER_ALL}>Automático</SelectItem>
                                {seriesItem.availableParameters.map((p) => (
                                    <SelectItem key={p} value={p}>{p}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}

                    {seriesItem.onRemove && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0" onClick={seriesItem.onRemove}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            ))}
            
            <div className="flex flex-col sm:flex-row gap-2 justify-between items-center mt-2">
                <Button variant="outline" size="sm" onClick={onAddSeries} className="w-full sm:w-auto">
                    <Plus className="mr-2 h-4 w-4" /> Añadir Serie
                </Button>
            </div>
        </div>
    );
}
