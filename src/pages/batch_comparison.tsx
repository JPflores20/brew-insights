// src/pages/BatchComparison.tsx  (REFACTORIZADO)
// La página ahora es un orquestador fino — toda la lógica vive en useBatchComparison

import { useRef } from "react";
import { DashboardLayout } from "@/components/layout/dashboard_layout";
import {
  BarChart as BarChartIcon,
  LineChart as LineChartIcon,
  Radar as RadarIcon,
  AreaChart as AreaChartIcon,
  Printer,
  ArrowRight,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useReactToPrint } from "react-to-print";
import { format } from "date-fns";
import { useToast } from "@/hooks/use_toast";
import { exportToCSV } from "@/utils/export_utils";

// Hook de lógica
import { useBatchComparison } from "@/hooks/use_batch_comparison";

// Componentes atómicos
import { BatchSelectorCard } from "@/components/batch-comparison/batch_selector_card";
import { BatchComparisonChart } from "@/components/batch-comparison/batch_comparison_chart";
import { TemperatureTrendChart } from "@/components/machine-detail/temperature_trend_chart";

// Helpers de datos
import { getBatchById } from "@/data/mock_data";
import { ChartType } from "@/types";

export default function BatchComparison() {
  const { toast } = useToast();
  const {
    data,
    batchIds,
    batchProductMap,
    batchA, setBatchA,
    batchB, setBatchB,
    chartType, setChartType,
    availableTempParams,
    selectedTempParam, setSelectedTempParam,
    selectedTempIndices, setSelectedTempIndices,
    chartData,
    seriesOptions,
    addSeries,
  } = useBatchComparison();

  // ── Datos para el gráfico de barras superiores ─────────────────────────────
  const batchAData = getBatchById(data, batchA);
  const batchBData = getBatchById(data, batchB);

  const machinesA = batchAData.map((d) => d.TEILANL_GRUPO);
  const machinesB = batchBData.map((d) => d.TEILANL_GRUPO);
  const relevantMachines = Array.from(new Set([...machinesA, ...machinesB])).sort();

  const comparisonData = relevantMachines.map((machineName) => {
    const recordA = batchAData.find((d) => d.TEILANL_GRUPO === machineName);
    const recordB = batchBData.find((d) => d.TEILANL_GRUPO === machineName);
    return {
      machine: machineName,
      [batchA || "Lote A"]: recordA?.real_total_min || 0,
      [batchB || "Lote B"]: recordB?.real_total_min || 0,
    };
  });

  // ── Impresión ──────────────────────────────────────────────────────────────
  const componentRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `Reporte_Comparacion_${format(new Date(), "yyyy-MM-dd_HHmm")}`,
    pageStyle: `@page{size:auto;margin:15mm;}@media print{body{-webkit-print-color-adjust:exact;}}`,
  });

  // ── Estado vacío ──────────────────────────────────────────────────────────
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
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Comparación de Lotes</h1>
            <p className="text-muted-foreground">Analiza diferencias de tiempo entre dos cocimientos</p>
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
                exportToCSV(comparisonData, `Comparativa_${batchA}_vs_${batchB}_${format(new Date(), "yyyyMMdd")}`);
                toast({ title: "Exportación exitosa", description: "Tabla comparativa descargada." });
              }}
            >
              <ArrowRight className="mr-2 h-4 w-4" /> Exportar CSV
            </Button>
          </div>
        </div>

        {/* Contenido imprimible */}
        <div ref={componentRef} className="space-y-6">
          {/* Encabezado sólo para impresión */}
          <div className="hidden print:block mb-6">
            <h1 className="text-3xl font-bold text-black mb-2">Reporte de Comparación de Lotes</h1>
            <p className="text-gray-600">Generado el {format(new Date(), "PPP p")}</p>
            {batchA && batchB && (
              <p className="text-lg mt-2 text-black">
                Comparando: <strong>{batchA}</strong> vs <strong>{batchB}</strong>
              </p>
            )}
          </div>

          {/* Selector de lotes */}
          <BatchSelectorCard
            batchIds={batchIds}
            batchA={batchA}
            batchB={batchB}
            batchProductMap={batchProductMap}
            onChangeBatchA={setBatchA}
            onChangeBatchB={setBatchB}
          />

          {/* Gráfico de comparación directa */}
          {batchA && batchB && (
            <BatchComparisonChart
              data={comparisonData as Record<string, unknown>[]}
              batchA={batchA}
              batchB={batchB}
              chartType={chartType as ChartType}
              batchProductMap={batchProductMap}
            />
          )}

          {/* Gráfico de tendencias multi-serie */}
          <div className="space-y-6 mt-6">
            <TemperatureTrendChart
              data={chartData}
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
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
