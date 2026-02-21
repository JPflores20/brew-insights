import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll_area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Timer, Clock, ArrowRight } from "lucide-react";

interface ProblematicBatch {
    batch: string;
    product: string;
    machine: string;
    totalWait: number;
    totalDelay: number;
    isDelay: boolean;
    timestamp: string;
}

interface ProblemsPanelProps {
    problematicBatches: ProblematicBatch[];
    loadSuggestion: (batch: string, machine: string) => void;
}

export function ProblemsPanel({
    problematicBatches,
    loadSuggestion,
}: ProblemsPanelProps) {
    if (problematicBatches.length === 0) return null;

    return (
        <Card className="bg-card border-border border-l-4 border-l-orange-500 mt-8">
            <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                    <Search className="h-5 w-5 text-orange-500" />
                    <CardTitle className="text-lg">
                        🔍 Detección Automática de Problemas
                    </CardTitle>
                </div>
                <CardDescription>
                    Se han encontrado {problematicBatches.length} registros con
                    ineficiencias.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-[170px] w-full pr-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                        {problematicBatches.map((issue, idx) => (
                            <div
                                key={idx}
                                className="flex items-center justify-between p-3 rounded-lg border border-border bg-background hover:bg-accent/50 transition-colors"
                            >
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Badge variant="secondary" className="font-mono">
                                            {issue.batch}
                                        </Badge>
                                        <span
                                            className="text-xs text-muted-foreground truncate max-w-[160px]"
                                            title={issue.machine}
                                        >
                                            {issue.machine}
                                        </span>
                                    </div>
                                    <div className="text-[10px] text-muted-foreground mb-1 font-medium truncate">
                                        {issue.product}
                                    </div>
                                    <p
                                        className={
                                            issue.isDelay
                                                ? "text-xs text-orange-500 font-medium flex items-center gap-1"
                                                : "text-xs text-red-500 font-medium flex items-center gap-1"
                                        }
                                    >
                                        {issue.isDelay ? (
                                            <Timer className="h-3 w-3" />
                                        ) : (
                                            <Clock className="h-3 w-3" />
                                        )}
                                        {issue.isDelay
                                            ? `Retraso: +${issue.totalDelay} min`
                                            : `Espera: ${issue.totalWait} min`}
                                    </p>
                                </div>

                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 text-xs ml-3 shrink-0"
                                    onClick={() => loadSuggestion(issue.batch, issue.machine)}
                                >
                                    Analizar <ArrowRight className="ml-2 h-3.5 w-3.5" />
                                </Button>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}
