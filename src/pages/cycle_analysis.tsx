import { useMemo, useState, useRef, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/dashboard_layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useData } from "@/context/data_context";
import { useLocalStorage } from "@/hooks/use_local_storage";
import { format, parseISO } from "date-fns";
import { AlertCircle, Clock, TrendingUp, Activity, CheckCircle, Printer, CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { calculateMergedDuration } from "@/utils/time_utils";
import { TrendAreaChart } from "@/components/analysis/trend_area_chart";
import { EquipmentGanttChart } from "@/components/analysis/equipment_gantt_chart";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { AnimatedPage } from "@/components/layout/animated_page";
import { startOfDay, endOfDay } from "date-fns";
import { MultiSelect } from "@/components/ui/multi_select";
import { MetricCard } from "@/components/ui/metric_card";
import { LoadingState } from "@/components/ui/loading_state";
import { motion } from "framer-motion";
import { useReactToPrint } from "react-to-print";
export default function CycleAnalysis() {
  const { data } = useData();
  const [selectedProduct, setSelectedProduct] = useLocalStorage<string>("cycle-product", "");
  const [theoreticalDuration, setTheoreticalDuration] = useLocalStorage<number>("cycle-theoretical", 120);
  const [selectedStep, setSelectedStep] = useState<string>("FULL_CYCLE");
  const [activeTab, setActiveTab] = useState<string>("area");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedBatches, setSelectedBatches] = useState<string[]>([]);
  const [selectedEquipments, setSelectedEquipments] = useState<string[]>([]);
  const componentRef = useRef<HTMLDivElement>(null);

  const availableDates = useMemo(() => {
    if (!data) return [];
    const dateSet = new Set<string>();
    
    data.forEach(batch => {
        if (!batch.timestamp) return;
        if (selectedProduct && selectedProduct !== "ALL" && batch.productName !== selectedProduct) return;
        
        let batchStart = new Date(batch.timestamp).getTime();
        if (batch.steps && batch.steps.length > 0) {
            const firstStep = batch.steps.find(s => s.startTime);
            if (firstStep?.startTime) batchStart = parseISO(firstStep.startTime).getTime();
        }
        
        const dateStr = format(new Date(batchStart), "yyyy-MM-dd");
        dateSet.add(dateStr);
    });
    
    return Array.from(dateSet).sort().reverse(); 
  }, [data, selectedProduct]);

  useEffect(() => {
      if (availableDates.length > 0 && (!selectedDate || !availableDates.includes(selectedDate))) {
          setSelectedDate(availableDates[0]);
      }
  }, [availableDates, selectedDate]);
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
  
  const availableBatches = useMemo(() => {
    if (!data) return [];
    const targetDate = selectedDate ? new Date(`${selectedDate}T00:00:00`) : new Date();
    const dayStart = startOfDay(targetDate).getTime();
    const dayEnd = endOfDay(targetDate).getTime();
    
    const batches = new Set<string>();
    
    data.forEach(batch => {
        if (!batch.timestamp) return;
        if (selectedProduct && batch.productName !== selectedProduct) return;
        
        let batchStart = new Date(batch.timestamp).getTime();
        let batchEnd = batchStart + ((batch.real_total_min || 0) * 60000);
        
        if (batch.steps && batch.steps.length > 0) {
            const firstStep = batch.steps.find(s => s.startTime);
            const lastStep = batch.steps[batch.steps.length - 1];
            if (firstStep?.startTime) batchStart = parseISO(firstStep.startTime).getTime();
            if (lastStep?.endTime) batchEnd = parseISO(lastStep.endTime).getTime();
        }
        
        if (batchEnd < dayStart || batchStart > dayEnd) return; 
        
        if (batch.CHARG_NR) {
            batches.add(batch.CHARG_NR);
        }
    });
    
    return Array.from(batches).sort();
  }, [data, selectedDate, selectedProduct]);

  const availableEquipments = useMemo(() => {
    if (!data) return [];
    
    const equipSet = new Set<string>();
    data.forEach(batch => {
        if (batch.TEILANL_GRUPO) {
            equipSet.add(batch.TEILANL_GRUPO);
        }
    });
    
    return Array.from(equipSet).sort();
  }, [data]);

  const ganttData = useMemo(() => {
      if (!data) return [];
      const targetDate = selectedDate ? new Date(`${selectedDate}T00:00:00`) : new Date();
      const dayStart = startOfDay(targetDate).getTime();
      const dayEnd = endOfDay(targetDate).getTime();
      
      const batchesByMachine = new Map<string, any[]>();
      
      data.forEach(batch => {
          if (!batch.timestamp) return;
          let batchStart = new Date(batch.timestamp).getTime();
          let batchEnd = batchStart + ((batch.real_total_min || 0) * 60000);
          
          if (batch.steps && batch.steps.length > 0) {
              const firstStep = batch.steps.find(s => s.startTime);
              const lastStep = batch.steps[batch.steps.length - 1];
              if (firstStep?.startTime) batchStart = parseISO(firstStep.startTime).getTime();
              if (lastStep?.endTime) batchEnd = parseISO(lastStep.endTime).getTime();
          }
          
          if (batchEnd < dayStart || batchStart > dayEnd) return;
          
          if (selectedBatches.length > 0 && !selectedBatches.includes(batch.CHARG_NR)) return;
          
          const machine = batch.TEILANL_GRUPO;
          if (!machine) return;
          
          if (selectedEquipments.length > 0 && !selectedEquipments.includes(machine)) return;
          
          if (!batchesByMachine.has(machine)) {
              batchesByMachine.set(machine, []);
          }
          
          batchesByMachine.get(machine)!.push({
              batchId: batch.CHARG_NR,
              productName: batch.productName,
              startTime: new Date(batchStart),
              endTime: new Date(batchEnd),
              durationMin: Math.round((batchEnd - batchStart) / 60000)
          });
      });
      const parseMachineKey = (machineName: string) => {
          const PROCESS_ORDER: Record<string, number> = {
              "Cortar": 1,
              "Malta": 2,
              "Adjuntos": 3,
              "Cocedor": 4,
              "Macerador": 5,
              "Filtro": 6,
              "Lavado": 7,
              "Olla": 8,
              "Lupulo": 9,
              "Dos": 10,
              "Whirlpool": 11,
              "Enfriador": 12,
          };
      
          const matchMatch = machineName.match(/^(.*?)(\d+)$/);
          let num = 0;
          let base = machineName.trim();
      
          if (matchMatch) {
             num = parseInt(matchMatch[2], 10);
             base = matchMatch[1].trim();
             if (base.endsWith('.')) base = base.slice(0, -1).trim();
          }
          
          let order = 99;
          for (const key of Object.keys(PROCESS_ORDER)) {
              if (base.includes(key)) {
                  order = PROCESS_ORDER[key];
                  break;
              }
          }
          
          return { num, order, base };
      };

      return Array.from(batchesByMachine.entries()).map(([machineName, events]) => ({
          machineName,
          events
      })).sort((a, b) => {
          const keyA = parseMachineKey(a.machineName);
          const keyB = parseMachineKey(b.machineName);
          if (keyA.num !== keyB.num) return keyA.num - keyB.num;
          if (keyA.order !== keyB.order) return keyA.order - keyB.order;
          return keyA.base.localeCompare(keyB.base);
      });
  }, [data, selectedDate, selectedBatches, selectedEquipments]);

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
            <p className="text-muted-foreground mt-1">Comparativa: Área Verde (Setpoint) vs Área Azul (Real).</p>
          </div>
          <div className="flex items-center gap-3">
             <Button variant="outline" className="shadow-sm hover:border-primary/50 transition-colors" onClick={() => handlePrint()}>
                  <Printer className="mr-2 h-4 w-4" /> Imprimir PDF
              </Button>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row flex-wrap gap-3 bg-card/50 backdrop-blur-sm p-3 rounded-lg border border-border shadow-sm print:hidden">
            <div className="w-full sm:w-[200px]">
              <Label className="text-xs text-muted-foreground mb-1 block">Producto</Label>
              <Select value={selectedProduct || "ALL"} onValueChange={(val) => setSelectedProduct(val === "ALL" ? "" : val)}>
                <SelectTrigger className="h-8 bg-background/50"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos los productos</SelectItem>
                  {uniqueProducts.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {activeTab === "area" && (
                <div className="w-full sm:w-[200px]">
                  <Label className="text-xs text-muted-foreground mb-1 block">Fase / Paso (Área)</Label>
                  <Select value={selectedStep} onValueChange={setSelectedStep}>
                    <SelectTrigger className="h-8 bg-background/50"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FULL_CYCLE">Ciclo Completo (Total)</SelectItem>
                      {uniqueSteps.map(step => <SelectItem key={step} value={step}>{step}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
            )}
            {activeTab === "gantt" && (
                <>
                    <div className="w-full sm:w-[160px]">
                      <Label className="text-xs text-muted-foreground mb-1 block">Día Gantt</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full h-8 justify-start text-left font-normal bg-background/50",
                              !selectedDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {selectedDate ? format(parseISO(selectedDate), "dd/MM/yyyy") : <span>Elige fecha</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={selectedDate ? parseISO(selectedDate) : undefined}
                            onSelect={(date) => date && setSelectedDate(format(date, "yyyy-MM-dd"))}
                            disabled={(date) => !availableDates.includes(format(date, "yyyy-MM-dd"))}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="w-full sm:w-[250px]">
                      <Label className="text-xs text-muted-foreground mb-1 block">Filtro Lotes</Label>
                      <MultiSelect
                        options={availableBatches}
                        selected={selectedBatches}
                        onChange={setSelectedBatches}
                        placeholder={availableBatches.length > 0 ? "Todos los del día..." : "Sin lotes en el día"}
                        className="bg-background/50 max-h-8 overflow-y-auto"
                      />
                    </div>
                    <div className="w-full sm:w-[250px]">
                      <Label className="text-xs text-muted-foreground mb-1 block">Filtro Equipos</Label>
                      <MultiSelect
                        options={availableEquipments}
                        selected={selectedEquipments}
                        onChange={setSelectedEquipments}
                        placeholder="Todos los equipos..."
                        className="bg-background/50 max-h-8 overflow-y-auto"
                      />
                    </div>
                </>
            )}
            {activeTab === "area" && (
                <div className="w-full sm:w-[120px]">
                  <Label className="text-xs text-muted-foreground mb-1 block">Meta Global (min)</Label>
                  <Input
                    type="number"
                    className="h-8 bg-background/50"
                    value={theoreticalDuration}
                    onChange={(e) => setTheoreticalDuration(Number(e.target.value))}
                  />
                </div>
            )}
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
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
                <TabsList className="mb-4">
                    <TabsTrigger value="area">Análisis de Áreas</TabsTrigger>
                    <TabsTrigger value="gantt">Gantt por Equipos</TabsTrigger>
                </TabsList>
                <TabsContent value="area" className="outline-none">
                    <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    >
                        <TrendAreaChart data={chartData} theoreticalDuration={theoreticalDuration} />
                    </motion.div>
                </TabsContent>
                <TabsContent value="gantt" className="outline-none h-[640px]">
                    <EquipmentGanttChart data={ganttData} selectedDate={selectedDate ? new Date(`${selectedDate}T00:00:00`) : new Date()} />
                </TabsContent>
            </Tabs>
        </div>
      </AnimatedPage>
    </DashboardLayout>
  );
}