import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MultiSelect } from "@/components/ui/multi_select";
import { DateRange } from "react-day-picker";
import { DatePickerWithRange } from "@/components/ui/date_range_picker";
import { FILTER_ALL } from "@/lib/constants";
import { Filter } from "lucide-react";

interface StepDurationFiltersProps {
  dateRange: DateRange | undefined;
  setDateRange: (val: DateRange | undefined) => void;
  minDataDate: Date | undefined;
  maxDataDate: Date | undefined;
  selectedRecipe: string;
  setSelectedRecipe: (val: string) => void;
  uniqueRecipes: string[];
  selectedMachines: string[];
  setSelectedMachines: (val: string[]) => void;
  uniqueMachines: string[];
  selectedSteps: string[];
  setSelectedSteps: (val: string[]) => void;
  uniqueSteps: string[];
  analysisValuesLength: number;
}

export function StepDurationFilters({
  dateRange, setDateRange, minDataDate, maxDataDate,
  selectedRecipe, setSelectedRecipe, uniqueRecipes,
  selectedMachines, setSelectedMachines, uniqueMachines,
  selectedSteps, setSelectedSteps, uniqueSteps,
  analysisValuesLength
}: StepDurationFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-4 p-3 bg-muted/20 rounded-lg border border-border/50">
      <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium mr-2">
         <Filter className="h-4 w-4" /> Filtros:
      </div>
      
      <div className="flex flex-col sm:flex-row gap-3 flex-1 flex-wrap">
        <DatePickerWithRange 
          className="w-full sm:w-auto [&>div>button]:h-9"
          date={dateRange} 
          setDate={setDateRange} 
          minDate={minDataDate} 
          maxDate={maxDataDate} 
        />

        <Select value={selectedRecipe} onValueChange={setSelectedRecipe}>
          <SelectTrigger className="w-full sm:w-[200px] h-9 bg-background">
            <SelectValue placeholder="Receta" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={FILTER_ALL}>Todas las recetas</SelectItem>
            {uniqueRecipes.map((r) => (
              <SelectItem key={r} value={r}>{r}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <MultiSelect
          options={uniqueMachines}
          selected={selectedMachines}
          onChange={setSelectedMachines}
          placeholder="Equipos"
          className="bg-background w-full sm:w-[200px]"
        />

        <MultiSelect
          options={uniqueSteps}
          selected={selectedSteps}
          onChange={setSelectedSteps}
          placeholder="Pasos"
          className="bg-background w-full sm:w-[200px]"
        />
      </div>

      <div className="text-xs text-muted-foreground ml-auto bg-background px-2 py-1 rounded border border-border/50">
        Muestra: <span className="font-bold text-foreground">{analysisValuesLength}</span> registros
      </div>
    </div>
  );
}
