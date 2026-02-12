import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";
import { getAveragesByMachine, BatchRecord } from "@/data/mockData";
import { cn } from "@/lib/utils";
import { ChartTooltip } from "@/components/ui/ChartTooltip";

interface EfficiencyChartProps {
  data: BatchRecord[];
  className?: string;
  titleClassName?: string;
}

export function EfficiencyChart({ data, className, titleClassName }: EfficiencyChartProps) {
  // Traducimos las claves del objeto de datos
  const chartData = getAveragesByMachine(data).map(item => ({
    machine: item.machine.replace(/(\d)/, '\n$1'),
    "Tiempo Esperado": item.avgExpected,
    "Tiempo Real": item.avgReal,
  }));

  return (
    <Card className="bg-card border-border h-full flex flex-col overflow-hidden">
      <CardHeader>
        <CardTitle className={cn("text-lg font-semibold text-foreground", titleClassName)}>
          Eficiencia Promedio por Grupo
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 min-h-0 overflow-hidden">
        <div className={cn("h-[400px] w-full", className)}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
                opacity={0.5}
              />
              <XAxis
                dataKey="machine"
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                tickLine={{ stroke: 'hsl(var(--border))' }}
                interval={0}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                tickLine={{ stroke: 'hsl(var(--border))' }}
                label={{
                  value: 'Minutos',
                  angle: -90,
                  position: 'insideLeft',
                  fill: 'hsl(var(--muted-foreground))'
                }}
              />
              <Tooltip
                content={<ChartTooltip indicator="line" />}
                cursor={{ fill: 'hsl(var(--muted)/0.4)' }}
              />
              <Legend
                wrapperStyle={{ paddingTop: '20px' }}
              />
              <Bar
                dataKey="Tiempo Esperado"
                name="Tiempo Esperado"
                fill="hsl(var(--chart-expected))"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="Tiempo Real"
                name="Tiempo Real"
                fill="hsl(var(--chart-real))"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}