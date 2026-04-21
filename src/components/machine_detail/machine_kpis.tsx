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
import { AlertTriangle, Clock, Settings } from "lucide-react";
import { MetricCard } from "@/components/ui/metric_card";
import { motion } from "framer-motion";
interface MachineKPIsProps {
    selectedMachine: string;
    setSelectedMachine: (value: string) => void;
    availableMachinesForBatch: string[];
    currentGap: number;
    currentIdle: number;
}
export const MachineKPIs = memo(function MachineKPIs({
    selectedMachine,
    setSelectedMachine,
    availableMachinesForBatch,
    currentGap,
    currentIdle,
}: MachineKPIsProps) {
    const [open, setOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const deferredSearch = useDeferredValue(searchTerm);
    const displayedMachines = useMemo(() => {
        let filtered = availableMachinesForBatch;
        if (deferredSearch) {
            const lower = deferredSearch.toLowerCase();
            filtered = filtered.filter(m => m.toLowerCase().includes(lower));
        }
        return filtered.slice(0, 50);
    }, [availableMachinesForBatch, deferredSearch]);
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
            >
                <Card className="bg-card/50 backdrop-blur-sm border-border h-full relative overflow-hidden group hover:border-primary/50 transition-colors">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Settings className="h-16 w-16" />
                    </div>
                    <CardHeader className="pb-2 pt-6">
                        <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                            <span className="bg-primary/20 text-primary w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">
                                3
                            </span>
                            Equipo Seleccionado
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Popover open={open} onOpenChange={setOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={open}
                                    className="w-full justify-between bg-background/50 border-input focus:ring-primary/50"
                                    disabled={availableMachinesForBatch.length === 0}
                                >
                                    {selectedMachine
                                        ? selectedMachine
                                        : availableMachinesForBatch.length === 0
                                            ? "Lote sin equipos"
                                            : "Selecciona equipo"}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-full p-0" align="start">
                                <Command shouldFilter={false}>
                                    <CommandInput
                                        placeholder="Buscar equipo..."
                                        value={searchTerm}
                                        onValueChange={setSearchTerm}
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
                                                        setOpen(false);
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
                        <div className="mt-4 text-xs text-muted-foreground flex justify-between">
                            <span>Total Equipos: {availableMachinesForBatch.length}</span>
                            <span className="text-primary/80">{selectedMachine ? 'Activo' : 'Pendiente'}</span>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
            {}
            <MetricCard
                title="Mayor Gap Detectado"
                value={`${currentGap} min`}
                subtitle="Tiempo perdido entre pasos"
                icon={AlertTriangle}
                className="border-l-4 border-l-chart-delay"
                delay={0.1}
                trend="down"
                trendValue={currentGap > 5 ? "Crítico" : "Normal"}
            />
            {}
            <MetricCard
                title="Tiempo Muerto Total"
                value={`${currentIdle} min`}
                subtitle="Acumulado en el proceso"
                icon={Clock}
                className="border-l-4 border-l-blue-500"
                delay={0.2}
                trend="neutral"
            />
        </div>
    );
});
