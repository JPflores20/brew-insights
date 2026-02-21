import {
    Bar,
    CartesianGrid,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import { format } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartTooltip } from "@/components/ui/chart_tooltip";
import { CartesianChart } from "@/components/ui/cartesian_chart";

interface GanttChartProps {
    data: any[];
    minTime: number;
    maxTime: number;
}

export function GanttChart({ data, minTime, maxTime }: GanttChartProps) {
    return (
        <Card className="col-span-4">
            <CardHeader>
                <CardTitle>Cronograma Global de Producción</CardTitle>
                <CardDescription>
                    Secuencia de lotes únicos en el tiempo (Inicio a Fin).
                </CardDescription>
            </CardHeader>
            <CardContent className="h-[400px] overflow-auto">
                <div className="min-w-[800px] h-full">
                    <CartesianChart
                        data={data}
                        chartType="bar"
                        layout="vertical"
                        barSize={15}
                        margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
                    >
                        <CartesianGrid
                            strokeDasharray="3 3"
                            horizontal={false}
                            opacity={0.2}
                        />
                        <YAxis
                            type="category"
                            dataKey="id"
                            width={80}
                            tick={{ fontSize: 10 }}
                        />
                        <XAxis
                            type="number"
                            domain={[minTime, maxTime]}
                            tickFormatter={(unixTime) =>
                                format(new Date(unixTime), "dd/MM HH:mm")
                            }
                            scale="time"
                            orientation="top"
                            tick={{ fontSize: 12 }}
                        />
                        <Tooltip
                            cursor={{ fill: "transparent" }}
                            content={<ChartTooltip valueSuffix="ms" />}
                        />
                        <Bar dataKey="startOffset" stackId="a" fill="transparent" />
                        <Bar
                            dataKey="durationMs"
                            stackId="a"
                            fill="hsl(var(--muted-foreground))"
                            opacity={0.6}
                            radius={[2, 2, 2, 2]}
                        />
                    </CartesianChart>
                </div>
            </CardContent>
        </Card>
    );
}
