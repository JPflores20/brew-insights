import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function FilterCard({
  startStepFilter,
  endStepFilter,
  filterTotalTime,
  startFilterIndex,
  endFilterIndex,
}: {
  startStepFilter: string;
  endStepFilter: string;
  filterTotalTime: number;
  startFilterIndex: number;
  endFilterIndex: number;
}) {
  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg flex items-center gap-2">
            <Badge variant="outline">Filtro</Badge>
            Tiempo Total Real
          </CardTitle>
        </div>
        <p className="text-sm text-muted-foreground">
          Cálculo automático: entre pasos <strong>{startStepFilter}</strong> y <strong>{endStepFilter}</strong>
        </p>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        <div className="bg-muted/30 p-4 rounded-lg border flex items-baseline justify-between">
          <span className="text-sm font-medium text-muted-foreground">
            Tiempo Calculado
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold font-mono tracking-tight text-primary">
              {filterTotalTime.toFixed(3)}
            </span>
            <span className="text-sm font-medium text-muted-foreground">
              min
            </span>
          </div>
        </div>
        {(startFilterIndex === -1 || endFilterIndex === -1) && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            ⚠️ No se encontraron los pasos "{startStepFilter}" y/o "{endStepFilter}" en este
            lote.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
