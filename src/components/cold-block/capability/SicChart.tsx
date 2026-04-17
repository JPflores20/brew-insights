import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  ReferenceLine,
  Label
} from "recharts";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface SicChartProps {
  data: any[];
  xKey: string;
  yKey: string;
  lei?: number | "";
  les?: number | "";
  yLabel?: string;
}

export function SicChart({ data, xKey, yKey, lei, les, yLabel }: SicChartProps) {
  return (
    <div className="h-[400px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.1} vertical={false} />
          <XAxis 
            dataKey={xKey} 
            stroke="#94a3b8"
            fontSize={10}
            tickFormatter={(val) => {
              if (val instanceof Date) return format(val, "dd/MM", { locale: es });
              return val;
            }}
          />
          <YAxis 
            stroke="#94a3b8"
            fontSize={10}
            domain={['auto', 'auto']}
          />
          <Tooltip 
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                const dateStr = label instanceof Date ? format(label, "dd/MM/yyyy HH:mm", { locale: es }) : label;
                return (
                  <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 p-3 rounded-lg shadow-xl">
                    <p className="text-[10px] uppercase font-bold text-slate-500 mb-1">{dateStr}</p>
                    <p className="text-sm font-bold text-blue-400">
                      {yLabel || 'Valor'}: <span className="font-mono">{payload[0].value}</span>
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          
          <Line 
            type="monotone" 
            dataKey={yKey} 
            stroke="#3b82f6" 
            strokeWidth={2} 
            dot={{ r: 3, fill: '#3b82f6', strokeWidth: 0 }}
            activeDot={{ r: 5, strokeWidth: 0 }} 
          />

          {lei !== "" && lei !== undefined && (
            <ReferenceLine y={lei} stroke="#ef4444" strokeDasharray="3 3">
              <Label value={`LEI: ${lei}`} position="insideBottomLeft" fill="#ef4444" fontSize={9} />
            </ReferenceLine>
          )}

          {les !== "" && les !== undefined && (
            <ReferenceLine y={les} stroke="#ef4444" strokeDasharray="3 3">
              <Label value={`LES: ${les}`} position="insideTopLeft" fill="#ef4444" fontSize={9} />
            </ReferenceLine>
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
