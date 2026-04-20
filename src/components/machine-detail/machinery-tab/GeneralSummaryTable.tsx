import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Check, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export function GeneralSummaryTable({
  selectedBatchId,
  compareBatchIds,
  setCompareBatchIds,
  allBatchIds,
  comparisonData,
  selectedMaceratorStepName,
}: {
  selectedBatchId: string;
  compareBatchIds: string[];
  setCompareBatchIds: React.Dispatch<React.SetStateAction<string[]>>;
  allBatchIds: string[];
  comparisonData: any[];
  selectedMaceratorStepName: string;
}) {
  return (
    <Card>
      <CardHeader className="bg-muted/50 pb-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <CardTitle className="text-lg">Resumen General de Equipos</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">Comparativa de métricas entre lotes seleccionados</p>
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 gap-2">
                <Plus className="h-4 w-4" /> Comparar Lotes
                {compareBatchIds.length > 1 && (
                  <Badge variant="secondary" className="ml-1 px-1 h-5 min-w-5 flex items-center justify-center rounded-full">
                    {compareBatchIds.length}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0" align="end">
              <Command>
                 <CommandInput placeholder="Buscar lote..." />
                 <CommandList>
                   <CommandEmpty>No se encontraron lotes.</CommandEmpty>
                   <CommandGroup className="max-h-[300px] overflow-auto">
                     {allBatchIds.map((batchId) => (
                       <CommandItem
                         key={batchId}
                         onSelect={() => setCompareBatchIds(prev => prev.includes(batchId) ? prev.filter(id => id !== batchId || id === selectedBatchId) : [...prev, batchId])}
                         className="flex items-center justify-between"
                       >
                         <div className="flex items-center gap-2">
                           <div className={cn("flex h-4 w-4 items-center justify-center rounded-sm border border-primary", compareBatchIds.includes(batchId) ? "bg-primary text-primary-foreground" : "opacity-50")}>
                             {compareBatchIds.includes(batchId) && <Check className="h-3 w-3" />}
                           </div>
                           <span>{batchId}</span>
                         </div>
                         {batchId === selectedBatchId && <Badge variant="outline" className="text-[10px] h-4">Principal</Badge>}
                       </CommandItem>
                     ))}
                   </CommandGroup>
                 </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
        {compareBatchIds.length > 1 && (
          <div className="flex flex-wrap gap-2 mt-4">
             <AnimatePresence>
               {compareBatchIds.map(id => (
                 <motion.div key={id} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}>
                   <Badge variant={id === selectedBatchId ? "default" : "secondary"} className="gap-1 pr-1 pl-2 py-1">
                     {id}
                     {id !== selectedBatchId && (
                       <Button variant="ghost" size="icon" className="h-4 w-4 hover:bg-transparent" onClick={() => setCompareBatchIds(prev => prev.filter(bid => bid !== id))}>
                         <X className="h-3 w-3" />
                       </Button>
                     )}
                   </Badge>
                 </motion.div>
               ))}
             </AnimatePresence>
          </div>
        )}
      </CardHeader>
      <CardContent className="p-0 overflow-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="w-[100px] sticky left-0 bg-background z-10">Equipo</TableHead>
              <TableHead className="w-[180px] sticky left-[100px] bg-background z-10">Métrica</TableHead>
              {comparisonData.map(d => (
                <TableHead key={d.batchId} className="text-right min-w-[120px]">
                  <div className="flex flex-col items-end">
                    <span className="font-bold text-foreground">{d.batchId}</span>
                    {d.batchId === selectedBatchId && <span className="text-[10px] text-primary italic font-normal">Vista actual</span>}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="font-medium sticky left-0 bg-background z-10">Filtro</TableCell>
              <TableCell className="sticky left-[100px] bg-background z-10">Tiempo Total Real</TableCell>
              {comparisonData.map(d => (
                <TableCell key={`f-time-${d.batchId}`} className="text-right font-mono font-bold">
                  {d.filterTime > 0 ? `${d.filterTime.toFixed(3)} min` : "—"}
                </TableCell>
              ))}
            </TableRow>
            <TableRow>
              <TableCell className="font-medium sticky left-0 bg-background z-10">Macerador</TableCell>
              <TableCell className="sticky left-[100px] bg-background z-10">Tiempo "Recibir Cocedor"</TableCell>
              {comparisonData.map(d => (
                <TableCell key={`m-rec-${d.batchId}`} className="text-right font-mono font-bold">{d.recibirCocedorLabel}</TableCell>
              ))}
            </TableRow>
            <TableRow>
              <TableCell className="font-medium sticky left-0 bg-background z-10">Macerador</TableCell>
              <TableCell className="sticky left-[100px] bg-background z-10">Pausa Macerador</TableCell>
              {comparisonData.map(d => (
                <TableCell key={`m-pause-${d.batchId}`} className="text-right font-mono font-bold">{d.pauseDur > 0 ? `${d.pauseDur.toFixed(2)} min` : "—"}</TableCell>
              ))}
            </TableRow>
            <TableRow>
              <TableCell className="font-medium sticky left-0 bg-background z-10">Macerador</TableCell>
              <TableCell className="sticky left-[100px] bg-background z-10">Paso: {selectedMaceratorStepName || "..."}</TableCell>
              {comparisonData.map(d => (
                <TableCell key={`m-step-${d.batchId}`} className="text-right font-mono font-bold">{d.selectedStepLabel}</TableCell>
              ))}
            </TableRow>
            <TableRow>
              <TableCell className="font-medium sticky left-0 bg-background z-10">Macerador</TableCell>
              <TableCell className="sticky left-[100px] bg-background z-10">Temp. "Cont. Conversión"</TableCell>
              {comparisonData.map(d => (
                <TableCell key={`m-temp-${d.batchId}`} className="text-right font-mono font-bold">{d.conversionTempLabel}</TableCell>
              ))}
            </TableRow>
            <TableRow>
              <TableCell className="font-medium sticky left-0 bg-background z-10">Macerador / Cocimiento</TableCell>
              <TableCell className="sticky left-[100px] bg-background z-10">Grado Plato (DFM8)</TableCell>
              {comparisonData.map(d => (
                <TableCell key={`m-plato-${d.batchId}`} className="text-right font-mono font-bold">{d.platoLabel}</TableCell>
              ))}
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
