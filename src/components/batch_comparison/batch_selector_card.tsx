
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowRight } from "lucide-react";
import { MultiSelect } from "@/components/ui/multi_select";

interface BatchSelectorCardProps {
  batchIds: string[];
  selectedBatches: string[];
  batchProductMap: Map<string, string>;
  onChangeBatches: (val: string[]) => void;
  machines: string[];
  selectedMachines: string[];
  onChangeMachines: (val: string[]) => void;
}
export function BatchSelectorCard({
  batchIds,
  selectedBatches,
  batchProductMap,
  onChangeBatches,
  machines,
  selectedMachines,
  onChangeMachines,
  data, // We need data to filter batches by machine
}: BatchSelectorCardProps & { data?: any[] }) {
  // If machines are selected, filter the batchIds to only those that ran on the selected machines
  let filteredBatchIds = batchIds;
  if (data && selectedMachines.length > 0) {
    const batchesOnSelectedMachines = new Set(
      data.filter(d => selectedMachines.includes(d.TEILANL_GRUPO)).map(d => d.CHARG_NR)
    );
    filteredBatchIds = batchIds.filter(id => batchesOnSelectedMachines.has(id));
  }

  const batchOptions = filteredBatchIds.map(id => `${id} - ${batchProductMap.get(id) || "Sin producto"}`);
  
  const handleOnBatchChange = (selectedOptions: string[]) => {
    const ids = selectedOptions.map(opt => opt.split(' - ')[0]);
    onChangeBatches(ids);
  };

  const selectedBatchOptions = selectedBatches.map(id => 
    `${id} - ${batchProductMap.get(id) || "Sin producto"}`
  );

  return (
    <Card className="bg-card border-border print:hidden">
      <CardHeader>
        <CardTitle>Comparativo de ciclos por equipo</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">Seleccionar Lotes</label>
          <MultiSelect
            options={batchOptions}
            selected={selectedBatchOptions}
            onChange={handleOnBatchChange}
            placeholder="Seleccionar Lotes para comparación..."
          />
          {selectedBatches.length > 0 && (
            <p className="text-xs text-muted-foreground">
              Comparando {selectedBatches.length} {selectedBatches.length === 1 ? 'lote' : 'lotes'}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">Filtrar por Equipos</label>
          <MultiSelect
            options={machines}
            selected={selectedMachines}
            onChange={onChangeMachines}
            placeholder="Seleccionar Equipos..."
          />
          {selectedMachines.length > 0 && (
            <p className="text-xs text-muted-foreground">
              Mostrando {selectedMachines.length} {selectedMachines.length === 1 ? 'equipo' : 'equipos'}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
