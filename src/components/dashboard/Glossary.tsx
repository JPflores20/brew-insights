import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Clock, AlertTriangle, Info } from "lucide-react";

export function Glossary() {
    return (
        <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Info className="h-5 w-5 text-primary" />
                Guía Rápida de Indicadores
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-card border-border shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-3 opacity-5">
                        <TrendingUp className="h-24 w-24" />
                    </div>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base font-medium flex items-center gap-2 text-green-600 dark:text-green-400">
                            <TrendingUp className="h-4 w-4" /> Desviación Promedio
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                            Porcentaje global que indica qué tanto se alejan los tiempos
                            reales de los teóricos. Un valor positivo significa producción más
                            lenta.
                        </p>
                        <div className="bg-secondary/50 p-2 rounded-md border border-border/50">
                            <code className="text-xs font-mono text-foreground">
                                ((T.Real - T.Esp) / T.Esp) * 100
                            </code>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-card border-border shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-3 opacity-5">
                        <Clock className="h-24 w-24" />
                    </div>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base font-medium flex items-center gap-2 text-chart-delay">
                            <Clock className="h-4 w-4" /> Retraso (Delay)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                            Ineficiencia <strong>interna</strong> en los pasos. Ocurre cuando
                            una máquina tarda más de lo estipulado en la receta para una
                            tarea.
                        </p>
                        <div className="bg-secondary/50 p-2 rounded-md border border-border/50">
                            <code className="text-xs font-mono text-foreground">
                                Tiempo Real - Tiempo Esperado
                            </code>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-card border-border shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-3 opacity-5">
                        <AlertTriangle className="h-24 w-24" />
                    </div>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base font-medium flex items-center gap-2 text-orange-500">
                            <AlertTriangle className="h-4 w-4" /> Tiempo Muerto (Idle)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                            Ineficiencia <strong>externa</strong> entre pasos. Es la suma de
                            los "huecos" donde la máquina esperó entre el fin de un paso y el
                            inicio del siguiente.
                        </p>
                        <div className="bg-secondary/50 p-2 rounded-md border border-border/50">
                            <code className="text-xs font-mono text-foreground">
                                Σ (Inicioₙ - Finₙ₋₁)
                            </code>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
