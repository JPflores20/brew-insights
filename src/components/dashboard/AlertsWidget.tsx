import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertTriangle, Clock } from "lucide-react";
import { getDelayAlerts, BatchRecord } from "@/data/mockData";

interface AlertsWidgetProps {
  data: BatchRecord[];
}

export function AlertsWidget({ data }: AlertsWidgetProps) {
  const alerts = getDelayAlerts(data, 30);

  return (
    <Card className="bg-card border-border h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-chart-delay" />
          Alertas de Retraso
          <Badge variant="destructive" className="ml-auto">
            {alerts.length}
          </Badge>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Lotes con retrasos &gt; 30 minutos
        </p>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[350px] pr-4">
          {alerts.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No se detectaron retrasos significativos
            </p>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert, index) => (
                <div 
                  key={`${alert.CHARG_NR}-${alert.TEILANL_GRUPO}-${index}`}
                  className="p-3 rounded-lg bg-secondary border border-border"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-mono font-semibold text-foreground">
                          {alert.CHARG_NR}
                        </p>
                        {/* Mostramos el producto aquí */}
                        <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                          {alert.productName || "N/A"}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {alert.TEILANL_GRUPO}
                      </p>
                    </div>
                    <Badge 
                      variant="outline" 
                      className="border-chart-delay text-chart-delay"
                    >
                      <Clock className="h-3 w-3 mr-1" />
                      +{alert.delta_total_min} min
                    </Badge>
                  </div>
                  <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                    <span>Esp: {alert.esperado_total_min}m</span>
                    <span>Real: {alert.real_total_min}m</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}