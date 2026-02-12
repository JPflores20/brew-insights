import { Badge } from "@/components/ui/badge";

interface MachineHeaderProps {
  selectedBatchId?: string;
  selectedMachine?: string;
}

export function MachineHeader({ selectedBatchId, selectedMachine }: MachineHeaderProps) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between mb-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Detalle de Lote y Pasos
        </h1>
        <p className="text-muted-foreground">
          Selecciona un lote o revisa las sugerencias automáticas
        </p>
      </div>

      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="font-mono">
          {selectedBatchId || "—"}
        </Badge>
        <Badge variant="secondary" className="font-mono">
          {selectedMachine || "—"}
        </Badge>
      </div>
    </div>
  );
}
