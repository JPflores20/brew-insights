import {
    Area,
    AreaChart,
    CartesianGrid,
    ReferenceLine,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartTooltip } from "@/components/ui/ChartTooltip";

interface TrendAreaChartProps {
    data: any[];
    theoreticalDuration: number;
}

export function TrendAreaChart({ data, theoreticalDuration }: TrendAreaChartProps) {
    return (
        <Card className="col-span-4">
            <CardHeader>
                <CardTitle>Tendencia de Duración Total vs Ideal</CardTitle>
                <CardDescription>
                    Comparativa visual:
                    <span className="text-green-600 font-bold"> Verde = Ideal</span> vs
                    <span className="text-blue-600 font-bold"> Azul = Real</span>.
                </CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                        data={data}
                        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                        <defs>
                            <linearGradient id="colorReal" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorIdeal" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#16a34a" stopOpacity={0.6} />
                                <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                            </linearGradient>
                        </defs>

                        <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                        <XAxis
                            dataKey="id"
                            tick={{ fontSize: 10 }}
                            interval="preserveStartEnd"
                            angle={-45}
                            textAnchor="end"
                            height={60}
                            label={{
                                value: "Nº Lote (Ordenado por Inicio)",
                                position: "insideBottom",
                                offset: -10,
                                fontSize: 12,
                            }}
                        />
                        <YAxis
                            label={{
                                value: "Minutos",
                                angle: -90,
                                position: "insideLeft",
                            }}
                        />

                        <Tooltip
                            content={<ChartTooltip valueSuffix="min" />}
                            cursor={{ stroke: "hsl(var(--muted-foreground))", strokeWidth: 1, strokeDasharray: "4 4" }}
                        />

                        <ReferenceLine
                            y={theoreticalDuration}
                            stroke="red"
                            strokeDasharray="3 3"
                            label={{
                                value: "Meta Global",
                                position: "insideTopRight",
                                fill: "red",
                                fontSize: 10,
                            }}
                        />

                        <Area
                            type="monotone"
                            dataKey="expectedDuration"
                            stroke="#16a34a"
                            fillOpacity={1}
                            fill="url(#colorIdeal)"
                            name="Duración Ideal"
                        />

                        <Area
                            type="monotone"
                            dataKey="duration"
                            stroke="#2563eb"
                            fillOpacity={0.7}
                            fill="url(#colorReal)"
                            name="Duración Real"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
