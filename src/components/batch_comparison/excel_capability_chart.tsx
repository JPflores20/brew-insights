import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label as UILabel } from "@/components/ui/label";
import { Activity, FileSpreadsheet, UploadCloud, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

import { useExcelCapability } from "./excel_capability/use_excel_capability";
import { ExcelCapabilityFilters } from "./excel_capability/excel_capability_filters";
import { ExcelCapabilityChartSection } from "./excel_capability/excel_capability_chart_section";
import { ExcelCapabilityMetrics } from "./excel_capability/excel_capability_metrics";

export function ExcelCapabilityChart() {
  const capabilityData = useExcelCapability();

  if (capabilityData.loading) {
    return (
      <Card className="shadow-sm border-border bg-card/50 backdrop-blur-sm p-12 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
          <p className="text-muted-foreground animate-pulse text-sm font-medium">Procesando datos del archivo...</p>
        </div>
      </Card>
    );
  }

  if (capabilityData.error || (capabilityData.extData.length === 0 && !capabilityData.loading)) {
    return (
      <Card className="shadow-sm border-border bg-card/50 backdrop-blur-sm p-12 text-center border-dashed">
        <div className="flex flex-col items-center gap-4">
          <UploadCloud className="h-12 w-12 text-muted-foreground opacity-50" />
          <div className="space-y-1">
            <p className="font-bold text-lg">Habilitar análisis de capacidad</p>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Sube un archivo con los datos históricos de los parámetros requeridos para comenzar a analizar la capacidad del proceso.
            </p>
          </div>
          <input
            type="file"
            ref={capabilityData.fileInputRef}
            onChange={capabilityData.handleFileUpload}
            accept=".xlsx, .xls, .csv"
            className="hidden"
          />
          <Button 
            onClick={() => capabilityData.fileInputRef.current?.click()}
            className="bg-fuchsia-600 hover:bg-fuchsia-700 mt-4"
          >
            Seleccionar archivo Excel
          </Button>
          {capabilityData.error && <p className="text-xs text-destructive mt-4">{capabilityData.error}</p>}
        </div>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
      <Card className="lg:col-span-2 shadow-sm border-border bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <div className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-xl font-bold flex items-center gap-2 text-fuchsia-500">
                  <FileSpreadsheet className="h-5 w-5" />
                  Capacidad del Proceso - BPI Excel
                </CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <CardDescription>Análisis estadístico dinámico</CardDescription>
                  <Button 
                    variant="link" 
                    size="sm" 
                    className="h-auto p-0 text-[10px] text-fuchsia-500 font-bold uppercase tracking-wider"
                    onClick={() => capabilityData.fileInputRef.current?.click()}
                  >
                    Actualizar Archivo
                  </Button>
                  <input
                    type="file"
                    ref={capabilityData.fileInputRef}
                    onChange={capabilityData.handleFileUpload}
                    accept=".xlsx, .xls, .csv"
                    className="hidden"
                  />
                </div>
              </div>
              
              <div className="flex items-center gap-3 bg-secondary/30 p-2 rounded-lg border border-border">
                <div className="flex flex-col">
                  <UILabel htmlFor="ex-lei" className="text-[10px] uppercase font-bold text-muted-foreground mb-1">LEI</UILabel>
                  <Input
                    id="ex-lei"
                    type="number"
                    value={capabilityData.lei}
                    onChange={(e) => capabilityData.setLei(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    className="h-8 w-20 text-xs font-mono"
                  />
                </div>
                <div className="flex flex-col">
                  <UILabel htmlFor="ex-les" className="text-[10px] uppercase font-bold text-muted-foreground mb-1">LES</UILabel>
                  <Input
                    id="ex-les"
                    type="number"
                    value={capabilityData.les}
                    onChange={(e) => capabilityData.setLes(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    className="h-8 w-20 text-xs font-mono"
                  />
                </div>
              </div>
            </div>

            <ExcelCapabilityFilters
               selectedParam={capabilityData.selectedParam}
               setSelectedParam={capabilityData.setSelectedParam}
               uniqueParams={capabilityData.uniqueParams}
               selectedEtapa={capabilityData.selectedEtapa}
               setSelectedEtapa={capabilityData.setSelectedEtapa}
               uniqueEtapas={capabilityData.uniqueEtapas}
               selectedMarca={capabilityData.selectedMarca}
               setSelectedMarca={capabilityData.setSelectedMarca}
               uniqueMarcas={capabilityData.uniqueMarcas}
               dateRange={capabilityData.dateRange}
               setDateRange={capabilityData.setDateRange}
               availableDateRange={capabilityData.availableDateRange}
               filteredValuesLength={capabilityData.filteredValues.length}
            />
          </div>
        </CardHeader>

        <CardContent>
           <ExcelCapabilityChartSection
              filteredValuesLength={capabilityData.filteredValues.length}
              stats={capabilityData.stats}
              chartDataBase={capabilityData.chartDataBase}
           />
        </CardContent>
      </Card>

      <Card className="shadow-sm border-border bg-card/50 backdrop-blur-sm h-full">
        <CardHeader>
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <Activity className="h-5 w-5 text-fuchsia-500" />
            Métricas Excel
          </CardTitle>
          <CardDescription>Resumen estadístico del proceso cargado</CardDescription>
        </CardHeader>
        <CardContent>
           <ExcelCapabilityMetrics stats={capabilityData.stats} />
        </CardContent>
      </Card>
    </div>
  );
}
