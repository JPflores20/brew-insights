import { useState, useEffect, useRef, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { EfficiencyChart } from "@/components/dashboard/EfficiencyChart";
import {
  Boxes,
  TrendingUp,
  Upload,
  PieChart as PieChartIcon,
  Maximize2,
  Calendar,
  Info,
  Download,
  Printer
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { processExcelFile } from "@/utils/excelProcessor";
import { exportToCSV } from "@/utils/exportUtils";
import { useData } from "@/context/DataContext";
import {
  getTotalBatches,
  getAverageCycleDeviation,
  getRecipeStats,
  BatchRecord
} from "@/data/mockData";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { useReactToPrint } from "react-to-print";

// Components
import { ProductPieChart } from "@/components/dashboard/ProductPieChart";
import { Glossary } from "@/components/dashboard/Glossary";
import { EmptyStateUploader } from "@/components/dashboard/EmptyStateUploader";
import { MetricCard } from "@/components/ui/MetricCard";
import { AnimatedPage } from "@/components/layout/AnimatedPage";
import { LoadingState } from "@/components/ui/LoadingState";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";

export default function Overview() {
  const { data, setData } = useData();
  const [loading, setLoading] = useState(false);
  const [expandedChart, setExpandedChart] = useState<"efficiency" | "distribution" | null>(null);
  const [distributionDateRange, setDistributionDateRange] = useState<DateRange | undefined>();
  const [uploadProgress, setUploadProgress] = useState(0);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const { toast } = useToast();

  const clearProgressInterval = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  };

  const processFiles = async (files: File[]) => {
    if (files.length === 0) return;

    if (files.length > 4) {
      toast({
        variant: "destructive",
        title: "Exceso de ingredientes",
        description: "Solo puedes subir un máximo de 4 archivos a la vez.",
      });
      return;
    }

    setLoading(true);
    setUploadProgress(0);

    // Animación de progreso falsa
    progressIntervalRef.current = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) return 90 + Math.random() * 2;
        return Math.min(prev + Math.random() * 15, 90);
      });
    }, 300);

    try {
      let combinedData: BatchRecord[] = [];
      let successCount = 0;

      for (const file of files) {
        const fileData = await processExcelFile(file);
        if (fileData && fileData.length > 0) {
          combinedData = [...combinedData, ...fileData];
          successCount++;
        }
      }

      clearProgressInterval();
      setUploadProgress(100);
      await new Promise(resolve => setTimeout(resolve, 800));

      if (combinedData.length > 0) {
        setData(combinedData);
        toast({
          title: "¡Tanque lleno!",
          description: `Se han procesado ${successCount} archivo(s) con ${combinedData.length} registros totales.`,
          className: "bg-primary text-primary-foreground border-none",
        });
      } else {
        throw new Error("No se encontraron datos válidos en los archivos.");
      }

    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Error en la mezcla",
        description: "Uno o más archivos no son válidos o no tienen el formato esperado.",
      });
    } finally {
      clearProgressInterval();
      setLoading(false);
      setUploadProgress(0);
    }
  };

  const handleExport = () => {
    if (data.length === 0) {
      toast({
        variant: "destructive",
        title: "Sin datos",
        description: "No hay datos para exportar.",
      });
      return;
    }

    const exportData = data.map(d => ({
      "Lote": d.CHARG_NR,
      "Grupo Equipo": d.TEILANL_GRUPO,
      "Producto": d.productName || "Desconocido",
      "Inicio": d.timestamp ? format(new Date(d.timestamp), 'dd/MM/yyyy HH:mm:ss') : '',
      "Duración Real (min)": d.real_total_min,
      "Duración Esperada (min)": d.esperado_total_min,
      "Delta (min)": d.delta_total_min,
      "Tiempo Muerto (min)": d.idle_wall_minus_sumsteps_min,
      "Pasos": d.steps.length,
      "Alertas": d.alerts.length
    }));

    exportToCSV(exportData, `BrewCycle_Overview_${format(new Date(), 'yyyyMMdd_HHmm')}`);
    toast({
      title: "Exportación exitosa",
      description: "El archivo CSV se ha descargado correctamente.",
    });
  };

  const componentRef = useRef<HTMLDivElement>(null);
  
    const handlePrint = useReactToPrint({
        contentRef: componentRef,
        documentTitle: `Overview_Report_${format(new Date(), 'yyyy-MM-dd_HHmm')}`,
        pageStyle: `
          @page { size: auto; margin: 15mm; }
          @media print {
            body { -webkit-print-color-adjust: exact; }
            .print:hidden { display: none !important; }
          }
        `
    });
  
    useEffect(() => {
      return () => clearProgressInterval();
    }, []);
  
    // --- Cálculos ---
    const totalBatches = getTotalBatches(data);
    const avgDeviation = getAverageCycleDeviation(data);
    const recipeStats = useMemo(() => getRecipeStats ? getRecipeStats(data) : [], [data]);
  
    const availableDateRange = useMemo(() => {
      if (data.length === 0) return { min: undefined, max: undefined, label: "---" };
      const timestamps = data.map(d => new Date(d.timestamp).getTime());
      const min = new Date(Math.min(...timestamps));
      const max = new Date(Math.max(...timestamps));
      // Normalize to start and end of day to ensuring inclusive filtering
      min.setHours(0, 0, 0, 0);
      max.setHours(23, 59, 59, 999);
  
      return {
        min,
        max,
        label: `${format(min, 'dd/MM/yyyy')} - ${format(max, 'dd/MM/yyyy')}`
      };
    }, [data]);
  
    // --- Filter Logic for Distribution Chart ---
    const filteredPieDataRaw = useMemo(() => {
      if (!distributionDateRange?.from) return data;
  
      return data.filter(d => {
        if (!d.timestamp) return false;
        const date = new Date(d.timestamp);
        const from = new Date(distributionDateRange.from!);
        from.setHours(0, 0, 0, 0);
  
        let to = distributionDateRange.to ? new Date(distributionDateRange.to) : new Date(from);
        to.setHours(23, 59, 59, 999);
  
        return date >= from && date <= to;
      });
    }, [data, distributionDateRange]);
  
    const filteredRecipeStats = useMemo(() => getRecipeStats ? getRecipeStats(filteredPieDataRaw) : [], [filteredPieDataRaw]);
    const filteredTotalBatches = useMemo(() => getTotalBatches(filteredPieDataRaw), [filteredPieDataRaw]);
  
    const pieData = useMemo(() => {
      return filteredRecipeStats.map(stat => ({
        name: stat.name,
        value: stat.batchCount
      })).sort((a, b) => b.value - a.value);
    }, [filteredRecipeStats]);
  
    // --- Render ---
    if (data.length === 0) {
      return (
        <DashboardLayout>
          <EmptyStateUploader
            loading={loading}
            uploadProgress={uploadProgress}
            onFilesSelected={processFiles}
          />
        </DashboardLayout>
      );
    }
  
    if (loading) {
      return (
        <DashboardLayout>
          <LoadingState message="Procesando archivos..." />
        </DashboardLayout>
      );
    }
  
    return (
      <DashboardLayout>
        <AnimatedPage>
          {/* Header */}
          <div className="flex items-center justify-between mb-8 print:hidden">
            <div>
              <h1 className="text-3xl font-bold text-foreground tracking-tight">Tablero General</h1>
              <p className="text-muted-foreground mt-1">Monitor de eficiencia y métricas clave de producción.</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" className="shadow-sm hover:border-primary/50 transition-colors" onClick={() => handlePrint()}>
                  <Printer className="mr-2 h-4 w-4" /> Imprimir PDF
              </Button>
              {data.length > 0 && (
                <Button variant="outline" className="shadow-sm hover:border-primary/50 transition-colors" onClick={handleExport}>
                  <Download className="mr-2 h-4 w-4" /> Exportar CSV
                </Button>
              )}
              <Button variant="outline" className="shadow-sm hover:border-primary/50 transition-colors" onClick={() => setData([])}>
                <Upload className="mr-2 h-4 w-4" /> Cargar nuevos archivos
              </Button>
            </div>
          </div>
  
          {/* Printable Content Wrapper */}
          <div ref={componentRef}>
             {/* Title for Print View Only */}
             <div className="hidden print:block mb-6">
                  <h1 className="text-3xl font-bold text-black mb-2">Reporte General de Producción</h1>
                  <p className="text-gray-600">Generado el {format(new Date(), "PPP p")}</p>
              </div>

        {/* 1. KPIs Principales */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <MetricCard
            title="Total Lotes"
            value={totalBatches}
            subtitle="Procesados en el periodo"
            icon={Boxes}
            delay={0.1}
            className="border-l-4 border-l-primary"
          />
          <MetricCard
            title="Desviación Promedio"
            value={`${avgDeviation > 0 ? '+' : ''}${avgDeviation}%`}
            subtitle="Vs. Tiempo Esperado Total"
            icon={TrendingUp}
            delay={0.2}
            trend={avgDeviation > 10 ? "down" : "up"} // "down" es rojo (malo), "up" verde (bueno) para esta métrica invertida? Ajustar lógica si es necesario.
            trendValue={avgDeviation > 10 ? "Alerta" : "Óptimo"}
            className={avgDeviation > 10 ? "border-l-4 border-l-destructive" : "border-l-4 border-l-green-500"}
          />
          <MetricCard
            title="Periodo de Producción"
            value={availableDateRange.label}
            subtitle="Rango de Fechas"
            icon={Calendar}
            delay={0.3}
            className="border-l-4 border-l-blue-500"
          />
        </div>

        {/* 2. Análisis Gráfico */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8 items-stretch">

          {/* Gráfico de Eficiencia */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="relative group cursor-pointer transition-all hover:ring-2 hover:ring-primary/20 rounded-xl"
            onClick={() => setExpandedChart("efficiency")}
          >
            <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 backdrop-blur-sm p-1.5 rounded-md shadow-sm border border-border print:hidden">
              <Maximize2 className="w-4 h-4 text-muted-foreground" />
            </div>
            <EfficiencyChart data={data} className="h-[450px]" />
          </motion.div>

          {/* Gráfico de Pastel */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <Card
              className="bg-card/50 backdrop-blur-sm border-border shadow-sm flex flex-col cursor-pointer group relative transition-all hover:ring-2 hover:ring-primary/20 h-full"
              onClick={() => setExpandedChart("distribution")}
            >
              <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 backdrop-blur-sm p-1.5 rounded-md shadow-sm border border-border print:hidden">
                <Maximize2 className="w-4 h-4 text-muted-foreground" />
              </div>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="space-y-1">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <PieChartIcon className="h-5 w-5 text-accent" />
                    Distribución de Productos
                  </CardTitle>
                  <CardDescription>Volumen de producción por tipo de cerveza</CardDescription>
                </div>
                <div onClick={(e) => e.stopPropagation()} className="print:hidden">
                  <DatePickerWithRange
                    date={distributionDateRange}
                    setDate={setDistributionDateRange}
                    minDate={availableDateRange.min}
                    maxDate={availableDateRange.max}
                    className="w-[240px]"
                  />
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex items-center justify-center p-2">
                <div className="h-[380px] w-full">
                  {pieData.length > 0 ? (
                    <ProductPieChart data={pieData} totalBatches={filteredTotalBatches} />
                  ) : (
                    <div className="text-muted-foreground flex flex-col items-center justify-center h-full">
                      <Info className="h-8 w-8 mb-2 opacity-50" />
                      No hay datos suficientes para graficar.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* 3. Glosario */}
        <div className="print:hidden">
            <Glossary />
        </div>
        </div>

        {/* DIALOGS */}
        <Dialog open={!!expandedChart} onOpenChange={(open) => !open && setExpandedChart(null)}>
          <DialogContent className="max-w-[90vw] h-[80vh] flex flex-col p-6 glass border-primary/20">
            <DialogHeader>
              <DialogTitle className="text-2xl flex items-center justify-between gap-2 pr-8">
                <div className="flex items-center gap-2">
                  {expandedChart === 'efficiency' && <><TrendingUp className="h-6 w-6 text-primary" /> Eficiencia Detallada por Grupo</>}
                  {expandedChart === 'distribution' && <><PieChartIcon className="h-6 w-6 text-accent" /> Distribución Completa de Productos</>}
                </div>
                {expandedChart === 'distribution' && (
                  <DatePickerWithRange
                    date={distributionDateRange}
                    setDate={setDistributionDateRange}
                    minDate={availableDateRange.min}
                    maxDate={availableDateRange.max}
                  />
                )}
              </DialogTitle>
            </DialogHeader>

            <div className="flex-1 w-full min-h-0 mt-4">
              {expandedChart === 'efficiency' && (
                <EfficiencyChart data={data} className="h-[60vh]" titleClassName="hidden" />
              )}

              {expandedChart === 'distribution' && (
                <ProductPieChart data={pieData} totalBatches={filteredTotalBatches} expanded={true} />
              )}
            </div>
          </DialogContent>
        </Dialog>
      </AnimatedPage>
    </DashboardLayout>
  );
}