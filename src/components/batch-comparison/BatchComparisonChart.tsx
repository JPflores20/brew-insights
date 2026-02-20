// src/components/batch-comparison/BatchComparisonChart.tsx
// Gráfico de comparación de lotes con soporte Bar / Line / Area / Radar

import {
  BarChart, Bar,
  LineChart, Line,
  AreaChart, Area,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { ChartType } from "@/types";

const TOOLTIP_STYLE = {
  backgroundColor: "hsl(var(--popover))",
  borderColor: "hsl(var(--border))",
  borderRadius: "8px",
  color: "hsl(var(--popover-foreground))",
};

const AXIS_PROPS = {
  dataKey: "machine" as const,
  tick: { fill: "hsl(var(--muted-foreground))", fontSize: 12 },
  axisLine: { stroke: "hsl(var(--border))" },
  interval: 0,
  angle: -45,
  textAnchor: "end" as const,
  height: 80,
};

interface BatchComparisonChartProps {
  data: Record<string, unknown>[];
  batchA: string;
  batchB: string;
  chartType: ChartType;
  batchProductMap: Map<string, string>;
}

export function BatchComparisonChart({
  data,
  batchA,
  batchB,
  chartType,
  batchProductMap,
}: BatchComparisonChartProps) {
  const nameA = `Lote ${batchA} (${batchProductMap.get(batchA) || ""})`;
  const nameB = `Lote ${batchB} (${batchProductMap.get(batchB) || ""})`;

  return (
    <Card className="bg-card border-border">
      <CardContent className="pt-6">
        <div className="h-[500px]">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === "bar" ? (
              <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis {...AXIS_PROPS} />
                <YAxis label={{ value: "Minutos", angle: -90, position: "insideLeft", fill: "hsl(var(--muted-foreground))" }} tick={{ fill: "hsl(var(--muted-foreground))" }} axisLine={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "hsl(var(--muted)/0.2)" }} />
                <Legend wrapperStyle={{ paddingTop: "20px" }} />
                <Bar dataKey={batchA} fill="hsl(var(--primary))" name={nameA} radius={[4, 4, 0, 0]} />
                <Bar dataKey={batchB} fill="#3b82f6" name={nameB} radius={[4, 4, 0, 0]} />
              </BarChart>
            ) : chartType === "line" ? (
              <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis {...AXIS_PROPS} />
                <YAxis label={{ value: "Minutos", angle: -90, position: "insideLeft", fill: "hsl(var(--muted-foreground))" }} tick={{ fill: "hsl(var(--muted-foreground))" }} axisLine={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Legend wrapperStyle={{ paddingTop: "20px" }} />
                <Line type="monotone" dataKey={batchA} stroke="hsl(var(--primary))" strokeWidth={2} name={`Lote ${batchA}`} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey={batchB} stroke="#3b82f6" strokeWidth={2} name={`Lote ${batchB}`} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            ) : chartType === "area" ? (
              <AreaChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
                <defs>
                  <linearGradient id="colorBatchA" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorBatchB" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis {...AXIS_PROPS} />
                <YAxis label={{ value: "Minutos", angle: -90, position: "insideLeft", fill: "hsl(var(--muted-foreground))" }} tick={{ fill: "hsl(var(--muted-foreground))" }} axisLine={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Legend wrapperStyle={{ paddingTop: "20px" }} />
                <Area type="monotone" dataKey={batchA} stroke="hsl(var(--primary))" fill="url(#colorBatchA)" fillOpacity={0.4} name={`Lote ${batchA}`} />
                <Area type="monotone" dataKey={batchB} stroke="#3b82f6" fill="url(#colorBatchB)" fillOpacity={0.4} name={`Lote ${batchB}`} />
              </AreaChart>
            ) : (
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
                <PolarGrid stroke="hsl(var(--muted-foreground))" opacity={0.2} />
                <PolarAngleAxis dataKey="machine" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                <PolarRadiusAxis angle={30} domain={[0, "auto"]} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
                <Radar name={`Lote ${batchA}`} dataKey={batchA} stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.4} />
                <Radar name={`Lote ${batchB}`} dataKey={batchB} stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.4} />
                <Legend />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
              </RadarChart>
            )}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
