// src/components/batch-comparison/BatchSelectorCard.tsx
// Card de selección de dos lotes para comparación directa

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowRight } from "lucide-react";

interface BatchSelectorCardProps {
  batchIds: string[];
  batchA: string;
  batchB: string;
  batchProductMap: Map<string, string>;
  onChangeBatchA: (val: string) => void;
  onChangeBatchB: (val: string) => void;
}

export function BatchSelectorCard({
  batchIds,
  batchA,
  batchB,
  batchProductMap,
  onChangeBatchA,
  onChangeBatchB,
}: BatchSelectorCardProps) {
  return (
    <Card className="bg-card border-border print:hidden">
      <CardHeader>
        <CardTitle>Seleccionar Lotes</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="flex-1 w-full">
            <Select value={batchA} onValueChange={onChangeBatchA}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar Lote A" />
              </SelectTrigger>
              <SelectContent>
                {batchIds.map((id) => (
                  <SelectItem key={id} value={id}>
                    {id} - {batchProductMap.get(id) || "Sin producto"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <ArrowRight className="h-6 w-6 text-muted-foreground hidden sm:block" />
          <div className="flex-1 w-full">
            <Select value={batchB} onValueChange={onChangeBatchB}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar Lote B" />
              </SelectTrigger>
              <SelectContent>
                {batchIds.map((id) => (
                  <SelectItem key={id} value={id}>
                    {id} - {batchProductMap.get(id) || "Sin producto"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
