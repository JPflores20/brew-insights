import React from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { ChartTooltip } from "@/components/ui/chart_tooltip";
import { CustomDot } from "../custom_dot";
import { SeriesConfig } from "../types";

const truncateLabel = (v: any, max = 15) => String(v ?? "").length > max ? String(v ?? "").slice(0, max - 1) + "…" : String(v ?? "");

interface MultiSeriesChartProps {
    data: any[];
    series: SeriesConfig[];
    selectedTempIndices: number[];
    setSelectedTempIndices: React.Dispatch<React.SetStateAction<number[]>>;
}

export function MultiSeriesChart({ data, series, selectedTempIndices, setSelectedTempIndices }: MultiSeriesChartProps) {
    return (
        <ResponsiveContainer width="100%" height="100%">
            <LineChart
                data={data}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                onClick={(d) => {
                    if (d && d.activeTooltipIndex !== undefined) {
                        const idx = d.activeTooltipIndex;
                        setSelectedTempIndices((prev) =>
                            prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
                        );
                    }
                }}
            >
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} vertical={false} />
                <XAxis
                    dataKey="stepName"
                    tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={{ stroke: "hsl(var(--border))" }}
                    interval={0} angle={-20} textAnchor="end" height={60}
                    tickFormatter={(val) => truncateLabel(val, 15)}
                />
                <YAxis
                    label={{ value: data[0]?.unit || "Valor", angle: -90, position: "insideLeft", fill: "hsl(var(--muted-foreground))" }}
                    tick={{ fill: "hsl(var(--muted-foreground))" }}
                    axisLine={false}
                />
                <Tooltip
                    content={<ChartTooltip valueSuffix={data[0]?.unit || "°C"} />}
                    cursor={{ stroke: "hsl(var(--muted-foreground))", strokeWidth: 1, strokeDasharray: "4 4" }}
                />
                <Legend />
                {series.map((s) => (
                    <Line
                        key={s.id} type="monotone" dataKey={`value_${s.id}`}
                        stroke={s.color} strokeWidth={2} name={`Lote ${s.batch} (${s.recipe})`}
                        dot={({ key, ...props }: any) => (
                            <CustomDot key={key} {...props} selectedIndices={selectedTempIndices} fill={s.color} />
                        )}
                        activeDot={{ r: 6, strokeWidth: 0 }}
                    />
                ))}
            </LineChart>
        </ResponsiveContainer>
    );
}
