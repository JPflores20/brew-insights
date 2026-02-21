import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll_area";
import { AlertCircle, CheckCircle2, Clock } from "lucide-react";
interface Anomaly {
    id: number;
    type: "gap" | "delay";
    name: string;
    duration: number;
    expected: number;
    delta: number;
    startTime: string;
    prevStep: string;
    nextStep: string;
}
interface AnomaliesListProps {
    anomaliesReport: Anomaly[];
}
export function AnomaliesList({ anomaliesReport }: AnomaliesListProps) {
    return (
        <Card className="bg-card border-border flex flex-col h-[520px] xl:h-[calc(100vh-260px)] overflow-hidden">
            <CardHeader className="pb-3 border-b border-border">
                <div className="flex items-center gap-2 text-foreground">
                    <AlertCircle className="h-5 w-5 text-orange-500" />
                    <CardTitle className="text-lg">Detalle de Ineficiencias</CardTitle>
                </div>
                <p className="text-xs text-muted-foreground">
                    {anomaliesReport.length > 0
                        ? `Lista de ${anomaliesReport.length} anomalías encontradas`
                        : "Sin ineficiencias detectadas"}
                </p>
            </CardHeader>
            <CardContent className="flex-1 p-0 min-h-0">
                {anomaliesReport.length > 0 ? (
                    <ScrollArea className="h-full w-full p-4">
                        <div className="space-y-4">
                            {anomaliesReport.map((item) => (
                                <div
                                    key={item.id}
                                    className={`p-3 rounded-lg border text-sm animate-in fade-in slide-in-from-right-4 duration-500 ${item.type === "gap"
                                            ? "bg-red-500/10 border-red-500/20"
                                            : "bg-orange-500/10 border-orange-500/20"
                                        }`}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <Badge
                                            variant="outline"
                                            className={
                                                item.type === "gap"
                                                    ? "text-red-500 border-red-500/30 bg-red-500/5 font-bold"
                                                    : "text-orange-600 border-orange-500/30 bg-orange-500/5 font-bold"
                                            }
                                        >
                                            {item.type === "gap" ? "PARADA / GAP" : "PASO LENTO"}
                                        </Badge>
                                        <span
                                            className={`font-mono font-bold ${item.type === "gap" ? "text-red-500" : "text-orange-600"
                                                }`}
                                        >
                                            {item.type === "gap"
                                                ? `${item.duration} min`
                                                : `+${item.delta} min`}
                                        </span>
                                    </div>
                                    <div className="text-xs text-muted-foreground space-y-1">
                                        <p className="font-medium text-foreground text-sm mb-1">
                                            {item.name}
                                        </p>
                                        {item.type === "delay" && (
                                            <div className="flex justify-between text-xs px-2 py-1 bg-background/50 rounded border border-border/50 mb-2">
                                                <span>
                                                    Real: <strong>{item.duration}m</strong>
                                                </span>
                                                <span>
                                                    Esperado: <strong>{item.expected}m</strong>
                                                </span>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-1 opacity-80">
                                            <Clock className="h-3 w-3" />
                                            <span>Inicio: {item.startTime}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-6 text-center">
                        <CheckCircle2 className="h-12 w-12 text-green-500 mb-3 opacity-20" />
                        <p className="text-sm">Todo correcto</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
