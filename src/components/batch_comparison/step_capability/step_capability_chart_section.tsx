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
import { Activity, Beaker, FileSpreadsheet } from "lucide-react";

interface StepCapabilityChartSectionProps {
  selectedMachinesLength: number;
  analysisValuesLength: number;
  stats: any;
  chartData: any[];
  lei: number | "";
  les: number | "";
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background/90 backdrop-blur-md border border-border p-3 rounded-lg shadow-xl">
        <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Valor: {label}</p>
        <p className="text-sm font-bold text-[#8b5cf6]">
          Densidad: <span className="font-mono">{parseFloat(payload[0].value).toFixed(4)}</span>
        </p>
      </div>
    );
  }
  return null;
};

export function StepCapabilityChartSection({
  selectedMachinesLength,
  analysisValuesLength,
  stats,
  chartData,
  lei,
  les
}: StepCapabilityChartSectionProps) {
  const nLei = Number(lei);
  const nLes = Number(les);

  if (selectedMachinesLength === 0) {
    return (
      <div className="flex h-[400px] items-center justify-center flex-col gap-2 text-muted-foreground p-8 text-center w-full">
        <Activity className="h-10 w-10 opacity-20" />
        <p>Selecciona uno o más equipos y paso para comenzar el análisis.</p>
      </div>
    );
  }

  if (analysisValuesLength === 0) {
    return (
       <div className="flex h-[400px] items-center justify-center flex-col gap-2 text-muted-foreground w-full">
         <Beaker className="h-10 w-10 opacity-20" />
         <p>No se encontraron datos para la combinación seleccionada.</p>
       </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex h-[400px] items-center justify-center flex-col gap-2 text-muted-foreground w-full">
        <FileSpreadsheet className="h-10 w-10 opacity-20" />
        <p>Se requieren al menos 2 datos para generar el análisis estadístico.</p>
      </div>
    );
  }

  return (
    <div className="h-[400px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <defs>
            <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" opacity={0.1} vertical={false} />
          <XAxis 
            dataKey="x" 
            type="number" 
            domain={['dataMin', 'dataMax']} 
            tick={{ fontSize: 10 }}
            tickFormatter={(val: number) => val.toFixed(1)}
          />
          <YAxis hide />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="y"
            stroke="#8b5cf6"
            fill="url(#colorTemp)"
            strokeWidth={2}
            animationDuration={1000}
          />
          
          <ReferenceLine x={stats.mean} stroke="#8b5cf6" strokeDasharray="3 3">
            <Label value="Media" position="top" fill="#8b5cf6" fontSize={10} />
          </ReferenceLine>

          {(nLei !== 0 || nLes !== 0) && (
            <ReferenceLine x={stats.target} stroke="#10b981" strokeWidth={2} strokeDasharray="5 5">
              <Label value={`Target: ${stats.target.toFixed(2)}`} position="top" fill="#10b981" fontSize={10} fontWeight="bold" />
            </ReferenceLine>
          )}

          {nLei !== 0 && (
            <ReferenceLine x={nLei} stroke="#ef4444" strokeWidth={2}>
              <Label value={`LEI: ${nLei}`} position="insideTopLeft" fill="#ef4444" fontSize={10} fontWeight="bold" />
            </ReferenceLine>
          )}
          {nLes !== 0 && (
            <ReferenceLine x={nLes} stroke="#ef4444" strokeWidth={2}>
              <Label value={`LES: ${nLes}`} position="insideTopRight" fill="#ef4444" fontSize={10} fontWeight="bold" />
            </ReferenceLine>
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
