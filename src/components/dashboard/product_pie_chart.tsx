import { useMemo } from "react";
import {
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Tooltip as RechartsTooltip,
    Label
} from "recharts";
import { cn } from "@/lib/utils";
import { ChartTooltip } from "@/components/ui/chart_tooltip";
interface ProductPieChartProps {
    data: { name: string; value: number }[];
    totalBatches: number;
    expanded?: boolean;
}
const PIE_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#a4de6c', '#d0ed57'];
export function ProductPieChart({ data, totalBatches, expanded = false }: ProductPieChartProps) {
    const displayData = useMemo(() => {
        if (expanded || data.length <= 8) return data;
        const top8 = data.slice(0, 8);
        const othersValue = data.slice(8).reduce((acc, curr) => acc + curr.value, 0);
        return [...top8, { name: "Otros", value: othersValue }];
    }, [data, expanded]);

    return (
        <ResponsiveContainer width="100%" height="100%">
            <PieChart>
                <Pie
                    data={displayData}
                    cx="50%"
                    cy="50%"
                    labelLine={{ stroke: 'hsl(var(--muted-foreground))', strokeWidth: 1 }}
                    label={(props: any) => {
                        const { x, y, name, percent, textAnchor, index } = props;
                        return (
                            <text
                                x={x}
                                y={y}
                                fill={PIE_COLORS[index % PIE_COLORS.length]}
                                textAnchor={textAnchor}
                                dominantBaseline="central"
                                fontSize={11}
                            >
                                {`${name} (${(percent * 100).toFixed(0)}%)`}
                            </text>
                        );
                    }}
                    outerRadius={expanded ? 200 : 130}
                    innerRadius={expanded ? 100 : 70}
                    paddingAngle={2}
                    dataKey="value"
                    nameKey="name"
                >
                    {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} stroke="hsl(var(--card))" strokeWidth={2} />
                    ))}
                    <Label
                        content={({ viewBox }) => {
                            if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                                return (
                                    <text
                                        x={viewBox.cx}
                                        y={viewBox.cy}
                                        textAnchor="middle"
                                        dominantBaseline="middle"
                                    >
                                        <tspan
                                            x={viewBox.cx}
                                            y={viewBox.cy}
                                            className={cn(
                                                "fill-foreground font-bold",
                                                expanded ? "text-5xl" : "text-3xl"
                                            )}
                                        >
                                            {totalBatches}
                                        </tspan>
                                        <tspan
                                            x={viewBox.cx}
                                            y={(viewBox.cy || 0) + (expanded ? 32 : 24)}
                                            className={cn(
                                                "fill-muted-foreground",
                                                expanded ? "text-base" : "text-xs"
                                            )}
                                        >
                                            Lotes
                                        </tspan>
                                    </text>
                                )
                            }
                        }}
                    />
                </Pie>
                <RechartsTooltip
                    content={<ChartTooltip indicator="dot" valueSuffix=" lotes" />}
                />
            </PieChart>
        </ResponsiveContainer>
    );
}
