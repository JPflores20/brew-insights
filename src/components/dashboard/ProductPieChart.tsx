import {
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Tooltip as RechartsTooltip,
    Label
} from "recharts";
import { cn } from "@/lib/utils";
import { ChartTooltip } from "@/components/ui/ChartTooltip";

interface ProductPieChartProps {
    data: { name: string; value: number }[];
    totalBatches: number;
    expanded?: boolean;
}

const PIE_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

export function ProductPieChart({ data, totalBatches, expanded = false }: ProductPieChartProps) {
    return (
        <ResponsiveContainer width="100%" height="100%">
            <PieChart>
                <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    labelLine={{ stroke: 'hsl(var(--muted-foreground))', strokeWidth: 1 }}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
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
                    content={<ChartTooltip indicator="dot" />}
                />
            </PieChart>
        </ResponsiveContainer>
    );
}
