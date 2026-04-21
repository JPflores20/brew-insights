import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DateRange } from "react-day-picker";
import { DatePickerWithRange } from "@/components/ui/date_range_picker";
import { FILTER_ALL } from "@/lib/constants";
import { Filter } from "lucide-react";

interface ExcelCapabilityFiltersProps {
  selectedParam: string;
  setSelectedParam: (val: string) => void;
  uniqueParams: string[];
  selectedEtapa: string;
  setSelectedEtapa: (val: string) => void;
  uniqueEtapas: string[];
  selectedMarca: string;
  setSelectedMarca: (val: string) => void;
  uniqueMarcas: string[];
  dateRange: DateRange | undefined;
  setDateRange: (val: DateRange | undefined) => void;
  availableDateRange: { min?: Date; max?: Date };
  filteredValuesLength: number;
}

export function ExcelCapabilityFilters({
  selectedParam, setSelectedParam, uniqueParams,
  selectedEtapa, setSelectedEtapa, uniqueEtapas,
  selectedMarca, setSelectedMarca, uniqueMarcas,
  dateRange, setDateRange, availableDateRange,
  filteredValuesLength
}: ExcelCapabilityFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-4 p-3 bg-muted/30 rounded-lg border border-border/50">
      <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium mr-2">
        <Filter className="h-4 w-4" /> Filtros Excel:
      </div>
      
      <div className="flex flex-wrap gap-3 items-center">
        <Select value={selectedParam} onValueChange={setSelectedParam}>
          <SelectTrigger className="w-[200px] h-9 bg-background">
            <SelectValue placeholder="Parámetro" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={FILTER_ALL}>Todos parámetros</SelectItem>
            {uniqueParams.map((p) => (
              <SelectItem key={p} value={p}>{p}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedEtapa} onValueChange={setSelectedEtapa}>
          <SelectTrigger className="w-[150px] h-9 bg-background">
            <SelectValue placeholder="Etapa" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={FILTER_ALL}>Todas las etapas</SelectItem>
            {uniqueEtapas.map((e) => (
              <SelectItem key={e} value={e}>{e}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedMarca} onValueChange={setSelectedMarca}>
          <SelectTrigger className="w-[150px] h-9 bg-background">
            <SelectValue placeholder="Marca" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={FILTER_ALL}>Todas las marcas</SelectItem>
            {uniqueMarcas.map((m) => (
              <SelectItem key={m} value={m}>{m}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="h-8 w-[1px] bg-border mx-1 hidden sm:block" />

        <DatePickerWithRange 
            date={dateRange} 
            setDate={setDateRange} 
            minDate={availableDateRange.min}
            maxDate={availableDateRange.max}
            className="h-9"
        />
      </div>

      <div className="text-xs text-muted-foreground ml-auto bg-background px-2 py-1 rounded border border-border/50">
        Muestra: <span className="font-bold text-foreground">{filteredValuesLength}</span> registros
      </div>
    </div>
  );
}
