import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertTriangle, Clock } from "lucide-react";
import { getDelayAlerts } from "@/data/mockData";

export function AlertsWidget() {
  const alerts = getDelayAlerts(30);

  return (
    <Card className="bg-card border-border h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-chart-delay" />
          Delay Alerts
          <Badge variant="destructive" className="ml-auto">
            {alerts.length}
          </Badge>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Batches with delays &gt; 30 minutes
        </p>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[350px] pr-4">
          {alerts.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No significant delays detected
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
                      <p className="font-mono font-semibold text-foreground">
                        {alert.CHARG_NR}
                      </p>
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
                    <span>Expected: {alert.esperado_total_min}m</span>
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
