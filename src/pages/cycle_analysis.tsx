import { useRef } from "react";
import { DashboardLayout } from "@/components/layout/dashboard_layout";
import { useData } from "@/context/data_context";
import { format } from "date-fns";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { TrendAreaChart } from "@/components/analysis/trend_area_chart";
import { EquipmentGanttChart } from "@/components/analysis/equipment_gantt_chart";
import { BrewGanttChart } from "@/components/analysis/brew_gantt_chart";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { AnimatedPage } from "@/components/layout/animated_page";
import { LoadingState } from "@/components/ui/loading_state";
import { motion } from "framer-motion";
import { useReactToPrint } from "react-to-print";

import { useCycleData } from "./cycle_analysis/use_cycle_data";
import { CycleHeader } from "./cycle_analysis/cycle_header";
import { CycleFilters } from "./cycle_analysis/cycle_filters";
import { CycleMetrics } from "./cycle_analysis/cycle_metrics";

export default function CycleAnalysis() {
  const { data } = useData();
  const componentRef = useRef<HTMLDivElement>(null);

  const cycleData = useCycleData(data || []);

  const handlePrint = useReactToPrint({
      contentRef: componentRef,
      documentTitle: `Analisis_Ciclos_${cycleData.selectedProduct || 'Global'}_${format(new Date(), 'yyyy-MM-dd_HHmm')}`,
      pageStyle: `
        @page { size: auto; margin: 15mm; }
        @media print { body { -webkit-print-color-adjust: exact; } .print:hidden { display: none !important; } }
      `
  });

  if (!data) return <DashboardLayout><LoadingState message="Cargando análisis..." /></DashboardLayout>;
  
  if (data.length === 0) {
    return (
      <DashboardLayout>
        <div className="flex h-[50vh] items-center justify-center">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
            <Alert className="max-w-md glass border-primary/20">
              <AlertCircle className="h-4 w-4 text-primary" />
              <AlertTitle>Sin datos disponibles</AlertTitle>
              <AlertDescription>Por favor carga un archivo en la vista de Resumen primero.</AlertDescription>
            </Alert>
          </motion.div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <AnimatedPage className="space-y-6 pb-10">
        <CycleHeader onPrint={handlePrint} />
        
        <CycleFilters {...cycleData} />

        <div ref={componentRef}>
             <div className="hidden print:block mb-6">
                  <h1 className="text-3xl font-bold text-black mb-2">Reporte de Análisis de Ciclos</h1>
                  <p className="text-gray-600">Generado el {format(new Date(), "PPP p")}</p>
                   <div className="mt-4 grid grid-cols-2 gap-4 text-sm text-black border-t pt-4">
                    <p><strong>Producto:</strong> {cycleData.selectedProduct || 'Todos'}</p>
                    <p><strong>Fase:</strong> {cycleData.selectedStep === 'FULL_CYCLE' ? 'Ciclo Completo' : cycleData.selectedStep}</p>
                    <p><strong>Meta:</strong> {cycleData.theoreticalDuration} min</p>
                  </div>
              </div>

            <CycleMetrics 
                stats={cycleData.stats} 
                theoreticalDuration={cycleData.theoreticalDuration} 
                compliancePercentage={cycleData.compliancePercentage} 
            />

            <Tabs value={cycleData.activeTab} onValueChange={cycleData.setActiveTab} className="mt-6">
                <TabsList className="mb-4">
                    <TabsTrigger value="area">Análisis de Áreas</TabsTrigger>
                    <TabsTrigger value="gantt">Gantt por Equipos</TabsTrigger>
                    <TabsTrigger value="brew_gantt">Gantt por Cocimientos</TabsTrigger>
                </TabsList>
                
                <TabsContent value="area" className="outline-none">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
                        <TrendAreaChart data={cycleData.chartData} theoreticalDuration={cycleData.theoreticalDuration} />
                    </motion.div>
                </TabsContent>
                
                <TabsContent value="gantt" className="outline-none h-[640px]">
                    <EquipmentGanttChart data={cycleData.ganttData} selectedDate={cycleData.selectedDate ? new Date(`${cycleData.selectedDate}T00:00:00`) : new Date()} />
                </TabsContent>
                
                <TabsContent value="brew_gantt" className="outline-none h-[640px]">
                    <BrewGanttChart data={cycleData.brewGanttData} selectedBrewId={cycleData.selectedBrew} />
                </TabsContent>
            </Tabs>
        </div>
      </AnimatedPage>
    </DashboardLayout>
  );
}