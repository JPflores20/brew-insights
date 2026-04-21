
import { useMemo } from "react";
import { useData } from "@/context/data_context";
import { getColdBlockData, getColdBlockMetrics } from "@/utils/cold_block_utils";
import { MetricCard } from "@/components/ui/metric_card";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Thermometer, 
  Container, 
  Activity, 
  Clock,
  PieChart as PieChartIcon,
  Info
} from "lucide-react";
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip, 
  Legend 
} from "recharts";
import { motion } from "framer-motion";
import { ChartTooltip } from "@/components/ui/chart_tooltip";

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export function ColdBlockSummary() {
  const { coldBlockData } = useData();
  
  const coldData = useMemo(() => getColdBlockData(coldBlockData), [coldBlockData]);
  const metrics = useMemo(() => getColdBlockMetrics(coldBlockData), [coldBlockData]);

  const distributionData = useMemo(() => {
    const groups = new Map<string, number>();
    coldData.forEach(d => {
      const type = d.TEILANL_GRUPO.split(' ')[0] || 'Otros';
      groups.set(type, (groups.get(type) || 0) + 1);
    });
    
    return Array.from(groups.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [coldData]);

  if (coldData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center p-8 bg-slate-900/20 rounded-2xl border border-slate-800/50 backdrop-blur-sm">
        <Info className="h-16 w-16 text-slate-500 mb-4 opacity-20" />
        <h3 className="text-xl font-semibold text-slate-300">No hay datos de Bloque Frío</h3>
        <p className="text-slate-500 max-w-md mt-2">
          Carga archivos DBF correspondientes a fermentación y maduración para visualizar las métricas.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard 
          title="Cocimientos en Frío" 
          value={metrics.totalBatches} 
          subtitle="Procesados en el periodo" 
          icon={Activity}
          className="border-l-4 border-l-blue-500"
        />
        <MetricCard 
          title="Tanques Activos" 
          value={metrics.activeTanks} 
          subtitle="Equipos utilizados" 
          icon={Container}
          className="border-l-4 border-l-emerald-500"
        />
        <MetricCard 
          title="T. Prom. Enfriamiento" 
          value={`${metrics.avgCoolingTime} min`} 
          subtitle="Media por cocimiento" 
          icon={Clock}
          className="border-l-4 border-l-amber-500"
        />
        <MetricCard 
          title="Registros Totales" 
          value={metrics.recordCount} 
          subtitle="Eventos procesados" 
          icon={Thermometer}
          className="border-l-4 border-l-purple-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 bg-slate-900/40 border-slate-800/50 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <PieChartIcon className="h-5 w-5 text-blue-400" />
              Distribución de Equipos
            </CardTitle>
            <CardDescription>Uso relativo de tanques y sistemas por tipo</CardDescription>
          </CardHeader>
          <CardContent className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={distributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                  animationBegin={200}
                >
                  {distributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(0,0,0,0.1)" />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip indicator="dot" hideLabel />} />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/40 border-slate-800/50 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Información del Bloque</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
              <h4 className="text-sm font-medium text-blue-400 mb-1">Estado del Sistema</h4>
              <p className="text-xs text-slate-400">
                Los datos actuales muestran la recepción y enfriamiento inicial de los cocimientos en el bloque frío.
              </p>
            </div>
            
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-slate-300">Próximas Funcionalidades</h4>
              <ul className="space-y-3">
                <li className="flex items-center gap-3 text-xs text-slate-400">
                  <div className="h-1.5 w-1.5 rounded-full bg-slate-600" />
                  Seguimiento de curvas de fermentación
                </li>
                <li className="flex items-center gap-3 text-xs text-slate-400">
                  <div className="h-1.5 w-1.5 rounded-full bg-slate-600" />
                  Alertas de temperatura de maduración
                </li>
                <li className="flex items-center gap-3 text-xs text-slate-400">
                  <div className="h-1.5 w-1.5 rounded-full bg-slate-600" />
                  Pronóstico de fin de fermentación
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
