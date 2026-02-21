import {
    Card,
    CardTitle,
} from "@/components/ui/card";
import {
    AreaChart,
    Area,
    BarChart,
    Bar,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ScatterChart,
    Scatter,
    ComposedChart,
} from "recharts";
import { Copy, FileBarChart, LineChart as LineChartIcon, Activity, Dot, Layers } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CustomDot } from "./custom_dot";
import { ChartTooltip } from "@/components/ui/chart_tooltip";
import { useState } from "react";

interface MachineHistoryChartProps {
    data: any[];
    selectedHistoryIndices: number[];
    setSelectedHistoryIndices: React.Dispatch<React.SetStateAction<number[]>>;
    trendBatch: string;
    selectedMachine: string;
}

export function MachineHistoryChart({
    data,
    selectedHistoryIndices,
    setSelectedHistoryIndices,
    trendBatch,
    selectedMachine,
}: MachineHistoryChartProps) {
    const [chartType, setChartType] = useState<"area" | "bar" | "line" | "scatter" | "composed">("area");

    if (data.length === 0) return null;

    const renderChart = () => {
        const commonProps = {
            data: data,
            margin: { top: 10, right: 30, left: 0, bottom: 0 },
            onClick: (data: any) => {
                if (data && data.activeTooltipIndex !== undefined) {
                    const idx = data.activeTooltipIndex;
                    setSelectedHistoryIndices((prev) =>
                        prev.includes(idx)
                            ? prev.filter((i) => i !== idx)
                            : [...prev, idx]
                    );
                }
            },
        };

        const commonAxes = (
            <>
                <CartesianGrid
                    strokeDasharray="3 3"
                    opacity={0.2}
                    vertical={false}
                />
                <XAxis
                    dataKey={trendBatch && trendBatch !== "ALL" ? "date" : "batchId"}
                    tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={{ stroke: "hsl(var(--border))" }}
                />
                <YAxis
                    label={{
                        value: "Minutos",
                        angle: -90,
                        position: "insideLeft",
                        fill: "hsl(var(--muted-foreground))",
                    }}
                    tick={{ fill: "hsl(var(--muted-foreground))" }}
                    axisLine={false}
                />
                <Tooltip
                    content={<ChartTooltip valueSuffix="min" />}
                    cursor={{ stroke: "hsl(var(--muted-foreground))", strokeWidth: 1, strokeDasharray: "4 4" }}
                />
            </>
        );

        if (chartType === "bar") {
            return (
                <BarChart {...commonProps}>
                    {commonAxes}
                    <Bar
                        dataKey="realTime"
                        fill="#8884d8"
                        radius={[4, 4, 0, 0]}
                        name="Tiempo Real"
                    />
                </BarChart>
            );
        }

        if (chartType === "line") {
            return (
                <LineChart {...commonProps}>
                    {commonAxes}
                    <Line
                        type="monotone"
                        dataKey="realTime"
                        stroke="#8884d8"
                        strokeWidth={2}
                        dot={(props: any) => (
                            <CustomDot
                                {...props}
                                selectedIndices={selectedHistoryIndices}
                            />
                        )}
                        activeDot={{ r: 6, strokeWidth: 0 }}
                        name="Tiempo Real"
                    />
                </LineChart>
            );
        }



        if (chartType === "scatter") {
            return (
                <ScatterChart {...commonProps}>
                    {commonAxes}
                    <Scatter
                        dataKey="realTime"
                        fill="#8884d8"
                        name="Tiempo Real"
                    />
                </ScatterChart>
            );
        }

        if (chartType === "composed") {
            return (
                <ComposedChart {...commonProps}>
                    {commonAxes}
                    <Bar
                        dataKey="realTime"
                        fill="#8884d8"
                        fillOpacity={0.6}
                        radius={[4, 4, 0, 0]}
                        name="Tiempo Real"
                    />
                    <Line
                        type="monotone"
                        dataKey="realTime"
                        stroke="#ff7300"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 6, strokeWidth: 0 }}
                        name="Tendencia"
                    />
                </ComposedChart>
            );
        }

        // Default to Area
        return (
            <AreaChart {...commonProps}>
                <defs>
                    <linearGradient id="colorRealTime" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                    </linearGradient>
                </defs>
                {commonAxes}
                <Area
                    type="monotone"
                    dataKey="realTime"
                    stroke="#8884d8"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorRealTime)"
                    name="Tiempo Real"
                    dot={(props: any) => (
                        <CustomDot
                            {...props}
                            selectedIndices={selectedHistoryIndices}
                        />
                    )}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                />
            </AreaChart>
        );
    };

    return (
        <Card className="bg-card border-border w-full p-6 opacity-90 hover:opacity-100 transition-opacity">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                <CardTitle className="text-lg font-semibold">
                    <div className="flex flex-col">
                        <span>Tendencia Histórica De Tiempos</span>
                        <span className="text-sm font-normal text-muted-foreground mt-1">
                            Comparativa con otros lotes en {selectedMachine}
                        </span>
                    </div>
                </CardTitle>

                <Tabs value={chartType} onValueChange={(v) => setChartType(v as any)} className="w-[200px]">
                    <TabsList className="grid w-full grid-cols-5">
                        <TabsTrigger value="area" title="Área">
                            <Activity className="h-4 w-4" />
                        </TabsTrigger>
                        <TabsTrigger value="bar" title="Barras">
                            <FileBarChart className="h-4 w-4" />
                        </TabsTrigger>
                        <TabsTrigger value="line" title="Línea">
                            <LineChartIcon className="h-4 w-4" />
                        </TabsTrigger>
                        <TabsTrigger value="scatter" title="Dispersión">
                            <Dot className="h-4 w-4" />
                        </TabsTrigger>
                        <TabsTrigger value="composed" title="Compuesto">
                            <Layers className="h-4 w-4" />
                        </TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            <div className="h-[340px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    {renderChart()}
                </ResponsiveContainer>
            </div>
        </Card>
    );
}
