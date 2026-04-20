import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";

interface MaceratorCardProps {
  maceratorRecord: any;
  selectedMaceratorStepIndex: string;
  setSelectedMaceratorStepIndex: (val: string) => void;
  maceratorStepOptions: { stepName: string; index: number }[];
  maceratorCalculatedTime: { duration: number; valid: boolean };
  recibirCocedorTime: string;
  conversionTemp: string;
}

export function MaceratorCard({
  maceratorRecord,
  selectedMaceratorStepIndex,
  setSelectedMaceratorStepIndex,
  maceratorStepOptions,
  maceratorCalculatedTime,
  recibirCocedorTime,
  conversionTemp,
}: MaceratorCardProps) {
  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <Badge variant="outline">Macerador</Badge>
          Detalles del Proceso
        </CardTitle>
        <p className="text-sm text-muted-foreground">Métricas clave y cálculo de tiempos</p>
      </CardHeader>
      <CardContent className="p-4 space-y-6">
        <div className="space-y-4 border rounded-md p-4 bg-background/50">
          <h4 className="font-medium text-sm text-muted-foreground flex items-center gap-2">
            <Clock className="w-4 h-4" /> Consulta de Tiempo por Paso
          </h4>
          <div className="space-y-2">
            <label className="text-xs font-medium">Seleccionar Paso:</label>
            <Select value={selectedMaceratorStepIndex} onValueChange={setSelectedMaceratorStepIndex}>
              <SelectTrigger className="h-10 text-sm">
                <SelectValue placeholder="Seleccionar paso..." />
              </SelectTrigger>
              <SelectContent>
                {maceratorStepOptions.map((opt) => (
                  <SelectItem key={`macerator-${opt.index}`} value={opt.index.toString()} className="text-sm">
                    {opt.index + 1}. {opt.stepName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-between items-center pt-2 border-t mt-2">
            <span className="text-sm font-medium">Tiempo del Paso:</span>
            <span className="font-mono font-bold text-lg text-primary">
              {maceratorCalculatedTime.valid ? `${maceratorCalculatedTime.duration.toFixed(2)} min` : "—"}
            </span>
          </div>
        </div>
        <Table>
          <TableBody>
            <TableRow>
              <TableCell className="font-medium py-3 text-sm">Tiempo "Recibir Cocedor"</TableCell>
              <TableCell className="text-right font-mono font-medium text-base py-3 text-foreground/80">{recibirCocedorTime}</TableCell>
            </TableRow>
            <TableRow className="border-0">
              <TableCell className="font-medium py-3 text-sm">Temp. "Cont. Conversión"</TableCell>
              <TableCell className="text-right font-mono font-medium text-base py-3 text-foreground/80">{conversionTemp}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
        {!maceratorRecord && (
          <div className="rounded-md bg-muted p-3 text-sm text-center text-muted-foreground">
            No se encontraron datos para el Macerador en este lote.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
