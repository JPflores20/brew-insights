import React from "react";
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { ChartTooltip } from "@/components/ui/chart_tooltip";
import { CustomDot } from "../custom_dot";
import { FILTER_ALL } from "@/lib/constants";

const truncateLabel = (v: any, max = 15) => String(v ?? "").length > max ? String(v ?? "").slice(0, max - 1) + "…" : String(v ?? "");

interface SingleSeriesChartProps {
    data: any[];
    chartType: "area" | "line";
    trendBatch?: string;
    selectedTempIndices: number[];
    setSelectedTempIndices: React.Dispatch<React.SetStateAction<number[]>>;
}

export function SingleSeriesChart({ data, chartType, trendBatch, selectedTempIndices, setSelectedTempIndices }: SingleSeriesChartProps) {
    const isHistorical = !trendBatch || trendBatch === FILTER_ALL;
    const xAxisKey = isHistorical ? "date" : "stepName";
    
    const handleClick = (d: any) => {
        if (d && d.activeTooltipIndex !== undefined) {
            const idx = d.activeTooltipIndex;
            setSelectedTempIndices((prev) =>
                prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
            );
        }
    };

    if (chartType === "area") {
        return (
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }} onClick={handleClick}>
                    <defs>
                        <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} vertical={false} />
                    <XAxis
                        dataKey={xAxisKey}
                        tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                        axisLine={{ stroke: "hsl(var(--border))" }}
                        interval={isHistorical ? "preserveStartEnd" : 0} angle={isHistorical ? 0 : -20}
                        textAnchor={isHistorical ? "middle" : "end"} height={isHistorical ? 30 : 60}
                        tickFormatter={(val) => isHistorical ? val : truncateLabel(val, 15)}
                    />
                    <YAxis label={{ value: "°C", angle: -90, position: "insideLeft", fill: "hsl(var(--muted-foreground))" }} tick={{ fill: "hsl(var(--muted-foreground))" }} axisLine={false} />
                    <Tooltip content={<ChartTooltip valueSuffix={data[0]?.unit || "°C"} />} cursor={{ stroke: "hsl(var(--muted-foreground))", strokeWidth: 1, strokeDasharray: "4 4" }} />
                    <Area
                        type="monotone" dataKey="value" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorTemp)" name="Temperatura"
                        dot={({ key, ...props }: any) => <CustomDot key={key} {...props} selectedIndices={selectedTempIndices} />} activeDot={{ r: 6, strokeWidth: 0 }}
                    />
                </AreaChart>
            </ResponsiveContainer>
        );
    }

    return (
        <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }} onClick={handleClick}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} vertical={false} />
                <XAxis
                    dataKey={xAxisKey}
                    tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={{ stroke: "hsl(var(--border))" }}
                    interval={isHistorical ? "preserveStartEnd" : 0} angle={isHistorical ? 0 : -20}
                    textAnchor={isHistorical ? "middle" : "end"} height={isHistorical ? 30 : 60}
                    tickFormatter={(val) => isHistorical ? val : truncateLabel(val, 15)}
                />
                <YAxis label={{ value: "°C", angle: -90, position: "insideLeft", fill: "hsl(var(--muted-foreground))" }} tick={{ fill: "hsl(var(--muted-foreground))" }} axisLine={false} />
                <Tooltip content={<ChartTooltip valueSuffix={data[0]?.unit || "°C"} />} cursor={{ stroke: "hsl(var(--muted-foreground))", strokeWidth: 1, strokeDasharray: "4 4" }} />
                <Line
                    type="monotone" dataKey="value" stroke="#ef4444" strokeWidth={2} name="Temperatura"
                    dot={({ key, ...props }: any) => <CustomDot key={key} {...props} selectedIndices={selectedTempIndices} />} activeDot={{ r: 6, strokeWidth: 0 }}
                />
            </LineChart>
        </ResponsiveContainer>
    );
}
