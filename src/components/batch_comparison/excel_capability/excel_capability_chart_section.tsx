import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ReferenceLine,
  Label,
} from "recharts";
import { Activity, Loader2 } from "lucide-react";

interface ExcelCapabilityChartSectionProps {
  filteredValuesLength: number;
  stats: any;
  chartDataBase: any[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background/90 backdrop-blur-md border border-border p-3 rounded-lg shadow-xl">
        <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Valor: {label}</p>
        <p className="text-sm font-bold text-primary">
          Densidad: <span className="font-mono">{parseFloat(payload[0].value).toFixed(4)}</span>
        </p>
      </div>
    );
  }
  return null;
};

export function ExcelCapabilityChartSection({
  filteredValuesLength,
  stats,
  chartDataBase
}: ExcelCapabilityChartSectionProps) {
  if (filteredValuesLength === 0) {
    return (
       <div className="flex h-[400px] items-center justify-center flex-col gap-2 text-muted-foreground w-full">
         <Activity className="h-10 w-10 opacity-20" />
         <p>No hay datos disponibles para los filtros seleccionados.</p>
       </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex h-[400px] items-center justify-center flex-col gap-2 text-muted-foreground w-full">
        <Loader2 className="h-10 w-10 opacity-20 animate-spin" />
        <p>Procesando estadísticas...</p>
      </div>
    );
  }

  return (
    <div className="h-[400px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartDataBase} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <defs>
            <linearGradient id="colorExcel" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#d946ef" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#d946ef" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" opacity={0.1} vertical={false} />
          <XAxis 
            dataKey="x" 
            type="number" 
            domain={['dataMin', 'dataMax']} 
            tick={{ fontSize: 10 }}
            tickFormatter={(val: number) => val.toFixed(2)}
          />
          <YAxis hide />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="y"
            stroke="#d946ef"
            fill="#d946ef1a"
            strokeWidth={2}
            animationDuration={1000}
          />
          
          <ReferenceLine x={stats.mean} stroke="#d946ef" strokeDasharray="3 3">
            <Label value="Media" position="top" fill="#d946ef" fontSize={10} />
          </ReferenceLine>

          <ReferenceLine x={stats.lei} stroke="#ef4444" strokeWidth={2}>
            <Label value={`LEI: ${stats.lei}`} position="insideTopLeft" fill="#ef4444" fontSize={10} fontWeight="bold" />
          </ReferenceLine>

          <ReferenceLine x={stats.target} stroke="#10b981" strokeWidth={2} strokeDasharray="5 5">
            <Label value={`Target: ${stats.target.toFixed(2)}`} position="top" fill="#10b981" fontSize={10} fontWeight="bold" />
          </ReferenceLine>

          <ReferenceLine x={stats.les} stroke="#ef4444" strokeWidth={2}>
            <Label value={`LES: ${stats.les}`} position="insideTopRight" fill="#ef4444" fontSize={10} fontWeight="bold" />
          </ReferenceLine>
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
