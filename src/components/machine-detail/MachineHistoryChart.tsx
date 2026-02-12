import {
    Card,
    CardTitle,
} from "@/components/ui/card";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import { CustomDot } from "./CustomDot";
import { ChartTooltip } from "@/components/ui/ChartTooltip";

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
    if (data.length === 0) return null;

    return (
        <Card className="bg-card border-border w-full p-6 opacity-90 hover:opacity-100 transition-opacity">
            <CardTitle className="mb-6 text-lg font-semibold flex items-center justify-between">
                <span>Tendencia Histórica De Tiempos</span>
                <span className="text-sm font-normal text-muted-foreground">
                    Comparativa con otros lotes en {selectedMachine}
                </span>
            </CardTitle>
            <div className="h-[340px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                        data={data}
                        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                        onClick={(data) => {
                            if (data && data.activeTooltipIndex !== undefined) {
                                const idx = data.activeTooltipIndex;
                                setSelectedHistoryIndices((prev) =>
                                    prev.includes(idx)
                                        ? prev.filter((i) => i !== idx)
                                        : [...prev, idx]
                                );
                            }
                        }}
                    >
                        <defs>
                            <linearGradient id="colorRealTime" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                            </linearGradient>
                        </defs>
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
                            content={<ChartTooltip />}
                            cursor={{ stroke: "hsl(var(--muted-foreground))", strokeWidth: 1, strokeDasharray: "4 4" }}
                        />
                        <Area
                            type="monotone"
                            dataKey="realTime"
                            stroke="#8884d8"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#colorRealTime)"
                            name="Tiempo Real"
                            dot={(props) => (
                                <CustomDot
                                    {...props}
                                    selectedIndices={selectedHistoryIndices}
                                />
                            )}
                            activeDot={{ r: 6, strokeWidth: 0 }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
}
