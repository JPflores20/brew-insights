import { useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { AlertTriangle, Clock } from "lucide-react";
import { useData } from "@/context/DataContext";
import { getUniqueMachineGroups, getMachineData } from "@/data/mockData";
import { useLocalStorage } from "@/hooks/use-local-storage"; // Importamos el hook

export default function MachineDetail() {
  const { data } = useData();
  const machineGroups = getUniqueMachineGroups(data);
  
  // Usamos useLocalStorage con una key única para persistir la selección
  const [selectedMachine, setSelectedMachine] = useLocalStorage<string>("machine-detail-selection", "");

  useEffect(() => {
    if (machineGroups.length > 0) {
      // Si no hay selección o la máquina guardada no existe en los datos actuales, seleccionamos la primera
      if (!selectedMachine || !machineGroups.includes(selectedMachine)) {
        setSelectedMachine(machineGroups[0]);
      }
    }
  }, [machineGroups, selectedMachine, setSelectedMachine]);

  if (data.length === 0) {
    return (
      <DashboardLayout>
        <div className="flex h-[50vh] items-center justify-center">
          <div className="text-center text-muted-foreground">
            <Clock className="mx-auto h-12 w-12 opacity-50 mb-4" />
            <h2 className="text-xl font-semibold">Sin Datos</h2>
            <p>Por favor carga un archivo Excel en la pestaña "Overview" primero.</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const machineData = getMachineData(data, selectedMachine);
  
  // Datos para el gráfico
  const chartData = machineData
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    .map((record) => ({
      batchId: record.CHARG_NR,
      realTime: record.real_total_min,
      idle: record.idle_wall_minus_sumsteps_min,
    }));

  // Estadísticas Corregidas
  // Usamos max_gap_min para el "Mayor Gap" en lugar de el tiempo muerto total
  const maxGap = machineData.length > 0 ? Math.max(...machineData.map(r => r.max_gap_min)) : 0;
  
  // Promedio de tiempo muerto por ciclo
  const avgIdle = machineData.length > 0 ? Math.round(machineData.reduce((sum, r) => sum + r.idle_wall_minus_sumsteps_min, 0) / machineData.length) : 0;

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-in fade-in duration-500">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Detalle por Equipo</h1>
          <p className="text-muted-foreground">Análisis de tendencia y tiempos muertos</p>
        </div>

        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-medium">Seleccionar Equipo</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedMachine} onValueChange={setSelectedMachine}>
              <SelectTrigger className="w-full md:w-[300px]">
                <SelectValue placeholder="Selecciona una máquina" />
              </SelectTrigger>
              <SelectContent>
                {machineGroups.map(name => (
                  <SelectItem key={name} value={name}>{name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card className="bg-card border-border">
            <CardContent className="pt-6 flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Mayor Gap Detectado</p>
                <p className="text-3xl font-bold mt-2 text-chart-delay">{maxGap} min</p>
                <p className="text-xs text-muted-foreground">Pausa más larga en un solo paso</p>
              </div>
              <div className="p-4 rounded-full bg-chart-delay/10">
                <AlertTriangle className="h-8 w-8 text-chart-delay" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="pt-6 flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tiempo Muerto Promedio</p>
                <p className="text-3xl font-bold mt-2 text-blue-500">{avgIdle} min</p>
                <p className="text-xs text-muted-foreground">Suma de pausas por ciclo</p>
              </div>
              <div className="p-4 rounded-full bg-blue-500/10">
                <Clock className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-card border-border h-[450px] p-6">
          <CardTitle className="mb-6 text-lg font-semibold">
            Tendencia de Tiempo Real por Lote
          </CardTitle>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRealTime" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} vertical={false} />
                <XAxis 
                  dataKey="batchId" 
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} 
                  tickLine={false}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  padding={{ left: 20, right: 20 }}
                />
                <YAxis 
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  tickLine={false}
                  axisLine={false}
                  label={{ 
                    value: 'Minutos', 
                    angle: -90, 
                    position: 'insideLeft', 
                    fill: 'hsl(var(--muted-foreground))',
                    style: { textAnchor: 'middle' }
                  }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--popover))', 
                    borderColor: 'hsl(var(--border))', 
                    borderRadius: '8px' 
                  }}
                  labelStyle={{ color: 'hsl(var(--popover-foreground))', fontWeight: 'bold' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="realTime" 
                  stroke="#8884d8" 
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorRealTime)"
                  name="Tiempo Real"
                  activeDot={{ r: 6, strokeWidth: 2, stroke: 'white' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}