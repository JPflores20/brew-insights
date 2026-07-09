import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { memo, useState, useMemo, useDeferredValue } from "react";
import { FILTER_ALL } from "@/lib/constants";

interface GlobalFiltersProps {
    selectedRecipe: string;
    setSelectedRecipe: (value: string) => void;
    uniqueRecipes: string[];
    selectedBatchId: string;
    setSelectedBatchId: (value: string) => void;
    filteredBatches: string[];
    batchProductMap: Map<string, string>;
    selectedMachine: string;
    setSelectedMachine: (value: string) => void;
    availableMachinesForBatch: string[];
}
export const GlobalFilters = memo(function GlobalFilters({
    selectedRecipe,
    setSelectedRecipe,
    uniqueRecipes,
    selectedBatchId,
    setSelectedBatchId,
    filteredBatches,
    batchProductMap,
    selectedMachine,
    setSelectedMachine,
    availableMachinesForBatch,
}: GlobalFiltersProps) {
    const [openBatch, setOpenBatch] = useState(false);
    const [openRecipe, setOpenRecipe] = useState(false);
    const [batchSearchTerm, setBatchSearchTerm] = useState("");
    const deferredBatchSearch = useDeferredValue(batchSearchTerm);
    const [recipeSearchTerm, setRecipeSearchTerm] = useState("");
    const deferredRecipeSearch = useDeferredValue(recipeSearchTerm);
    const [openMachine, setOpenMachine] = useState(false);
    const [machineSearchTerm, setMachineSearchTerm] = useState("");
    const deferredMachineSearch = useDeferredValue(machineSearchTerm);
    const displayedRecipes = useMemo(() => {
        let filtered = uniqueRecipes;
        if (deferredRecipeSearch) {
            const lower = deferredRecipeSearch.toLowerCase();
            filtered = filtered.filter(r => r.toLowerCase().includes(lower));
        }
        return filtered;
    }, [uniqueRecipes, deferredRecipeSearch]);
    const displayedBatches = useMemo(() => {
        let filtered = filteredBatches;
        if (deferredBatchSearch) {
            const lower = deferredBatchSearch.toLowerCase();
            filtered = filtered.filter(batch => {
                if (batch.toLowerCase().includes(lower)) return true;
                const product = batchProductMap.get(batch);
                return product ? product.toLowerCase().includes(lower) : false;
            });
        }
        return filtered;
    }, [filteredBatches, batchProductMap, deferredBatchSearch]);

    const displayedMachines = useMemo(() => {
        let filtered = availableMachinesForBatch;
        if (deferredMachineSearch) {
            const lower = deferredMachineSearch.toLowerCase();
            filtered = filtered.filter(m => m.toLowerCase().includes(lower));
        }
        return filtered.slice(0, 50);
    }, [availableMachinesForBatch, deferredMachineSearch]);

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {}
            <Card className="bg-card border-border">
                <CardHeader className="pb-2 pt-4">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <span className="bg-primary/20 text-primary w-6 h-6 rounded-full flex items-center justify-center text-xs">
                            1
                        </span>
                        Filtrar Receta
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Popover open={openRecipe} onOpenChange={setOpenRecipe}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={openRecipe}
                                className="w-full justify-between font-normal"
                            >
                                {selectedRecipe === FILTER_ALL
                                    ? "Todas las recetas"
                                    : selectedRecipe}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0" align="start">
                            <Command shouldFilter={false}>
                                <CommandInput
                                    placeholder="Buscar receta..."
                                    value={recipeSearchTerm}
                                    onValueChange={setRecipeSearchTerm}
                                />
                                <CommandList>
                                    <CommandEmpty>No hay recetas.</CommandEmpty>
                                    <CommandGroup>
                                        <CommandItem
                                            value={FILTER_ALL}
                                            onSelect={() => {
                                                setSelectedRecipe(FILTER_ALL);
                                                setOpenRecipe(false);
                                            }}
                                        >
                                            <Check
                                                className={cn(
                                                    "mr-2 h-4 w-4",
                                                    selectedRecipe === FILTER_ALL ? "opacity-100" : "opacity-0"
                                                )}
                                            />
                                            Todas las recetas
                                        </CommandItem>
                                        {displayedRecipes.map((r) => (
                                            <CommandItem
                                                key={r}
                                                value={r}
                                                onSelect={(currentValue) => {
                                                    setSelectedRecipe(currentValue === selectedRecipe ? FILTER_ALL : currentValue);
                                                    setOpenRecipe(false);
                                                }}
                                            >
                                                <Check
                                                    className={cn(
                                                        "mr-2 h-4 w-4",
                                                        selectedRecipe === r ? "opacity-100" : "opacity-0"
                                                    )}
                                                />
                                                {r}
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
                </CardContent>
            </Card>
            {}
            <Card className="bg-card border-border">
                <CardHeader className="pb-2 pt-4">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <span className="bg-primary/20 text-primary w-6 h-6 rounded-full flex items-center justify-center text-xs">
                            2
                        </span>
                        Seleccionar Lote
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Popover open={openBatch} onOpenChange={setOpenBatch}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={openBatch}
                                className="w-full justify-between font-normal"
                            >
                                {selectedBatchId
                                    ? selectedBatchId === FILTER_ALL 
                                        ? "Todos los lotes" 
                                        : <span className="truncate">{selectedBatchId} - {batchProductMap.get(selectedBatchId)}</span>
                                    : "Buscar lote..."}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0" align="start">
                            <Command shouldFilter={false}>
                                <CommandInput
                                    placeholder="Buscar por lote o producto..."
                                    value={batchSearchTerm}
                                    onValueChange={setBatchSearchTerm}
                                />
                                <CommandList>
                                    <CommandEmpty>No se encontraron lotes.</CommandEmpty>
                                    <CommandGroup>
                                        <CommandItem
                                            value={FILTER_ALL}
                                            onSelect={() => {
                                                setSelectedBatchId(FILTER_ALL);
                                                setOpenBatch(false);
                                            }}
                                        >
                                            <Check
                                                className={cn(
                                                    "mr-2 h-4 w-4",
                                                    selectedBatchId === FILTER_ALL ? "opacity-100" : "opacity-0"
                                                )}
                                            />
                                            Todos los lotes
                                        </CommandItem>
                                        {displayedBatches.map((batch) => (
                                            <CommandItem
                                                key={batch}
                                                value={batch}
                                                onSelect={(currentValue) => {
                                                    setSelectedBatchId(currentValue === selectedBatchId ? "" : currentValue);
                                                    setOpenBatch(false);
                                                }}
                                            >
                                                <Check
                                                    className={cn(
                                                        "mr-2 h-4 w-4",
                                                        selectedBatchId === batch ? "opacity-100" : "opacity-0"
                                                    )}
                                                />
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{batch}</span>
                                                    <span className="text-xs text-muted-foreground">{batchProductMap.get(batch)}</span>
                                                </div>
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
                </CardContent>
            </Card>

            {/* Equipo Seleccionado */}
            <Card className="bg-card border-border">
                <CardHeader className="pb-2 pt-4">
                    <CardTitle className="text-sm font-medium flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="bg-primary/20 text-primary w-6 h-6 rounded-full flex items-center justify-center text-xs">
                                3
                            </span>
                            Equipo Seleccionado
                        </div>
                        <span className={cn("text-xs font-normal px-2 py-0.5 rounded-full", selectedMachine ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground')}>
                            {selectedMachine ? 'Activo' : 'Pendiente'}
                        </span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Popover open={openMachine} onOpenChange={setOpenMachine}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={openMachine}
                                className="w-full justify-between font-normal"
                                disabled={availableMachinesForBatch.length === 0}
                            >
                                {selectedMachine
                                    ? selectedMachine
                                    : availableMachinesForBatch.length === 0
                                        ? "Lote sin equipos"
                                        : "Selecciona equipo..."}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0" align="start">
                            <Command shouldFilter={false}>
                                <CommandInput
                                    placeholder="Buscar equipo..."
                                    value={machineSearchTerm}
                                    onValueChange={setMachineSearchTerm}
                                />
                                <CommandList>
                                    <CommandEmpty>No se encontraron equipos.</CommandEmpty>
                                    <CommandGroup>
                                        {displayedMachines.map((machine) => (
                                            <CommandItem
                                                key={machine}
                                                value={machine}
                                                onSelect={(currentValue) => {
                                                    setSelectedMachine(currentValue === selectedMachine ? "" : currentValue);
                                                    setOpenMachine(false);
                                                }}
                                            >
                                                <Check
                                                    className={cn(
                                                        "mr-2 h-4 w-4",
                                                        selectedMachine === machine ? "opacity-100" : "opacity-0"
                                                    )}
                                                />
                                                {machine}
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
                    <div className="mt-2 text-[10px] text-muted-foreground">
                        Total Equipos: {availableMachinesForBatch.length}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
});
