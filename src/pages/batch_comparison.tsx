
import { useRef } from "react";
import { DashboardLayout } from "@/components/layout/dashboard_layout";
import {
  BarChart as BarChartIcon,
  LineChart as LineChartIcon,
  Radar as RadarIcon,
  AreaChart as AreaChartIcon,
  Printer,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useReactToPrint } from "react-to-print";
import { format } from "date-fns";
import { useToast } from "@/hooks/use_toast";
import { exportToCSV } from "@/utils/export_utils";
import { useBatchComparison } from "@/hooks/use_batch_comparison";
import { BatchSelectorCard } from "@/components/batch-comparison/batch_selector_card";
import { BatchComparisonChart } from "@/components/batch-comparison/batch_comparison_chart";
import { TemperatureTrendChart } from "@/components/machine-detail/temperature_trend_chart";
import { SicTemperatureChart } from "@/components/batch-comparison/sic_temperature_chart";
import { SicAguaAdjuntosChart } from "@/components/batch-comparison/sic_agua_adjuntos_chart";
import { SicAguaMaltaChart } from "@/components/batch-comparison/sic_agua_malta_chart";
import { SicMaltaCarameloChart } from "@/components/batch-comparison/sic_malta_caramelo_chart";
import { EmoCapabilityChart } from "@/components/batch-comparison/emo_capability_chart";
import { StepCapabilityChart } from "@/components/batch-comparison/step_capability_chart";
import { getBatchById } from "@/data/mock_data";
import { ChartType } from "@/types";
import { useBcSeries } from "@/hooks/use_batch_comparison/use_bc_series";
import { useSicChart } from "@/hooks/use_batch_comparison/use_sic_chart";
import { useSicAguaAdjuntos } from "@/hooks/use_batch_comparison/use_sic_agua_adjuntos";
import { useSicAguaMalta } from "@/hooks/use_batch_comparison/use_sic_agua_malta";

export default function BatchComparison() {
  const { toast } = useToast();
  const {
    data,
    batchIds,
    batchProductMap,
    selectedBatches, setSelectedBatches,
    selectedMachines, setSelectedMachines,
    allAvailableMachines,
    chartType, setChartType,
    availableTempParams,
    selectedTempParam, setSelectedTempParam,
    selectedTempIndices, setSelectedTempIndices,
    chartData,
    seriesOptions,
    addSeries,
  } = useBatchComparison();

  // Series management and data for SIC Chart
  const { 
    seriesList: sicSeriesList, 
    addSeries: addSicSeries, 
    seriesOptions: sicSeriesOptions 
  } = useBcSeries(data, 1);
  const { chartData: sicChartData } = useSicChart(data, sicSeriesList);

  // Series management and data for Water/Adjuncts SIC Chart
  const {
    seriesList: wSeriesList,
    addSeries: addWSeries,
    seriesOptions: wSeriesOptions
  } = useBcSeries(data, 1);
  const { chartData: wChartData } = useSicAguaAdjuntos(data, wSeriesList);

  // Series management and data for Water/Malt SIC Chart
  const {
      seriesList: amSeriesList,
      addSeries: addAmSeries,
      seriesOptions: amSeriesOptions
  } = useBcSeries(data, 1);
  const { chartData: amChartData } = useSicAguaMalta(data, amSeriesList);

  // Series management and data for Malta Caramelo SIC Chart
  const {
    seriesList: mSeriesList,
    addSeries: addMSeries,
    updateSeries: updateMSeries,
    removeSeries: removeMSeries,
  } = useBcSeries(data, 1);

  // Extract unique recipes for the Malt Chart filter
  const uniqueRecipes = Array.from(new Set(data.map(d => d.productName).filter(Boolean))).sort();

  const selectedBatchesData = selectedBatches.map(id => getBatchById(data, id));
  
  const relevantMachines = Array.from(
    new Set(selectedBatchesData.flatMap(batch => batch.map(d => d.TEILANL_GRUPO)))
  ).sort();

  const comparisonData = selectedMachines.map((machineName) => {
    const row: Record<string, unknown> = { machine: machineName };
    selectedBatches.forEach(id => {
      const record = getBatchById(data, id).find(d => d.TEILANL_GRUPO === machineName);
      row[id] = record?.real_total_min || 0;
    });
    return row;
  });

  const componentRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `Reporte_Comparacion_${format(new Date(), "yyyy-MM-dd_HHmm")}`,
    pageStyle: `@page{size:auto;margin:15mm;}@media print{body{-webkit-print-color-adjust:exact;}}`,
  });

  if (data.length === 0) {
    return (
      <DashboardLayout>
        <div className="p-8 text-center text-muted-foreground">
          Por favor carga un archivo Excel en la pestaña "Overview" primero.
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Comparativo</h1>
            <p className="text-muted-foreground">Analiza diferencias de tiempo y temperaturas entre múltiples cocimientos</p>
          </div>
          <div className="flex items-center gap-2">
            <Tabs value={chartType} onValueChange={setChartType} className="w-full md:w-auto">
              <TabsList className="grid w-full grid-cols-4 md:w-[300px]">
                <TabsTrigger value="bar" title="Barras"><BarChartIcon className="h-4 w-4" /></TabsTrigger>
                <TabsTrigger value="line" title="Línea"><LineChartIcon className="h-4 w-4" /></TabsTrigger>
                <TabsTrigger value="area" title="Área"><AreaChartIcon className="h-4 w-4" /></TabsTrigger>
                <TabsTrigger value="radar" title="Radar"><RadarIcon className="h-4 w-4" /></TabsTrigger>
              </TabsList>
            </Tabs>
            <Button variant="outline" onClick={() => handlePrint()} className="gap-2">
              <Printer className="h-4 w-4" />
              <span className="hidden sm:inline">Imprimir PDF</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                if (comparisonData.length === 0) {
                  toast({ title: "Sin datos", description: "No hay comparación activa.", variant: "destructive" });
                  return;
                }
                const batchStr = selectedBatches.join("_");
                exportToCSV(comparisonData, `Comparativa_${batchStr}_${format(new Date(), "yyyyMMdd")}`);
                toast({ title: "Exportación exitosa", description: "Tabla comparativa descargada." });
              }}
            >
              <ArrowRight className="mr-2 h-4 w-4" /> Exportar CSV
            </Button>
          </div>
        </div>

        <div ref={componentRef} className="space-y-6">
          <div className="hidden print:block mb-6">
            <h1 className="text-3xl font-bold text-black mb-2">Reporte de Comparación de Lotes</h1>
            <p className="text-gray-600">Generado el {format(new Date(), "PPP p")}</p>
            {selectedBatches.length > 0 && (
              <p className="text-lg mt-2 text-black">
                Comparando: <strong>{selectedBatches.join(", ")}</strong>
              </p>
            )}
          </div>

          <BatchSelectorCard
            batchIds={batchIds}
            selectedBatches={selectedBatches}
            batchProductMap={batchProductMap}
            onChangeBatches={setSelectedBatches}
            machines={allAvailableMachines}
            selectedMachines={selectedMachines}
            onChangeMachines={setSelectedMachines}
          />

          {selectedBatches.length > 0 && (
            <BatchComparisonChart
              data={comparisonData as Record<string, unknown>[]}
              selectedBatches={selectedBatches}
              chartType={chartType as ChartType}
              batchProductMap={batchProductMap}
            />
          )}

          <div className="space-y-6 mt-6">
            <TemperatureTrendChart
              data={chartData}
              fullData={data}
              selectedTempParam={selectedTempParam}
              availableTempParams={availableTempParams}
              setSelectedTempParam={setSelectedTempParam}
              selectedTempIndices={selectedTempIndices}
              setSelectedTempIndices={setSelectedTempIndices}
              chartType="line"
              title="Análisis de Tendencias (Detallado)"
              hideParamSelector={true}
              series={seriesOptions}
              onAddSeries={addSeries}
            />

            <EmoCapabilityChart data={data} />
            
            <StepCapabilityChart data={data} />

            <SicAguaAdjuntosChart
              data={wChartData}
              series={wSeriesOptions}
              onAddSeries={addWSeries}
            />

            <SicMaltaCarameloChart
              data={data}
              series={mSeriesList}
              addSeries={addMSeries}
              updateSeries={updateMSeries}
              removeSeries={removeMSeries}
              uniqueRecipes={uniqueRecipes}
            />

            <SicTemperatureChart
              data={sicChartData}
              selectedTempIndices={selectedTempIndices}
              setSelectedTempIndices={setSelectedTempIndices}
              series={sicSeriesOptions}
              onAddSeries={addSicSeries}
            />

            <SicAguaMaltaChart
              data={amChartData}
              series={amSeriesOptions}
              onAddSeries={addAmSeries}
            />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
