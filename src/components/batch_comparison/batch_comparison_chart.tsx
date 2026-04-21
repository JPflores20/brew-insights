
import {
  BarChart, Bar,
  LineChart, Line,
  AreaChart, Area,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { ChartType } from "@/types";
import { ChartTooltip } from "@/components/ui/chart_tooltip";
const CHART_COLORS = [
  "hsl(var(--primary))",
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4"
];
const COLOR_MUTED = "hsl(var(--muted-foreground))";
const COLOR_BORDER = "hsl(var(--border))";
const AXIS_PROPS = {
  dataKey: "machine" as const,
  tick: { fill: COLOR_MUTED, fontSize: 12 },
  axisLine: { stroke: COLOR_BORDER },
  interval: 0,
  angle: -45,
  textAnchor: "end" as const,
  height: 80,
};
const Y_AXIS_PROPS = {
  label: { value: "Minutos", angle: -90, position: "insideLeft", fill: COLOR_MUTED } as const, 
  tick: { fill: COLOR_MUTED },
  axisLine: false,
};
const LEGEND_PROPS = { wrapperStyle: { paddingTop: "20px" } };
interface BatchComparisonChartProps {
  data: Record<string, unknown>[];
  selectedBatches: string[];
  chartType: ChartType;
  batchProductMap: Map<string, string>;
}
export function BatchComparisonChart({
  data,
  selectedBatches,
  chartType,
  batchProductMap,
}: BatchComparisonChartProps) {
  const getBatchName = (id: string) => `Lote ${id} (${batchProductMap.get(id) || ""})`;

  const renderChartBody = () => {
    if (selectedBatches.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-muted-foreground space-y-2">
          <p className="text-lg font-medium">No hay lotes seleccionados</p>
          <p className="text-sm">Selecciona al menos un lote para visualizar la comparación.</p>
        </div>
      );
    }

    if (data.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground space-y-2">
              <p className="text-lg font-medium">No hay equipos seleccionados</p>
              <p className="text-sm">Selecciona al menos un equipo para visualizar los datos.</p>
            </div>
        );
    }

    if (chartType === "bar") {
      return (
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
          <XAxis {...AXIS_PROPS} />
          <YAxis {...Y_AXIS_PROPS} />
          <Tooltip content={<ChartTooltip valueSuffix="min" />} cursor={{ fill: "hsl(var(--muted)/0.2)" }} />
          <Legend {...LEGEND_PROPS} />
          {selectedBatches.map((id, index) => (
            <Bar 
              key={id} 
              dataKey={id} 
              fill={CHART_COLORS[index % CHART_COLORS.length]} 
              name={getBatchName(id)} 
              radius={[4, 4, 0, 0]} 
            />
          ))}
        </BarChart>
      );
    }
    if (chartType === "line") {
      return (
        <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
          <XAxis {...AXIS_PROPS} />
          <YAxis {...Y_AXIS_PROPS} />
          <Tooltip content={<ChartTooltip valueSuffix="min" />} />
          <Legend {...LEGEND_PROPS} />
          {selectedBatches.map((id, index) => (
            <Line 
              key={id} 
              type="monotone" 
              dataKey={id} 
              stroke={CHART_COLORS[index % CHART_COLORS.length]} 
              strokeWidth={2} 
              name={`Lote ${id}`} 
              dot={{ r: 4 }} 
              activeDot={{ r: 6 }} 
            />
          ))}
        </LineChart>
      );
    }
    if (chartType === "area") {
      return (
        <AreaChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
          <defs>
            {selectedBatches.map((id, index) => (
              <linearGradient key={`grad-${id}`} id={`color-${id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={CHART_COLORS[index % CHART_COLORS.length]} stopOpacity={0.8} />
                <stop offset="95%" stopColor={CHART_COLORS[index % CHART_COLORS.length]} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
          <XAxis {...AXIS_PROPS} />
          <YAxis {...Y_AXIS_PROPS} />
          <Tooltip content={<ChartTooltip valueSuffix="min" />} />
          <Legend {...LEGEND_PROPS} />
          {selectedBatches.map((id, index) => (
            <Area 
              key={id} 
              type="monotone" 
              dataKey={id} 
              stroke={CHART_COLORS[index % CHART_COLORS.length]} 
              fill={`url(#color-${id})`} 
              fillOpacity={0.4} 
              name={`Lote ${id}`} 
            />
          ))}
        </AreaChart>
      );
    }
    if (chartType === "radar") {
      return (
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
          <PolarGrid stroke={COLOR_MUTED} opacity={0.2} />
          <PolarAngleAxis dataKey="machine" tick={{ fill: COLOR_MUTED, fontSize: 12 }} />
          <PolarRadiusAxis angle={30} domain={[0, "auto"]} tick={{ fill: COLOR_MUTED, fontSize: 10 }} />
          {selectedBatches.map((id, index) => (
            <Radar 
              key={id} 
              name={`Lote ${id}`} 
              dataKey={id} 
              stroke={CHART_COLORS[index % CHART_COLORS.length]} 
              fill={CHART_COLORS[index % CHART_COLORS.length]} 
              fillOpacity={0.4} 
            />
          ))}
          <Legend />
          <Tooltip content={<ChartTooltip valueSuffix="min" />} />
        </RadarChart>
      );
    }
    return null;
  };
  return (
    <Card className="bg-card border-border">
      <CardContent className="pt-6">
        <div className="h-[500px]">
          <ResponsiveContainer width="100%" height="100%">
            {renderChartBody() as any}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
