import { memo } from "react";
import {
    Card,
    CardTitle,
} from "@/components/ui/card";
import {
    BarChart,
    Bar,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
    LineChart,
    Line,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    Radar,
} from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    AlertTriangle,
    ListFilter,
} from "lucide-react";
import { ChartTooltip } from "@/components/ui/chart_tooltip";

const COLOR_PRIMARY = "hsl(var(--primary))";
const COLOR_SECONDARY = "#3b82f6";
const COLOR_ERROR = "#ef4444";
const COLOR_MUTED = "hsl(var(--muted-foreground))";
const COLOR_WARNING = "text-yellow-500";

const TICK_STYLE = { fontSize: 11, fill: COLOR_MUTED };
const AXIS_LABEL_STYLE = { fill: COLOR_MUTED, fontSize: 10 };
const LEGEND_PROPS = { wrapperStyle: { paddingTop: "10px" } };

interface StepData {
    stepName: string;
    durationMin: number;
    expectedDurationMin: number;
    startTime: string | Date;
}

interface SequenceChartProps {
    selectedRecord: any;
    stepsData: StepData[];
    selectedBatchId: string;
    selectedMachine: string;
}

export const SequenceChart = memo(function SequenceChart({
    selectedRecord,
    stepsData,
    selectedBatchId,
    selectedMachine,
}: SequenceChartProps) {
    if (!selectedRecord || stepsData.length === 0) {
        return (
            <Card className="bg-card border-border p-6 border-l-4 border-l-yellow-500 h-[520px]">
                <div className="flex items-center gap-2">
                    <AlertTriangle className={`h-5 w-5 ${COLOR_WARNING}`} />
                    <p className="text-sm font-medium">
                        Selecciona un lote para ver los detalles.
                    </p>
                </div>
            </Card>
        );
    }

    return (
        <Card className="bg-card border-border p-6 border-l-4 border-l-primary h-[580px]">
            <Tabs defaultValue="bar" className="h-full flex flex-col">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <ListFilter className="h-5 w-5 text-primary" />
                        <div className="min-w-0">
                            <CardTitle className="text-lg font-semibold truncate">
                                Secuencia de Pasos ({selectedBatchId} - {selectedMachine})
                            </CardTitle>
                            <p className="text-sm text-muted-foreground truncate">
                                {selectedRecord.productName}
                            </p>
                        </div>
                    </div>
                    <TabsList>
                        <TabsTrigger value="bar">Barras</TabsTrigger>
                        <TabsTrigger value="line">Línea</TabsTrigger>
                        <TabsTrigger value="radar">Radar</TabsTrigger>
                    </TabsList>
                </div>

                <div className="flex-1 w-full min-h-0">
                    <TabsContent value="bar" className="h-full mt-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={stepsData}
                                layout="vertical"
                                margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                                barCategoryGap="20%"
                            >
                                <CartesianGrid strokeDasharray="3 3" opacity={0.1} horizontal={true} vertical={true} />
                                <XAxis type="number" hide />
                                <YAxis
                                    dataKey="stepName"
                                    type="category"
                                    width={180}
                                    tick={TICK_STYLE}
                                    interval={0}
                                />
                                <Tooltip content={<ChartTooltip valueSuffix="min" />} cursor={{ fill: "transparent" }} />
                                <Legend {...LEGEND_PROPS} />
                                <Bar dataKey="durationMin" name="Duración Real (min)" fill={COLOR_PRIMARY} radius={[0, 4, 4, 0]} barSize={20}>
                                    {stepsData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.stepName.includes("Espera") ? COLOR_ERROR : COLOR_PRIMARY} />
                                    ))}
                                </Bar>
                                <Bar dataKey="expectedDurationMin" name="Duración Esperada (min)" fill={COLOR_SECONDARY} radius={[0, 4, 4, 0]} barSize={10} />
                            </BarChart>
                        </ResponsiveContainer>
                    </TabsContent>

                    <TabsContent value="line" className="h-full mt-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={stepsData} margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
                                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                                <XAxis
                                    dataKey="stepName"
                                    tick={AXIS_LABEL_STYLE}
                                    interval={0}
                                    angle={-45}
                                    textAnchor="end"
                                    height={80}
                                />
                                <YAxis label={{ value: 'Minutos', angle: -90, position: 'insideLeft' }} />
                                <Tooltip content={<ChartTooltip indicator="line" valueSuffix="min" />} />
                                <Legend {...LEGEND_PROPS} />
                                <Line type="monotone" dataKey="expectedDurationMin" name="Esperado" stroke={COLOR_SECONDARY} strokeWidth={2} dot={false} strokeDasharray="5 5" />
                                <Line type="monotone" dataKey="durationMin" name="Real" stroke={COLOR_PRIMARY} strokeWidth={2} activeDot={{ r: 8 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </TabsContent>

                    <TabsContent value="radar" className="h-full mt-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={stepsData}>
                                <PolarGrid opacity={0.2} />
                                <PolarAngleAxis dataKey="stepName" tick={AXIS_LABEL_STYLE} />
                                <PolarRadiusAxis angle={30} domain={[0, 'auto']} />
                                <Tooltip content={<ChartTooltip valueSuffix="min" />} />
                                <Radar name="Real" dataKey="durationMin" stroke={COLOR_PRIMARY} fill={COLOR_PRIMARY} fillOpacity={0.3} />
                                <Radar name="Esperado" dataKey="expectedDurationMin" stroke={COLOR_SECONDARY} fill={COLOR_SECONDARY} fillOpacity={0.3} />
                                <Legend {...LEGEND_PROPS} />
                            </RadarChart>
                        </ResponsiveContainer>
                    </TabsContent>
                </div>
            </Tabs>
        </Card>
    );
});
