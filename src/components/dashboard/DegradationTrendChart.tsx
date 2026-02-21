import { useMemo, useEffect } from "react";
import { BatchRecord } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine
} from "recharts";
import { ChartTooltip } from "@/components/ui/ChartTooltip";

interface DegradationTrendChartProps {
  data: BatchRecord[];
  selectedMachine: string;
  setSelectedMachine: (val: string) => void;
  selectedStep: string;
  setSelectedStep: (val: string) => void;
}

export function DegradationTrendChart({ 
    data, 
    selectedMachine, 
    setSelectedMachine, 
    selectedStep, 
    setSelectedStep 
}: DegradationTrendChartProps) {
  
  // Extraer las combinaciones únicas de Máquina -> Pasos
  const { machineNames, machineStepsMap } = useMemo(() => {
     const machines = new Set<string>();
     const map = new Map<string, Set<string>>();

     data.forEach(batch => {
         const machine = batch.TEILANL_GRUPO || "Desconocida";
         machines.add(machine);
         
         if (!map.has(machine)) map.set(machine, new Set());
         const currentSteps = map.get(machine)!;
         
         batch.steps.forEach(step => {
             currentSteps.add(step.stepName);
         });
     });

     const processedMap = new Map<string, string[]>();
     map.forEach((steps, machine) => {
         processedMap.set(machine, Array.from(steps).sort());
     });

     return {
         machineNames: Array.from(machines).sort(),
         machineStepsMap: processedMap
     };
  }, [data]);

  // Si no hay máquina seleccionada, intentar asignar una por defecto
  useEffect(() => {
      if (!selectedMachine && machineNames.length > 0) {
          const match = machineNames.find(m => m.toLowerCase().includes('filtro') || m.toLowerCase().includes('descarga'));
          setSelectedMachine(match || machineNames[0]);
      }
  }, [machineNames, selectedMachine, setSelectedMachine]);

  const availableSteps = useMemo(() => {
      if (!selectedMachine || !machineStepsMap.has(selectedMachine)) return [];
      return machineStepsMap.get(selectedMachine)!;
  }, [selectedMachine, machineStepsMap]);

  // Si no hay paso seleccionado (o la máquina cambió y el paso actual dejó de ser válido), auto-seleccionar
  useEffect(() => {
      if (selectedMachine && availableSteps.length > 0) {
          if (!selectedStep || !availableSteps.includes(selectedStep)) {
              const match = availableSteps.find(s => s.toLowerCase().includes('bombeo') || s.toLowerCase().includes('descarga') || s.toLowerCase().includes('trub'));
              setSelectedStep(match || availableSteps[0]);
          }
      }
  }, [selectedMachine, availableSteps, selectedStep, setSelectedStep]);

  // Cada vez que cambia la máquina desde el Select, el useEffect de arriba se encargará de resetear el paso si es necesario
  const handleMachineChange = (val: string) => {
      setSelectedMachine(val);
  };

  // Preparar los datos para la gráfica filtrando por la máquina y paso seleccionados
  const chartData = useMemo(() => {
      if (!selectedMachine || !selectedStep) return [];

      // Sort chronological
      const sortedData = [...data].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

      return sortedData.map((batch, index) => {
          // Check if this batch belongs to the selected machine and has the step
          if (batch.TEILANL_GRUPO !== selectedMachine) return null;
          
          const targetStep = batch.steps.find(s => s.stepName === selectedStep);
          if (!targetStep) return null;

          return {
              batchId: batch.CHARG_NR,
              sequence: index + 1,
              "Tiempo Real (min)": targetStep.durationMin,
          };
      }).filter(Boolean) as any[]; // remove nulls

  }, [data, selectedMachine, selectedStep]);


  // Calcular la línea de tendencia simple usando mínimos cuadrados
  const trendData = useMemo(() => {
      if (chartData.length < 2) return chartData;

      const n = chartData.length;
      let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
      
      for (let i = 0; i < n; i++) {
          sumX += i;
          sumY += chartData[i]["Tiempo Real (min)"];
          sumXY += i * chartData[i]["Tiempo Real (min)"];
          sumXX += i * i;
      }

      const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
      const intercept = (sumY - slope * sumX) / n;

      return chartData.map((point, i) => ({
          ...point,
          "Línea de Tendencia": parseFloat((slope * i + intercept).toFixed(2))
      }));
  }, [chartData]);


  // Calcular el promedio general para trazar una línea base
  const averageDuration = useMemo(() => {
      if (chartData.length === 0) return 0;
      const sum = chartData.reduce((acc, curr) => acc + curr["Tiempo Real (min)"], 0);
      return sum / chartData.length;
  }, [chartData]);

  return (
    <Card className="bg-card shadow-sm border-border flex flex-col overflow-hidden">
      <CardHeader className="flex flex-col md:flex-row items-start justify-between pb-4 gap-4">
        <div className="space-y-1 md:max-w-[50%]">
            <CardTitle className="text-xl font-semibold text-foreground">
              Análisis Analítico de Tendencias de Operación
            </CardTitle>
            <CardDescription>
                Visualiza el incremento del tiempo real que toma una operación de equipo específica a lo largo del tiempo. Las desviaciones persistentes hacia arriba pueden requerir mantenimiento rutinario. (Se ignora SW por falta de fiabilidad).
            </CardDescription>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
            <Select value={selectedMachine} onValueChange={handleMachineChange}>
                <SelectTrigger className="w-[180px] h-9">
                    <SelectValue placeholder="Equipo" />
                </SelectTrigger>
                <SelectContent>
                    {machineNames.map(m => (
                        <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <Select value={selectedStep} onValueChange={setSelectedStep}>
                <SelectTrigger className="w-[200px] h-9">
                    <SelectValue placeholder="Paso/Operación" />
                </SelectTrigger>
                <SelectContent>
                    {availableSteps.map(s => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
      </CardHeader>
      
      <CardContent className="p-6 pt-0">
         {trendData.length > 0 ? (
            <div className="w-full h-[400px] mt-4">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                        data={trendData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} vertical={false}/>
                        <XAxis
                            dataKey="batchId"
                            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                            axisLine={{ stroke: 'hsl(var(--border))' }}
                            tickLine={false}
                        />
                        <YAxis
                            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                            axisLine={false}
                            tickLine={false}
                            domain={['auto', 'auto']}
                            tickFormatter={(v) => `${v}m`}
                        />
                        <Tooltip content={<ChartTooltip indicator="line" valueSuffix="min" />} cursor={{ stroke: 'hsl(var(--muted))', strokeWidth: 2 }} />
                        <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                        
                        <ReferenceLine 
                            y={averageDuration} 
                            stroke="hsl(var(--muted-foreground)/0.5)" 
                            strokeDasharray="5 5"
                            label={{ position: 'insideTopLeft', value: 'Promedio Histórico', fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} 
                        />
                        
                        {/* Línea Principal de Realidad */}
                        <Line
                            type="monotone"
                            dataKey="Tiempo Real (min)"
                            stroke="hsl(var(--chart-real))"
                            strokeWidth={3}
                            dot={{ r: 4, fill: "hsl(var(--primary))", strokeWidth: 0 }}
                            activeDot={{ r: 6, strokeWidth: 0 }}
                        />

                        {/* Línea Calculada de Tendencia */}
                        <Line
                            type="monotone"
                            dataKey="Línea de Tendencia"
                            stroke="hsl(var(--destructive))"
                            strokeWidth={2}
                            strokeDasharray="4 4"
                            dot={false}
                            activeDot={false}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
         ) : (
            <div className="flex items-center justify-center h-[400px] w-full text-muted-foreground border border-dashed rounded-lg bg-muted/10">
                No hay datos suficientes para trazar una tendencia en esta combinación de Equipo/Paso.
            </div>
         )}
      </CardContent>
    </Card>
  );
}
