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
} from "recharts";
import {
    AlertTriangle,
    ListFilter,
} from "lucide-react";

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

export function SequenceChart({
    selectedRecord,
    stepsData,
    selectedBatchId,
    selectedMachine,
}: SequenceChartProps) {
    if (!selectedRecord || stepsData.length === 0) {
        return (
            <Card className="bg-card border-border p-6 border-l-4 border-l-yellow-500 h-[520px]">
                <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                    <p className="text-sm font-medium">
                        Selecciona un lote para ver los detalles.
                    </p>
                </div>
            </Card>
        );
    }

    return (
        <Card className="bg-card border-border p-6 border-l-4 border-l-primary h-[520px]">
            <div className="flex items-center gap-2 mb-6">
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

            <div className="h-[420px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={stepsData}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                        barCategoryGap="20%"
                    >
                        <CartesianGrid
                            strokeDasharray="3 3"
                            opacity={0.1}
                            horizontal={true}
                            vertical={true}
                        />
                        <XAxis type="number" hide />
                        <YAxis
                            dataKey="stepName"
                            type="category"
                            width={180}
                            tick={{
                                fontSize: 11,
                                fill: "hsl(var(--muted-foreground))",
                            }}
                            interval={0}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: "hsl(var(--popover))",
                                borderColor: "hsl(var(--border))",
                                borderRadius: "8px",
                                color: "hsl(var(--popover-foreground))",
                            }}
                            cursor={{ fill: "transparent" }}
                        />
                        <Legend
                            wrapperStyle={{ paddingTop: "10px" }}
                            payload={[
                                {
                                    value: "Duración Real (min)",
                                    type: "rect",
                                    color: "hsl(var(--primary))",
                                },
                                {
                                    value: "Espera / Gap (min)",
                                    type: "rect",
                                    color: "#ef4444",
                                },
                                {
                                    value: "Duración Esperada (min)",
                                    type: "rect",
                                    color: "#3b82f6", // COLOR AZUL
                                },
                            ]}
                        />
                        <Bar
                            dataKey="durationMin"
                            name="Duración Real (min)"
                            fill="hsl(var(--primary))"
                            radius={[0, 4, 4, 0]}
                            barSize={20}
                        >
                            {stepsData.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={
                                        entry.stepName.includes("Espera")
                                            ? "#ef4444"
                                            : "hsl(var(--primary))"
                                    }
                                />
                            ))}
                        </Bar>
                        <Bar
                            dataKey="expectedDurationMin"
                            name="Duración Esperada (min)"
                            fill="#3b82f6" // COLOR AZUL
                            radius={[0, 4, 4, 0]}
                            barSize={10}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
}
