import {
    Card,
    CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import { Layers } from "lucide-react";
import { CSSProperties } from "react";

interface GlobalTimelineProps {
    fullProcessData: any[]; // Define specific type if possible
    fullProcessChartHeight: number;
}

const themedTooltipContentStyle: CSSProperties = {
    backgroundColor: "hsl(var(--popover))",
    borderColor: "hsl(var(--border))",
    borderRadius: "8px",
    color: "hsl(var(--popover-foreground))",
    fontSize: "14px",
};

export function GlobalTimeline({
    fullProcessData,
    fullProcessChartHeight,
}: GlobalTimelineProps) {
    if (fullProcessData.length === 0) {
        return (
            <div className="flex h-[300px] items-center justify-center border rounded-md bg-muted/20">
                <p className="text-muted-foreground">
                    Selecciona un lote para ver la cronología.
                </p>
            </div>
        );
    }

    return (
        <Card className="bg-card border-border p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
                <Layers className="h-5 w-5 text-indigo-500" />
                <div className="min-w-0">
                    <CardTitle className="text-lg font-semibold truncate">
                        Cronología Completa del Lote (Todos los Equipos)
                    </CardTitle>
                    <p className="text-sm text-muted-foreground truncate">
                        Vista unificada de todas las máquinas secuenciadas por tiempo.
                    </p>
                </div>
            </div>

            {/* WRAPPER CON SCROLL */}
            <ScrollArea className="h-[600px] w-full pr-4 border rounded-md bg-background/50">
                <div
                    style={{
                        height: `${fullProcessChartHeight}px`,
                        width: "100%",
                        minWidth: "800px",
                    }}
                >
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={fullProcessData}
                            layout="vertical"
                            margin={{ top: 20, right: 30, left: 10, bottom: 20 }}
                            barCategoryGap="20%"
                        >
                            <CartesianGrid
                                strokeDasharray="3 3"
                                opacity={0.1}
                                horizontal={true}
                                vertical={true}
                            />
                            <XAxis type="number" />
                            <YAxis
                                dataKey="uniqueLabel"
                                type="category"
                                width={260}
                                tick={{
                                    fontSize: 12,
                                    fill: "hsl(var(--muted-foreground))",
                                }}
                                interval={0}
                                tickFormatter={(value) => {
                                    return value.length > 40
                                        ? value.substring(0, 40) + "..."
                                        : value;
                                }}
                            />
                            <Tooltip
                                contentStyle={themedTooltipContentStyle}
                                cursor={{ fill: "transparent" }}
                                formatter={(value: any, name: any) => [value, name]}
                                labelFormatter={(label) => label.split(" - ")[1] || label}
                            />
                            <Legend wrapperStyle={{ paddingTop: "10px" }} />
                            <Bar
                                dataKey="durationMin"
                                name="Duración Real (min)"
                                fill="hsl(var(--primary))"
                                radius={[0, 4, 4, 0]}
                                barSize={24}
                            >
                                {fullProcessData.map((entry, index) => (
                                    <Cell
                                        key={`cell-full-${index}`}
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
                                barSize={12}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </ScrollArea>
        </Card>
    );
}
