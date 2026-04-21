import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { MultiSelect } from "@/components/ui/multi_select";
import { CalendarIcon } from "lucide-react";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";

interface CycleFiltersProps {
  activeTab: string;
  selectedProduct: string;
  setSelectedProduct: (val: string) => void;
  uniqueProducts: string[];
  selectedStep: string;
  setSelectedStep: (val: string) => void;
  uniqueSteps: string[];
  theoreticalDuration: number;
  setTheoreticalDuration: (val: number) => void;
  selectedDate: string;
  setSelectedDate: (val: string) => void;
  availableDates: string[];
  selectedBatches: string[];
  setSelectedBatches: (val: string[]) => void;
  availableBatches: string[];
  selectedEquipments: string[];
  setSelectedEquipments: (val: string[]) => void;
  availableEquipments: string[];
  selectedBrew: string;
  setSelectedBrew: (val: string) => void;
}

export function CycleFilters({
  activeTab,
  selectedProduct, setSelectedProduct, uniqueProducts,
  selectedStep, setSelectedStep, uniqueSteps,
  theoreticalDuration, setTheoreticalDuration,
  selectedDate, setSelectedDate, availableDates,
  selectedBatches, setSelectedBatches, availableBatches,
  selectedEquipments, setSelectedEquipments, availableEquipments,
  selectedBrew, setSelectedBrew
}: CycleFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row flex-wrap gap-3 bg-card/50 backdrop-blur-sm p-3 rounded-lg border border-border shadow-sm print:hidden">
      <div className="w-full sm:w-[200px]">
        <Label className="text-xs text-muted-foreground mb-1 block">Producto</Label>
        <Select value={selectedProduct || "ALL"} onValueChange={(val) => setSelectedProduct(val === "ALL" ? "" : val)}>
          <SelectTrigger className="h-8 bg-background/50"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos los productos</SelectItem>
            {uniqueProducts.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {activeTab === "area" && (
        <>
          <div className="w-full sm:w-[200px]">
            <Label className="text-xs text-muted-foreground mb-1 block">Fase / Paso (Área)</Label>
            <Select value={selectedStep} onValueChange={setSelectedStep}>
               <SelectTrigger className="h-8 bg-background/50"><SelectValue /></SelectTrigger>
               <SelectContent>
                  <SelectItem value="FULL_CYCLE">Ciclo Completo (Total)</SelectItem>
                  {uniqueSteps.map(step => <SelectItem key={step} value={step}>{step}</SelectItem>)}
               </SelectContent>
            </Select>
          </div>
          <div className="w-full sm:w-[120px]">
            <Label className="text-xs text-muted-foreground mb-1 block">Meta Global (min)</Label>
            <Input type="number" className="h-8 bg-background/50" value={theoreticalDuration} onChange={(e) => setTheoreticalDuration(Number(e.target.value))} />
          </div>
        </>
      )}

      {(activeTab === "gantt" || activeTab === "brew_gantt") && (
        <div className="w-full sm:w-[160px]">
            <Label className="text-xs text-muted-foreground mb-1 block">Día Gantt</Label>
            <Popover>
               <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full h-8 justify-start text-left font-normal bg-background/50", !selectedDate && "text-muted-foreground")}>
                     <CalendarIcon className="mr-2 h-4 w-4" />
                     {selectedDate ? format(parseISO(selectedDate), "dd/MM/yyyy") : <span>Elige fecha</span>}
                  </Button>
               </PopoverTrigger>
               <PopoverContent className="w-auto p-0" align="start">
                  <Calendar 
                    mode="single" 
                    selected={selectedDate ? parseISO(selectedDate) : undefined} 
                    onSelect={(date) => date && setSelectedDate(format(date, "yyyy-MM-dd"))} 
                    disabled={(date) => !availableDates.includes(format(date, "yyyy-MM-dd"))} 
                    initialFocus 
                  />
               </PopoverContent>
            </Popover>
        </div>
      )}

      {activeTab === "gantt" && (
        <>
            <div className="w-full sm:w-[250px]">
               <Label className="text-xs text-muted-foreground mb-1 block">Filtro Lotes</Label>
               <MultiSelect 
                 options={availableBatches} 
                 selected={selectedBatches} 
                 onChange={setSelectedBatches} 
                 placeholder={availableBatches.length > 0 ? "Todos los del día..." : "Sin lotes en el día"} 
                 className="bg-background/50 max-h-8 overflow-y-auto" 
               />
            </div>
            <div className="w-full sm:w-[250px]">
               <Label className="text-xs text-muted-foreground mb-1 block">Filtro Equipos</Label>
               <MultiSelect 
                 options={availableEquipments} 
                 selected={selectedEquipments} 
                 onChange={setSelectedEquipments} 
                 placeholder="Todos los equipos..." 
                 className="bg-background/50 max-h-8 overflow-y-auto" 
               />
            </div>
        </>
      )}

      {activeTab === "brew_gantt" && (
         <div className="w-full sm:w-[250px]">
            <Label className="text-xs text-muted-foreground mb-1 block">Lote (Cocimiento)</Label>
            <Select value={selectedBrew} onValueChange={setSelectedBrew}>
               <SelectTrigger className="h-8 bg-background/50">
                  <SelectValue placeholder="Elige lote..." />
               </SelectTrigger>
               <SelectContent>
                  {availableBatches.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
               </SelectContent>
            </Select>
         </div>
      )}
    </div>
  );
}
