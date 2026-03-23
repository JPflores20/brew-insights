import React from "react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { Thermometer, Plus } from "lucide-react";
import { FILTER_ALL } from "@/lib/constants";
import { SeriesConfig } from "./types";
import { useCapabilityStats } from "./hooks/use_capability_stats";
import { CapabilityPanel } from "./components/capability_panel";
import { MultiSeriesFilters } from "./components/multi_series_filters";
import { SingleSeriesFilters } from "./components/single_series_filters";
import { MultiSeriesChart } from "./components/multi_series_chart";
import { SingleSeriesChart } from "./components/single_series_chart";

interface TemperatureTrendChartProps {
    data: any[];
    trendBatch?: string;
    trendRecipe?: string;
    trendMachine?: string;
    uniqueRecipes?: string[];
    machinesWithTemps?: string[];
    availableTrendBatches?: string[];
    availableTempParams: string[];
    selectedTempParam: string;
    setSelectedTempParam: (val: string) => void;
    setTrendRecipe?: (val: string) => void;
    setTrendMachine?: (val: string) => void;
    setTrendBatch?: (val: string) => void;
    selectedTempIndices: number[];
    setSelectedTempIndices: React.Dispatch<React.SetStateAction<number[]>>;
    chartType?: "area" | "line";
    title?: string;
    hideParamSelector?: boolean;
    series?: SeriesConfig[];
    onAddSeries?: () => void;
}

export function TemperatureTrendChart(props: TemperatureTrendChartProps) {
    const {
        data, trendBatch, trendRecipe, trendMachine, selectedTempParam,
        uniqueRecipes = [], machinesWithTemps = [], availableTrendBatches = [],
        availableTempParams, setTrendRecipe, setTrendMachine, setTrendBatch,
        setSelectedTempParam, selectedTempIndices, setSelectedTempIndices,
        chartType = "area", title, hideParamSelector = false, series, onAddSeries,
    } = props;

    const isMultiSeries = Boolean(series && series.length > 0);
    const { tolerance, setTolerance, selectedStepForCp, setSelectedStepForCp, availableStepsForCp, stats } = useCapabilityStats(data, isMultiSeries, series);

    return (
        <Card className="bg-card border-border w-full p-6 opacity-90 hover:opacity-100 transition-opacity">
            <CardHeader className="px-0 pt-0 pb-6">
                <div className="flex flex-col gap-4">
                    <div className="space-y-1">
                        <CardTitle className="text-lg font-semibold flex items-center gap-2">
                            <Thermometer className="h-5 w-5 text-red-500" />
                            {title || (trendBatch && trendBatch !== FILTER_ALL ? "Perfil de Temperatura del Lote" : "Tendencia Histórica de Temperaturas")}
                        </CardTitle>
                        <CardDescription>
                            {isMultiSeries ? "Comparación de múltiples series de temperatura" : (trendBatch && trendBatch !== FILTER_ALL ? `Visualizando evolución paso a paso del lote ${trendBatch}` : "Análisis histórico por equipo y receta")}
                        </CardDescription>
                    </div>

                    {stats && (trendBatch === FILTER_ALL || isMultiSeries) && (
                        <CapabilityPanel stats={stats} availableStepsForCp={availableStepsForCp} selectedStepForCp={selectedStepForCp} setSelectedStepForCp={setSelectedStepForCp} tolerance={tolerance} setTolerance={setTolerance} />
                    )}

                    {isMultiSeries && series ? (
                        <MultiSeriesFilters series={series} onAddSeries={onAddSeries} hideParamSelector={hideParamSelector} selectedTempParam={selectedTempParam} setSelectedTempParam={setSelectedTempParam} availableTempParams={availableTempParams} />
                    ) : (
                        <SingleSeriesFilters trendRecipe={trendRecipe} setTrendRecipe={setTrendRecipe} uniqueRecipes={uniqueRecipes} trendMachine={trendMachine} setTrendMachine={setTrendMachine} machinesWithTemps={machinesWithTemps} trendBatch={trendBatch} setTrendBatch={setTrendBatch} availableTrendBatches={availableTrendBatches} hideParamSelector={hideParamSelector} selectedTempParam={selectedTempParam} setSelectedTempParam={setSelectedTempParam} availableTempParams={availableTempParams} />
                    )}
                </div>
            </CardHeader>
            <div className="h-[340px] w-full">
                {isMultiSeries && (!series || series.length === 0) ? (
                    <div className="flex h-full w-full items-center justify-center flex-col gap-2 text-muted-foreground p-8 border-2 border-dashed border-muted rounded-lg">
                        <Plus className="h-8 w-8 opacity-50" /><p className="text-lg font-medium">No hay series configuradas</p><p className="text-sm">Haz clic en "Añadir Serie" para comparar tendencias de temperatura.</p>
                    </div>
                ) : data.length === 0 ? (
                    <div className="flex h-full w-full items-center justify-center flex-col gap-2 text-muted-foreground p-8 border-2 border-dashed border-muted rounded-lg">
                        <Thermometer className="h-8 w-8 opacity-50" /><p>No hay datos de temperatura disponibles con los filtros actuales.</p><p className="text-sm">Intenta seleccionar otra Receta o Equipo.</p>
                    </div>
                ) : (
                    <>
                        {isMultiSeries && series ? (
                            <MultiSeriesChart data={data} series={series} selectedTempIndices={selectedTempIndices} setSelectedTempIndices={setSelectedTempIndices} />
                        ) : (
                            <SingleSeriesChart data={data} chartType={chartType} trendBatch={trendBatch} selectedTempIndices={selectedTempIndices} setSelectedTempIndices={setSelectedTempIndices} />
                        )}
                    </>
                )}
            </div>
        </Card>
    );
}
