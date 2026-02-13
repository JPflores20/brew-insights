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
    Legend
} from "recharts";
import { Thermometer, Plus, Trash2 } from "lucide-react";
import { CustomDot } from "./CustomDot";
import { ChartTooltip } from "@/components/ui/ChartTooltip";
import { Button } from "@/components/ui/button";

export interface SeriesConfig {
    id: string;
    recipe: string;
    machine: string;
    batch: string;
    color: string;
    availableRecipes: string[];
    availableMachines: string[];
    availableBatches: string[];
    setRecipe: (val: string) => void;
    setMachine: (val: string) => void;
    setBatch: (val: string) => void;
    onRemove?: () => void;
}

interface TemperatureTrendChartProps {
    data: any[];
    // Single-series props (optional for backward compatibility)
    trendBatch?: string;
    trendRecipe?: string;
    trendMachine?: string;
    uniqueRecipes?: string[];
    machinesWithTemps?: string[];
    availableTrendBatches?: string[];
    
    // Shared
    availableTempParams: string[];
    selectedTempParam: string;
    setSelectedTempParam: (val: string) => void;

    // Single-series setters (optional)
    setTrendRecipe?: (val: string) => void;
    setTrendMachine?: (val: string) => void;
    setTrendBatch?: (val: string) => void;

    selectedTempIndices: number[];
    setSelectedTempIndices: React.Dispatch<React.SetStateAction<number[]>>;
    chartType?: "area" | "line";
    title?: string;
    hideParamSelector?: boolean;

    // Multi-series props
    series?: SeriesConfig[];
    onAddSeries?: () => void;
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
    uniqueRecipes = [],
    machinesWithTemps = [],
    availableTrendBatches = [],
    availableTempParams,
    setTrendRecipe,
    setTrendMachine,
    setTrendBatch,
    setSelectedTempParam,
    selectedTempIndices,
    setSelectedTempIndices,
    chartType = "area",
    title,
    hideParamSelector = false,
    series,
    onAddSeries,
}: TemperatureTrendChartProps) {
    
    const isMultiSeries = series && series.length > 0;

    return (
        <Card className="bg-card border-border w-full p-6 opacity-90 hover:opacity-100 transition-opacity">
            <CardHeader className="px-0 pt-0 pb-6">
                <div className="flex flex-col gap-4">
                    <div className="space-y-1">
                        <CardTitle className="text-lg font-semibold flex items-center gap-2">
                            <Thermometer className="h-5 w-5 text-red-500" />
                            {title || (trendBatch && trendBatch !== "ALL"
                                ? "Perfil de Temperatura del Lote"
                                : "Tendencia Histórica de Temperaturas")}
                        </CardTitle>
                        <CardDescription>
                            {isMultiSeries 
                                ? "Comparación de múltiples series de temperatura"
                                : (trendBatch && trendBatch !== "ALL"
                                    ? `Visualizando evolución paso a paso del lote ${trendBatch}`
                                    : "Análisis histórico por equipo y receta")
                            }
                        </CardDescription>
                    </div>

                    {/* CONTROLES DE FILTRADO */}
                    {isMultiSeries ? (
                        <div className="flex flex-col gap-3 w-full print:hidden">
                            {series.map((s) => (
                                <div key={s.id} className="flex flex-col sm:flex-row gap-2 w-full items-center p-2 rounded-md bg-muted/30 border border-border/50">
                                    <div 
                                        className="w-4 h-4 rounded-full shrink-0 border border-border" 
                                        style={{ backgroundColor: s.color }}
                                        title={`Serie ${s.id}`}
                                    />
                                    
                                    <Select value={s.recipe} onValueChange={s.setRecipe}>
                                        <SelectTrigger className="w-full sm:w-[180px] h-8 text-xs">
                                            <SelectValue placeholder="Receta" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="ALL">Todas</SelectItem>
                                            {s.availableRecipes.map((r) => (
                                                <SelectItem key={r} value={r}>{r}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>

                                    <Select value={s.machine} onValueChange={s.setMachine}>
                                        <SelectTrigger className="w-full sm:w-[180px] h-8 text-xs">
                                            <SelectValue placeholder="Equipo" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="ALL">Todos</SelectItem>
                                            {s.availableMachines.map((m) => (
                                                <SelectItem key={m} value={m}>{m}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>

                                    <Select value={s.batch} onValueChange={s.setBatch}>
                                        <SelectTrigger className="w-full sm:w-[180px] h-8 text-xs">
                                            <SelectValue placeholder="Lote" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="ALL">Histórico</SelectItem>
                                            {s.availableBatches.map((b) => (
                                                <SelectItem key={b} value={b}>{b}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>

                                    {s.onRemove && (
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={s.onRemove}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            ))}
                            
                            <div className="flex flex-col sm:flex-row gap-2 justify-between items-center mt-2">
                                {onAddSeries && (
                                    <Button variant="outline" size="sm" onClick={onAddSeries} className="w-full sm:w-auto">
                                        <Plus className="mr-2 h-4 w-4" /> Añadir Serie
                                    </Button>
                                )}

                                {!hideParamSelector && (
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
                                )}
                            </div>
                        </div>
                    ) : (
                        // SINGLE SERIES (LEGACY/DEFAULT) MODE
                        <div className="flex flex-col sm:flex-row gap-2 w-full items-center">
                            <div 
                                className="w-4 h-4 rounded-full bg-red-500 shrink-0 border border-border" 
                                title="Color de la serie actual"
                            />

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

                            {!hideParamSelector && (
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
                            )}
                        </div>
                    )}
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
                    {isMultiSeries ? (
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
                            <CartesianGrid strokeDasharray="3 3" opacity={0.2} vertical={false} />
                            <XAxis
                                dataKey="stepName"
                                tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                                axisLine={{ stroke: "hsl(var(--border))" }}
                                interval={0}
                                angle={-20}
                                textAnchor="end"
                                height={60}
                                tickFormatter={(val) => truncateLabel(val, 15)}
                            />
                            <YAxis
                                label={{
                                    value: data[0]?.unit || "Valor", // Fallback unit if possible, usually defined in data
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
                            <Legend />
                            {series.map((s) => (
                                <Line
                                    key={s.id}
                                    type="monotone"
                                    dataKey={`value_${s.id}`}
                                    stroke={s.color}
                                    strokeWidth={2}
                                    name={`Lote ${s.batch} (${s.recipe})`}
                                    dot={(props) => (
                                        <CustomDot
                                            {...props}
                                            selectedIndices={selectedTempIndices}
                                            fill={s.color} // Ensure dot matches line color
                                        />
                                    )}
                                    activeDot={{ r: 6, strokeWidth: 0 }}
                                />
                            ))}
                        </LineChart>
                    ) : (
                        // SINGLE SERIES RENDER
                        chartType === "area" ? (
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
                                <CartesianGrid strokeDasharray="3 3" opacity={0.2} vertical={false} />
                                <XAxis
                                    dataKey={trendBatch && trendBatch !== "ALL" ? "stepName" : "date"}
                                    tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                                    axisLine={{ stroke: "hsl(var(--border))" }}
                                    interval={trendBatch && trendBatch !== "ALL" ? 0 : "preserveStartEnd"}
                                    angle={trendBatch && trendBatch !== "ALL" ? -20 : 0}
                                    textAnchor={trendBatch && trendBatch !== "ALL" ? "end" : "middle"}
                                    height={trendBatch && trendBatch !== "ALL" ? 60 : 30}
                                    tickFormatter={(val) => {
                                        if (trendBatch && trendBatch !== "ALL") return truncateLabel(val, 15);
                                        return val;
                                    }}
                                />
                                <YAxis
                                    label={{ value: "°C", angle: -90, position: "insideLeft", fill: "hsl(var(--muted-foreground))" }}
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
                                    dot={(props) => <CustomDot {...props} selectedIndices={selectedTempIndices} />}
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
                                <CartesianGrid strokeDasharray="3 3" opacity={0.2} vertical={false} />
                                <XAxis
                                    dataKey={trendBatch && trendBatch !== "ALL" ? "stepName" : "date"}
                                    tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                                    axisLine={{ stroke: "hsl(var(--border))" }}
                                    interval={trendBatch && trendBatch !== "ALL" ? 0 : "preserveStartEnd"}
                                    angle={trendBatch && trendBatch !== "ALL" ? -20 : 0}
                                    textAnchor={trendBatch && trendBatch !== "ALL" ? "end" : "middle"}
                                    height={trendBatch && trendBatch !== "ALL" ? 60 : 30}
                                    tickFormatter={(val) => {
                                        if (trendBatch && trendBatch !== "ALL") return truncateLabel(val, 15);
                                        return val;
                                    }}
                                />
                                <YAxis
                                    label={{ value: "°C", angle: -90, position: "insideLeft", fill: "hsl(var(--muted-foreground))" }}
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
                                    dot={(props) => <CustomDot {...props} selectedIndices={selectedTempIndices} />}
                                    activeDot={{ r: 6, strokeWidth: 0 }}
                                />
                            </LineChart>
                        )
                    )}

                </ResponsiveContainer>
                )}
            </div>
        </Card>
    );
}
