import { useMemo } from "react";
import { BatchRecord } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AlertTriangle, TrendingUp, Info, ArrowRight } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { calculateDegradationAlerts } from "@/utils/math_utils";

interface DegradationAlertsProps {
  data: BatchRecord[];
  onSelectAlert?: (machine: string, stepName: string) => void;
}

export function DegradationAlerts({ data, onSelectAlert }: DegradationAlertsProps) {
  const alerts = useMemo(() => {
     return calculateDegradationAlerts(data);
  }, [data]);

  if (alerts.length === 0) {
      return (
          <Card className="bg-card shadow-sm border-border border-l-4 border-l-green-500">
              <CardContent className="flex items-center gap-4 py-6">
                  <div className="p-3 bg-green-500/10 rounded-full text-green-500">
                      <Info className="w-6 h-6" />
                  </div>
                  <div>
                      <h3 className="text-lg font-semibold text-foreground">Equipos Operando Nominalmente</h3>
                      <p className="text-muted-foreground text-sm">No se ha detectado degradación estadísticamente significativa en los tiempos de operación de los equipos en la ventana de datos actual.</p>
                  </div>
              </CardContent>
          </Card>
      );
  }

  return (
    <Card className="bg-card shadow-sm border-border overflow-hidden border-t-4 border-t-red-500">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-semibold text-foreground flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            Lista de Equipos con Posibles Fallos
        </CardTitle>
        <CardDescription>
            Equipos y procesos donde los tiempos reales (`IW_ZEIT`) muestran una tendencia al alza constante, lo cual sugiere un posible taponamiento, pérdida de presión o fallo mecánico inminente.
            Haz clic en un equipo de la lista para ver su detalle en la gráfica de abajo.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="p-0">
          <Table>
              <TableHeader>
                  <TableRow className="bg-muted/30">
                      <TableHead className="w-[40px]"></TableHead>
                      <TableHead>Equipo</TableHead>
                      <TableHead>Operación</TableHead>
                      <TableHead className="text-right">Incremento <span className="text-muted-foreground font-normal ml-1">(vs. inicial)</span></TableHead>
                      <TableHead className="text-right">Promedio Reciente</TableHead>
                      <TableHead className="w-[40px]"></TableHead>
                  </TableRow>
              </TableHeader>
              <TableBody>
                  {alerts.map((alert) => (
                      <TableRow 
                          key={`${alert.machine}-${alert.stepName}`}
                          className="cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => onSelectAlert && onSelectAlert(alert.machine, alert.stepName)}
                      >
                          <TableCell>
                              <TrendingUp className="w-4 h-4 text-red-500" />
                          </TableCell>
                          <TableCell className="font-semibold text-foreground">{alert.machine}</TableCell>
                          <TableCell className="text-muted-foreground">{alert.stepName}</TableCell>
                          <TableCell className="text-right text-red-500 font-semibold">
                              +{alert.percentIncrease.toFixed(1)}%
                          </TableCell>
                          <TableCell className="text-right">
                              {alert.recentAvg.toFixed(1)} min
                          </TableCell>
                          <TableCell>
                              <ArrowRight className="w-4 h-4 text-muted-foreground" />
                          </TableCell>
                      </TableRow>
                  ))}
              </TableBody>
          </Table>
      </CardContent>
    </Card>
  );
}
