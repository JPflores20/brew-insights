import { Badge } from "@/components/ui/badge";
interface MachineHeaderProps {
  selectedBatchId?: string;
  selectedMachine?: string;
  onExport?: () => void;
  onPrint?: () => void;
}
import { Button } from "@/components/ui/button";
import { Download, Printer } from "lucide-react";
export function MachineHeader({ selectedBatchId, selectedMachine, onExport, onPrint }: MachineHeaderProps) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between mb-4 print:hidden">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Detalle de Lote y Pasos
        </h1>
        <p className="text-muted-foreground">
          Selecciona un lote o revisa las sugerencias automáticas
        </p>
      </div>
      <div className="flex items-center gap-2">
        {onPrint && (
           <Button variant="outline" size="sm" onClick={onPrint} className="h-8">
             <Printer className="mr-2 h-3 w-3" /> Imprimir PDF
           </Button>
        )}
        {onExport && (
          <Button variant="outline" size="sm" onClick={onExport} className="h-8">
            <Download className="mr-2 h-3 w-3" /> Exportar
          </Button>
        )}
        <Badge variant="secondary" className="font-mono h-8 flex items-center">
          {selectedBatchId || "—"}
        </Badge>
        <Badge variant="secondary" className="font-mono h-8 flex items-center">
          {selectedMachine || "—"}
        </Badge>
      </div>
    </div>
  );
}
