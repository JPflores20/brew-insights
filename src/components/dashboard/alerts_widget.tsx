import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll_area";
import { AlertTriangle, Clock, ArrowRight, Timer } from "lucide-react"; 
import { getDelayAlerts, BatchRecord } from "@/data/mock_data";
import { useNavigate } from "react-router-dom"; 
interface AlertsWidgetProps {
  data: BatchRecord[];
}
export function AlertsWidget({ data }: AlertsWidgetProps) {
  const alerts = getDelayAlerts(data, 30);
  const navigate = useNavigate();
  const handleAlertClick = (batchId: string, machine: string) => {
    window.localStorage.setItem("detail-batch-selection-v2", JSON.stringify(batchId));
    window.localStorage.setItem("detail-machine-selection-v2", JSON.stringify(machine));
    navigate("/machine");
  };
  return (
    <Card className="bg-card border-border h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
          {}
          <Timer className="h-5 w-5 text-orange-500" />
          Alertas de Retraso
          <Badge variant="outline" className="ml-auto border-orange-500/50 text-orange-600 font-bold">
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
            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
              <Clock className="h-10 w-10 opacity-20 mb-2" />
              <p>Sin retrasos significativos</p>
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert, index) => (
                <div 
                  key={`${alert.CHARG_NR}-${alert.TEILANL_GRUPO}-${index}`}
                  className="p-3 rounded-lg bg-orange-500/5 border border-orange-500/20 group cursor-pointer hover:bg-orange-500/10 transition-all duration-200"
                  onClick={() => handleAlertClick(alert.CHARG_NR, alert.TEILANL_GRUPO)}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-mono font-semibold text-foreground group-hover:text-orange-600 transition-colors">
                          {alert.CHARG_NR}
                        </p>
                        <span className="text-[10px] bg-background/50 text-muted-foreground border border-border/50 px-1.5 py-0.5 rounded">
                          {alert.productName || "N/A"}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {alert.TEILANL_GRUPO}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant="outline" 
                        className="border-orange-500/30 text-orange-600 bg-orange-500/5"
                      >
                        <Clock className="h-3 w-3 mr-1" />
                        +{alert.delta_total_min} min
                      </Badge>
                      <ArrowRight className="h-4 w-4 text-orange-400 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
                    </div>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground border-t border-orange-500/10 pt-2">
                    <span>Esperado: {alert.esperado_total_min}m</span>
                    <span className="font-medium text-orange-700/70">Real: {alert.real_total_min}m</span>
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