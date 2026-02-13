import {
    Card,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    LineChart,
    Line,
} from "recharts";
import { Thermometer } from "lucide-react";
import { CustomDot } from "./CustomDot";
import { ChartTooltip } from "@/components/ui/ChartTooltip";

interface TemperatureTrendChartProps {
    data: any[];
    trendBatch: string;
    trendRecipe: string;
    trendMachine: string;
    selectedTempParam: string;
    uniqueRecipes: string[];
    machinesWithTemps: string[];
    availableTrendBatches: string[];
    availableTempParams: string[];
    setTrendRecipe: (val: string) => void;
    setTrendMachine: (val: string) => void;
    setTrendBatch: (val: string) => void;
    setSelectedTempParam: (val: string) => void;
    selectedTempIndices: number[];
    setSelectedTempIndices: React.Dispatch<React.SetStateAction<number[]>>;
    chartType?: "area" | "line";
    title?: string;
}

const truncateLabel = (v: any, max = 18) => {
    const s = String(v ?? "");
    return s.length > max ? s.slice(0, max - 1) + "…" : s;
};

export function TemperatureTrendChart({
    data,
    trendBatch,
    trendRecipe,
    trendMachine,
    selectedTempParam,
    uniqueRecipes,
    machinesWithTemps,
    availableTrendBatches,
    availableTempParams,
    setTrendRecipe,
    setTrendMachine,
    setTrendBatch,
    setSelectedTempParam,
    selectedTempIndices,
    setSelectedTempIndices,
    chartType = "area",
    title,
}: TemperatureTrendChartProps) {
    // Always render the container, even if empty, so the user knows it's there.
    // We will handle empty states inside the visualization area.

    return (
        <Card className="bg-card border-border w-full p-6 opacity-90 hover:opacity-100 transition-opacity">
            <CardHeader className="px-0 pt-0 pb-6">
                <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
                    <div className="space-y-1">
                        <CardTitle className="text-lg font-semibold flex items-center gap-2">
                            <Thermometer className="h-5 w-5 text-red-500" />
                            {title || (trendBatch && trendBatch !== "ALL"
                                ? "Perfil de Temperatura del Lote"
                                : "Tendencia Histórica de Temperaturas")}
                        </CardTitle>
                        <CardDescription>
                            {trendBatch && trendBatch !== "ALL"
                                ? `Visualizando evolución paso a paso del lote ${trendBatch}`
                                : "Análisis histórico por equipo y receta"}
                        </CardDescription>
                    </div>

                    {/* CONTROLES DE FILTRADO EN LA GRÁFICA */}
                    <div className="flex flex-col sm:flex-row gap-2 w-full xl:w-auto">
                        {/* Selector de Receta (Local) */}
                        <Select value={trendRecipe} onValueChange={setTrendRecipe}>
                            <SelectTrigger className="w-full sm:w-[180px]">
                                <SelectValue placeholder="Receta" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">Todas las recetas</SelectItem>
                                {uniqueRecipes.map((r) => (
                                    <SelectItem key={r} value={r}>
                                        {r}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* Selector de Equipo (Local) */}
                        <Select value={trendMachine} onValueChange={setTrendMachine}>
                            <SelectTrigger className="w-full sm:w-[180px]">
                                <SelectValue placeholder="Equipo" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">Todos los equipos</SelectItem>
                                {machinesWithTemps.map((m) => (
                                    <SelectItem key={m} value={m}>
                                        {m}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* Selector de Lote (Local) */}
                        <Select value={trendBatch} onValueChange={setTrendBatch}>
                            <SelectTrigger className="w-full sm:w-[180px]">
                                <SelectValue placeholder="Lote" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">Todos los lotes (Histórico)</SelectItem>
                                {availableTrendBatches.map((b) => (
                                    <SelectItem key={b} value={b}>
                                        {b}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* Selector de Variable */}
                        <Select
                            value={selectedTempParam}
                            onValueChange={setSelectedTempParam}
                        >
                            <SelectTrigger className="w-full sm:w-[200px]">
                                <SelectValue placeholder="Variable" />
                            </SelectTrigger>
                            <SelectContent>
                                {availableTempParams.map((p) => (
                                    <SelectItem key={p} value={p}>
                                        {p}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </CardHeader>
            <div className="h-[340px] w-full">
                {data.length === 0 ? (
                    <div className="flex h-full w-full items-center justify-center flex-col gap-2 text-muted-foreground p-8 border-2 border-dashed border-muted rounded-lg">
                        <Thermometer className="h-8 w-8 opacity-50" />
                        <p>No hay datos de temperatura disponibles con los filtros actuales.</p>
                        <p className="text-sm">Intenta seleccionar otra Receta o Equipo.</p>
                    </div>
                ) : (
                <ResponsiveContainer width="100%" height="100%">
                    {chartType === "area" ? (
                        <AreaChart
                            data={data}
                            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                            onClick={(data) => {
                                if (data && data.activeTooltipIndex !== undefined) {
                                    const idx = data.activeTooltipIndex;
                                    setSelectedTempIndices((prev) =>
                                        prev.includes(idx)
                                            ? prev.filter((i) => i !== idx)
                                            : [...prev, idx]
                                    );
                                }
                            }}
                        >
                            <defs>
                                <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid
                                strokeDasharray="3 3"
                                opacity={0.2}
                                vertical={false}
                            />

                            <XAxis
                                dataKey={
                                    trendBatch && trendBatch !== "ALL" ? "stepName" : "date"
                                }
                                tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                                axisLine={{ stroke: "hsl(var(--border))" }}
                                interval={
                                    trendBatch && trendBatch !== "ALL"
                                        ? 0
                                        : "preserveStartEnd"
                                }
                                angle={trendBatch && trendBatch !== "ALL" ? -20 : 0}
                                textAnchor={
                                    trendBatch && trendBatch !== "ALL" ? "end" : "middle"
                                }
                                height={trendBatch && trendBatch !== "ALL" ? 60 : 30}
                                tickFormatter={(val) => {
                                    if (trendBatch && trendBatch !== "ALL")
                                        return truncateLabel(val, 15);
                                    return val;
                                }}
                            />

                            <YAxis
                                label={{
                                    value: "°C",
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
                                dataKey="value"
                                stroke="#ef4444"
                                strokeWidth={2}
                                fillOpacity={1}
                                fill="url(#colorTemp)"
                                name="Temperatura"
                                dot={(props) => (
                                    <CustomDot
                                        {...props}
                                        selectedIndices={selectedTempIndices}
                                    />
                                )}
                                activeDot={{ r: 6, strokeWidth: 0 }}
                            />
                        </AreaChart>
                    ) : (
                        <LineChart
                            data={data}
                            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                            onClick={(data) => {
                                if (data && data.activeTooltipIndex !== undefined) {
                                    const idx = data.activeTooltipIndex;
                                    setSelectedTempIndices((prev) =>
                                        prev.includes(idx)
                                            ? prev.filter((i) => i !== idx)
                                            : [...prev, idx]
                                    );
                                }
                            }}
                        >
                            <CartesianGrid
                                strokeDasharray="3 3"
                                opacity={0.2}
                                vertical={false}
                            />

                            <XAxis
                                dataKey={
                                    trendBatch && trendBatch !== "ALL" ? "stepName" : "date"
                                }
                                tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                                axisLine={{ stroke: "hsl(var(--border))" }}
                                interval={
                                    trendBatch && trendBatch !== "ALL"
                                        ? 0
                                        : "preserveStartEnd"
                                }
                                angle={trendBatch && trendBatch !== "ALL" ? -20 : 0}
                                textAnchor={
                                    trendBatch && trendBatch !== "ALL" ? "end" : "middle"
                                }
                                height={trendBatch && trendBatch !== "ALL" ? 60 : 30}
                                tickFormatter={(val) => {
                                    if (trendBatch && trendBatch !== "ALL")
                                        return truncateLabel(val, 15);
                                    return val;
                                }}
                            />

                            <YAxis
                                label={{
                                    value: "°C",
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
                            <Line
                                type="monotone"
                                dataKey="value"
                                stroke="#ef4444"
                                strokeWidth={2}
                                name="Temperatura"
                                dot={(props) => (
                                    <CustomDot
                                        {...props}
                                        selectedIndices={selectedTempIndices}
                                    />
                                )}
                                activeDot={{ r: 6, strokeWidth: 0 }}
                            />
                        </LineChart>
                    )}

                </ResponsiveContainer>
                )}
            </div>
        </Card>
    );
}
