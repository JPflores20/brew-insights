import { useMemo } from "react";
import { BatchRecord } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AlertTriangle, TrendingUp, Info, ArrowRight } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface DegradationAlertsProps {
  data: BatchRecord[];
  onSelectAlert?: (machine: string, stepName: string) => void;
}

interface AlertData {
  machine: string;
  stepName: string;
  slope: number;
  recentAvg: number;
  percentIncrease: number; // vs initial avg
}

export function DegradationAlerts({ data, onSelectAlert }: DegradationAlertsProps) {

  const alerts = useMemo(() => {
     // Sort data chronologically to analyze trends over time
     const sortedData = [...data].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

     // Map to store durations per Machine -> Step
     const historyMap = new Map<string, number[]>();

     sortedData.forEach(batch => {
         const machine = batch.TEILANL_GRUPO || "Desconocida";
         batch.steps.forEach(step => {
             const key = `${machine}:::${step.stepName}`;
             if (!historyMap.has(key)) historyMap.set(key, []);
             historyMap.get(key)!.push(step.durationMin);
         });
     });

     const activeAlerts: AlertData[] = [];

     historyMap.forEach((durations, key) => {
         // Need at least 5 points to determine a trend
         if (durations.length < 5) return;

         // Simple linear regression to find slope
         const n = durations.length;
         let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
         
         for (let i = 0; i < n; i++) {
             sumX += i;
             sumY += durations[i];
             sumXY += i * durations[i];
             sumXX += i * i;
         }

         const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);

         // If slope is strongly positive, there is a degradation trend (increasing time)
         // Only alert if the slope indicates a rise of more than 0.5 minutes per batch, 
         // OR we can compare the first third vs last third of the data for a percentage increase.
         
         const firstThirdEnd = Math.max(1, Math.floor(n / 3));
         const lastThirdStart = n - firstThirdEnd;

         const firstAvg = durations.slice(0, firstThirdEnd).reduce((a, b) => a + b, 0) / firstThirdEnd;
         const lastAvg = durations.slice(lastThirdStart).reduce((a, b) => a + b, 0) / firstThirdEnd;

         const pctIncrease = firstAvg > 0 ? ((lastAvg - firstAvg) / firstAvg) * 100 : 0;

         // Let's flag if duration increased by more than 10% and slope is positive
         if (pctIncrease > 5 && slope > 0) {
             const [machine, stepName] = key.split(":::");
             activeAlerts.push({
                 machine,
                 stepName,
                 slope,
                 recentAvg: lastAvg,
                 percentIncrease: pctIncrease
             });
         }
     });

     // Sort alerts by highest percent increase
     return activeAlerts.sort((a,b) => b.percentIncrease - a.percentIncrease).slice(0, 6); // Max 6 alerts

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
