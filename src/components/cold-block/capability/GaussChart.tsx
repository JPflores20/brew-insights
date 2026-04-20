import { useMemo } from "react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  ReferenceLine,
  Label
} from "recharts";
import { CapabilityStats, generateGaussianPoints } from "@/utils/stats_utils";

interface GaussChartProps {
  stats: CapabilityStats | null;
  title?: string;
}

export function GaussChart({ stats, title }: GaussChartProps) {
  const chartData = useMemo(() => {
    if (!stats) return [];
    return generateGaussianPoints(stats);
  }, [stats]);

  if (!stats) return null;

  return (
    <div className="h-full w-full min-h-[250px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <defs>
            <linearGradient id="colorGauss" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" opacity={0.1} vertical={false} />
          <XAxis 
            dataKey="x" 
            type="number" 
            domain={['dataMin', 'dataMax']} 
            stroke="#94a3b8"
            fontSize={10}
            tickFormatter={(val) => val.toFixed(2)}
          />
          <YAxis hide />
          <Tooltip 
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 p-3 rounded-lg shadow-xl">
                    <p className="text-[10px] uppercase font-bold text-slate-500 mb-1">Valor: {label}</p>
                    <p className="text-sm font-bold text-blue-400">
                      Densidad: <span className="font-mono">{parseFloat(payload[0].value).toFixed(4)}</span>
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Area
            type="monotone"
            dataKey="y"
            stroke="#3b82f6"
            fill="url(#colorGauss)"
            strokeWidth={2}
            animationDuration={1000}
          />
          
          {/* Mean Line */}
          <ReferenceLine x={stats.mean} stroke="#3b82f6" strokeDasharray="3 3">
            <Label value="Media" position="top" fill="#3b82f6" fontSize={10} />
          </ReferenceLine>

          {/* LEI Line */}
          <ReferenceLine x={stats.lei} stroke="#ef4444" strokeWidth={2}>
            <Label value={`LEI: ${stats.lei}`} position="insideTopLeft" fill="#ef4444" fontSize={10} fontWeight="bold" />
          </ReferenceLine>

          {/* Target Line */}
          <ReferenceLine x={stats.target} stroke="#10b981" strokeWidth={2} strokeDasharray="5 5">
            <Label value={`Target: ${stats.target.toFixed(2)}`} position="top" fill="#10b981" fontSize={10} fontWeight="bold" />
          </ReferenceLine>

          {/* LES Line */}
          <ReferenceLine x={stats.les} stroke="#ef4444" strokeWidth={2}>
            <Label value={`LES: ${stats.les}`} position="insideTopRight" fill="#ef4444" fontSize={10} fontWeight="bold" />
          </ReferenceLine>
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
