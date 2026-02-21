
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
const COLOR_PRIMARY = "hsl(var(--primary))";
const COLOR_SECONDARY = "#3b82f6";
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
  const renderChartBody = () => {
    if (chartType === "bar") {
      return (
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
          <XAxis {...AXIS_PROPS} />
          <YAxis {...Y_AXIS_PROPS} />
          <Tooltip content={<ChartTooltip valueSuffix="min" />} cursor={{ fill: "hsl(var(--muted)/0.2)" }} />
          <Legend {...LEGEND_PROPS} />
          <Bar dataKey={batchA} fill={COLOR_PRIMARY} name={nameA} radius={[4, 4, 0, 0]} />
          <Bar dataKey={batchB} fill={COLOR_SECONDARY} name={nameB} radius={[4, 4, 0, 0]} />
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
          <Line type="monotone" dataKey={batchA} stroke={COLOR_PRIMARY} strokeWidth={2} name={`Lote ${batchA}`} dot={{ r: 4 }} activeDot={{ r: 6 }} />
          <Line type="monotone" dataKey={batchB} stroke={COLOR_SECONDARY} strokeWidth={2} name={`Lote ${batchB}`} dot={{ r: 4 }} activeDot={{ r: 6 }} />
        </LineChart>
      );
    }
    if (chartType === "area") {
      return (
        <AreaChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
          <defs>
            <linearGradient id="colorBatchA" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={COLOR_PRIMARY} stopOpacity={0.8} />
              <stop offset="95%" stopColor={COLOR_PRIMARY} stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorBatchB" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={COLOR_SECONDARY} stopOpacity={0.8} />
              <stop offset="95%" stopColor={COLOR_SECONDARY} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
          <XAxis {...AXIS_PROPS} />
          <YAxis {...Y_AXIS_PROPS} />
          <Tooltip content={<ChartTooltip valueSuffix="min" />} />
          <Legend {...LEGEND_PROPS} />
          <Area type="monotone" dataKey={batchA} stroke={COLOR_PRIMARY} fill="url(#colorBatchA)" fillOpacity={0.4} name={`Lote ${batchA}`} />
          <Area type="monotone" dataKey={batchB} stroke={COLOR_SECONDARY} fill="url(#colorBatchB)" fillOpacity={0.4} name={`Lote ${batchB}`} />
        </AreaChart>
      );
    }
    if (chartType === "radar") {
      return (
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
          <PolarGrid stroke={COLOR_MUTED} opacity={0.2} />
          <PolarAngleAxis dataKey="machine" tick={{ fill: COLOR_MUTED, fontSize: 12 }} />
          <PolarRadiusAxis angle={30} domain={[0, "auto"]} tick={{ fill: COLOR_MUTED, fontSize: 10 }} />
          <Radar name={`Lote ${batchA}`} dataKey={batchA} stroke={COLOR_PRIMARY} fill={COLOR_PRIMARY} fillOpacity={0.4} />
          <Radar name={`Lote ${batchB}`} dataKey={batchB} stroke={COLOR_SECONDARY} fill={COLOR_SECONDARY} fillOpacity={0.4} />
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
