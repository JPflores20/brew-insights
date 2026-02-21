import { useMemo, useState, useRef } from "react";
import { DashboardLayout } from "@/components/layout/dashboard_layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useData } from "@/context/data_context";
import { useLocalStorage } from "@/hooks/use_local_storage";
import { format, parseISO } from "date-fns";
import { AlertCircle, Clock, TrendingUp, Activity, CheckCircle, Printer } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { calculateMergedDuration } from "@/utils/time_utils";
import { TrendAreaChart } from "@/components/analysis/trend_area_chart";
import { AnimatedPage } from "@/components/layout/animated_page";
import { MetricCard } from "@/components/ui/metric_card";
import { LoadingState } from "@/components/ui/loading_state";
import { motion } from "framer-motion";
import { useReactToPrint } from "react-to-print";
export default function CycleAnalysis() {
  const { data } = useData();
  const [selectedProduct, setSelectedProduct] = useLocalStorage<string>("cycle-product", "");
  const [theoreticalDuration, setTheoreticalDuration] = useLocalStorage<number>("cycle-theoretical", 120);
  const [selectedStep, setSelectedStep] = useState<string>("FULL_CYCLE");
  const componentRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
      contentRef: componentRef,
      documentTitle: `Analisis_Ciclos_${selectedProduct || 'Global'}_${format(new Date(), 'yyyy-MM-dd_HHmm')}`,
      pageStyle: `
        @page { size: auto; margin: 15mm; }
        @media print {
          body { -webkit-print-color-adjust: exact; }
          .print:hidden { display: none !important; }
        }
      `
  });
  const uniqueProducts = useMemo(() => {
    const products = new Set(data.map(d => d.productName).filter(Boolean));
    return Array.from(products).sort();
  }, [data]);
  const uniqueSteps = useMemo(() => {
    if (data.length === 0) return [];
    const batchWithSteps = data.find(d => d.steps && d.steps.length > 0);
    return batchWithSteps
      ? batchWithSteps.steps
        .map(s => s.stepName)
        .filter(name => !name.includes("⏳ Espera"))
      : [];
  }, [data]);
  useMemo(() => {
    if (!selectedProduct && uniqueProducts.length > 0) {
      setSelectedProduct(uniqueProducts[0]);
    }
  }, [uniqueProducts, selectedProduct, setSelectedProduct]);
  const filteredData = useMemo(() => {
    if (!selectedProduct) return [];
    const targetBatchIds = new Set(
      data
        .filter(d => d.productName === selectedProduct)
        .map(d => d.CHARG_NR)
    );
    return data.filter(d => targetBatchIds.has(d.CHARG_NR));
  }, [data, selectedProduct]);
  const chartData = useMemo(() => {
    if (selectedStep === "FULL_CYCLE") {
      const groupedBatches = new Map<string, {
        id: string;
        startTime: number;
        endTime: number;
        intervals: { start: number; end: number }[];
        uniqueSteps: Set<string>;
        totalExpected: number;
      }>();
      filteredData.forEach(batch => {
        const id = batch.CHARG_NR;
        if (!id) return;
        const batchStart = new Date(batch.timestamp).getTime();
        let batchEnd = batchStart + (batch.real_total_min * 60000);
        const batchIntervals: { start: number; end: number }[] = [];
        const batchSteps = batch.steps || [];
        if (!groupedBatches.has(id)) {
          groupedBatches.set(id, {
            id,
            startTime: batchStart,
            endTime: batchEnd,
            intervals: [],
            uniqueSteps: new Set(),
            totalExpected: 0
          });
        }
        const currentGroup = groupedBatches.get(id)!;
        currentGroup.startTime = Math.min(currentGroup.startTime, batchStart);
        if (batchSteps.length > 0) {
          const lastStep = batchSteps[batchSteps.length - 1];
          if (lastStep.endTime) {
            const le = parseISO(lastStep.endTime).getTime();
            if (!isNaN(le)) batchEnd = le;
          }
        }
        currentGroup.endTime = Math.max(currentGroup.endTime, batchEnd);
        if (batchSteps.length > 0) {
          batchSteps.forEach(step => {
            if (step.stepName.includes("⏳ Espera")) return;
            if (step.startTime && step.endTime) {
              const s = parseISO(step.startTime).getTime();
              const e = parseISO(step.endTime).getTime();
              if (!isNaN(s) && !isNaN(e) && e > s) {
                batchIntervals.push({ start: s, end: e });
              }
            }
            const stepKey = `${step.stepName}|${step.startTime}`;
            if (!currentGroup.uniqueSteps.has(stepKey)) {
              currentGroup.uniqueSteps.add(stepKey);
              currentGroup.totalExpected += step.expectedDurationMin;
            }
          });
        } else {
          const idleTimeMs = (batch.idle_wall_minus_sumsteps_min || 0) * 60000;
          batchIntervals.push({ start: batchStart, end: Math.max(batchStart, batchEnd - idleTimeMs) });
          currentGroup.totalExpected += batch.esperado_total_min;
        }
        currentGroup.intervals.push(...batchIntervals);
      });
      return Array.from(groupedBatches.values())
        .map(b => {
          const uniqueDuration = calculateMergedDuration(b.intervals);
          const finalExpected = b.totalExpected > 1 ? b.totalExpected : theoreticalDuration;
          const fullDateFormat = "dd/MM/yyyy HH:mm";
          return {
            id: b.id,
            startTime: b.startTime,
            endTime: b.endTime,
            duration: Math.round(uniqueDuration * 100) / 100,
            expectedDuration: Math.round(finalExpected * 100) / 100,
            startLabel: format(b.startTime, fullDateFormat),
            endLabel: format(b.endTime, fullDateFormat),
            startOffset: 0,
            durationMs: b.endTime - b.startTime
          };
        })
        .sort((a, b) => a.startTime - b.startTime)
        .filter(d => d.duration > 0.1);
    } else {
      return filteredData.map(batch => {
        const step = batch.steps?.find(s => s.stepName === selectedStep);
        if (step) {
          const startTime = step.startTime ? parseISO(step.startTime).getTime() : 0;
          const endTime = step.endTime ? parseISO(step.endTime).getTime() : 0;
          const fullDateFormat = "dd/MM/yyyy HH:mm";
          if (!startTime || !endTime) return null;
          return {
            id: batch.CHARG_NR,
            machine: batch.TEILANL_GRUPO,
            startTime,
            endTime,
            duration: step.durationMin,
            expectedDuration: step.expectedDurationMin || theoreticalDuration,
            startLabel: format(startTime, fullDateFormat),
            endLabel: format(endTime, fullDateFormat),
            startOffset: 0,
            durationMs: endTime - startTime
          };
        }
        return null;
      })
        .filter(Boolean)
        .sort((a: any, b: any) => a.startTime - b.startTime) as any[];
    }
  }, [filteredData, selectedStep, theoreticalDuration]);
  const stats = useMemo(() => {
    if (chartData.length === 0) return { avg: 0, count: 0, max: 0, min: 0 };
    const durations = chartData.map(d => d.duration);
    const total = durations.reduce((acc, curr) => acc + curr, 0);
    return {
      avg: Math.round(total / chartData.length),
      count: chartData.length,
      max: Math.max(...durations),
      min: Math.min(...durations)
    };
  }, [chartData]);
  if (!data) {
    return (
      <DashboardLayout>
        <LoadingState message="Cargando análisis..." />
      </DashboardLayout>
    )
  }
  if (data.length === 0) {
    return (
      <DashboardLayout>
        <div className="flex h-[50vh] items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
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
  const compliancePercentage = stats.count > 0
    ? Math.round((chartData.filter(d => d.duration <= theoreticalDuration).length / stats.count) * 100)
    : 0;
  return (
    <DashboardLayout>
      <AnimatedPage className="space-y-6 pb-10">
        {}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Análisis de Tiempos</h1>
            <p className="text-muted-foreground mt-1">Comparativa: Área Verde (Ideal) vs Área Azul (Real).</p>
          </div>
          <div className="flex items-center gap-3">
             <Button variant="outline" className="shadow-sm hover:border-primary/50 transition-colors" onClick={() => handlePrint()}>
                  <Printer className="mr-2 h-4 w-4" /> Imprimir PDF
              </Button>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 bg-card/50 backdrop-blur-sm p-3 rounded-lg border border-border shadow-sm print:hidden">
            <div className="w-full sm:w-[200px]">
              <Label className="text-xs text-muted-foreground mb-1 block">Producto</Label>
              <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                <SelectTrigger className="h-8 bg-background/50"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {uniqueProducts.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="w-full sm:w-[200px]">
              <Label className="text-xs text-muted-foreground mb-1 block">Fase / Paso</Label>
              <Select value={selectedStep} onValueChange={setSelectedStep}>
                <SelectTrigger className="h-8 bg-background/50"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="FULL_CYCLE">Ciclo Completo (Total)</SelectItem>
                  {uniqueSteps.map(step => <SelectItem key={step} value={step}>{step}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="w-full sm:w-[120px]">
              <Label className="text-xs text-muted-foreground mb-1 block">Meta Global (min)</Label>
              <Input
                type="number"
                className="h-8 bg-background/50"
                value={theoreticalDuration}
                onChange={(e) => setTheoreticalDuration(Number(e.target.value))}
              />
            </div>
        </div>
        {}
        <div ref={componentRef}>
             {}
             <div className="hidden print:block mb-6">
                  <h1 className="text-3xl font-bold text-black mb-2">Reporte de Análisis de Ciclos</h1>
                  <p className="text-gray-600">Generado el {format(new Date(), "PPP p")}</p>
                   <div className="mt-4 grid grid-cols-2 gap-4 text-sm text-black border-t pt-4">
                    <p><strong>Producto:</strong> {selectedProduct || 'Todos'}</p>
                    <p><strong>Fase:</strong> {selectedStep === 'FULL_CYCLE' ? 'Ciclo Completo' : selectedStep}</p>
                    <p><strong>Meta:</strong> {theoreticalDuration} min</p>
                  </div>
              </div>
            {}
            <div className="grid gap-6 md:grid-cols-4">
            <MetricCard
                title="Lotes Únicos"
                value={stats.count}
                icon={Activity}
                delay={0.1}
                className="border-l-4 border-l-primary"
            />
            <MetricCard
                title="Promedio Real"
                value={`${stats.avg} min`}
                subtitle={`Meta Global: ${theoreticalDuration} min`}
                icon={Clock}
                delay={0.2}
                trend={stats.avg > theoreticalDuration ? "down" : "up"}
                trendValue={stats.avg > theoreticalDuration ? "Excede Meta" : "En Meta"}
                className={stats.avg > theoreticalDuration ? "border-l-4 border-l-destructive" : "border-l-4 border-l-green-500"}
            />
            <MetricCard
                title="Desviación Máxima"
                value={`+${Math.round((stats.max - theoreticalDuration) * 100) / 100} min`}
                subtitle={`Peor caso: ${stats.max} min`}
                icon={TrendingUp}
                delay={0.3}
                className="border-l-4 border-l-chart-delay"
            />
            <MetricCard
                title="Cumplimiento"
                value={`${compliancePercentage}%`}
                subtitle="Lotes dentro de meta"
                icon={CheckCircle}
                delay={0.4}
                trend={compliancePercentage > 80 ? "up" : "down"}
                className={compliancePercentage > 80 ? "border-l-4 border-l-green-500" : "border-l-4 border-l-amber-500"}
            />
            </div>
            {}
            <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-6"
            >
            <TrendAreaChart data={chartData} theoreticalDuration={theoreticalDuration} />
            </motion.div>
        </div>
      </AnimatedPage>
    </DashboardLayout>
  );
}