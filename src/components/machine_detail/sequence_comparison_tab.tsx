import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from "recharts";
import { 
    Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList 
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronsUpDown, BarChart3, Clock, X } from "lucide-react";
import { BatchRecord } from "@/types";
import { getUniqueBatchIds } from "@/data/mock_data";
import { cn } from "@/lib/utils";
import { FILTER_ALL } from "@/lib/constants";

interface SequenceComparisonTabProps {
    data: BatchRecord[];
    initialMachine: string;
    // Estados persistentes pasados desde el hook
    compSelectedRecipe: string;
    setCompSelectedRecipe: (value: string) => void;
    compCompareBatchIds: string[];
    setCompCompareBatchIds: (value: string[] | ((prev: string[]) => string[])) => void;
    compSelectedMachineGroup: string;
    setCompSelectedMachineGroup: (value: string) => void;
}

const BATCH_COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff8042", "#0088fe", "#00c49f", "#ffbb28", "#ff4444", "#a4de6c"];

const AXIS_LABEL_STYLE = { fontSize: 10, fill: "hsl(var(--muted-foreground))" };

const normalizeMachineName = (name: string) => name.replace(/[\s\.-]+(\d+)$/, '').trim();

export const SequenceComparisonTab = ({ 
    data, 
    initialMachine,
    compSelectedRecipe,
    setCompSelectedRecipe,
    compCompareBatchIds,
    setCompCompareBatchIds,
    compSelectedMachineGroup,
    setCompSelectedMachineGroup
}: SequenceComparisonTabProps) => {
    const [searchTerm, setSearchTerm] = useState("");

    // Inicializar el grupo de máquina si está vacío
    React.useEffect(() => {
        if (!compSelectedMachineGroup && initialMachine) {
            setCompSelectedMachineGroup(normalizeMachineName(initialMachine));
        }
    }, [initialMachine, compSelectedMachineGroup, setCompSelectedMachineGroup]);

    const uniqueMachineGroups = useMemo(() => {
        const rawSet = new Set(data.map((d) => normalizeMachineName(d.TEILANL_GRUPO)).filter(Boolean));
        return Array.from(rawSet).sort();
    }, [data]);

    const uniqueRecipes = useMemo(() => {
        const rawSet = new Set(data.map((d) => d.productName).filter(Boolean));
        return Array.from(rawSet).sort();
    }, [data]);

    const filteredBatches = useMemo(() => {
        let filtered = compSelectedRecipe !== FILTER_ALL 
            ? data.filter((d) => d.productName === compSelectedRecipe) 
            : data;
        return getUniqueBatchIds(filtered);
    }, [data, compSelectedRecipe]);

    const batchProductMap = useMemo(() => {
        const map = new Map<string, string>();
        data.forEach((d) => { if (d.productName) map.set(d.CHARG_NR, d.productName); });
        return map;
    }, [data]);

    const batchTotals = useMemo(() => {
        const totals: { batchId: string, duration: number, realMachine: string }[] = [];
        
        compCompareBatchIds.forEach(batchId => {
            const record = data.find(d => 
                d.CHARG_NR === batchId && 
                normalizeMachineName(d.TEILANL_GRUPO) === compSelectedMachineGroup
            );
            
            if (record?.steps) {
                const total = record.steps.reduce((sum, s) => sum + s.durationMin, 0);
                totals.push({ 
                    batchId, 
                    duration: Number(total.toFixed(2)), 
                    realMachine: record.TEILANL_GRUPO 
                });
            }
        });
        
        return totals;
    }, [data, compCompareBatchIds, compSelectedMachineGroup]);

    const comparisonStepsData = useMemo(() => {
        if (compCompareBatchIds.length === 0) return [];
        
        const allStepsSet = new Set<string>();
        const batchStepMap = new Map<string, Map<string, number>>();
        const batchRealMachineMap = new Map<string, string>();

        compCompareBatchIds.forEach(batchId => {
            const record = data.find(d => 
                d.CHARG_NR === batchId && 
                normalizeMachineName(d.TEILANL_GRUPO) === compSelectedMachineGroup
            );
            
            if (record?.steps) {
                batchRealMachineMap.set(batchId, record.TEILANL_GRUPO);
                const stepDurations = new Map<string, number>();
                record.steps.forEach(s => {
                    allStepsSet.add(s.stepName);
                    const current = stepDurations.get(s.stepName) || 0;
                    stepDurations.set(s.stepName, current + s.durationMin);
                });
                batchStepMap.set(batchId, stepDurations);
            }
        });

        const orderedSteps = Array.from(allStepsSet);

        return orderedSteps.map(stepName => {
            const point: any = { stepName };
            compCompareBatchIds.forEach(batchId => {
                const durations = batchStepMap.get(batchId);
                point[batchId] = durations?.get(stepName) || 0;
                // Adjuntamos el nombre real del equipo para el Tooltip
                point[`${batchId}_realMachine`] = batchRealMachineMap.get(batchId) || "";
            });
            return point;
        });
    }, [data, compCompareBatchIds, compSelectedMachineGroup]);

    const toggleBatch = (batchId: string) => {
        setCompCompareBatchIds(prev => 
            prev.includes(batchId) 
                ? prev.filter(id => id !== batchId) 
                : [...prev, batchId]
        );
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader className="pb-4 border-b">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <CardTitle className="text-xl">Filtros de Comparación</CardTitle>
                            <p className="text-sm text-muted-foreground mt-1">
                                Selecciona múltiples lotes para comparar sus duraciones de pasos en <span className="text-primary font-bold">{compSelectedMachineGroup}</span>
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {compCompareBatchIds.length > 0 && (
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => setCompCompareBatchIds([])}
                                    className="h-9 gap-2 text-destructive hover:bg-destructive/10"
                                >
                                    <X className="h-4 w-4" /> Limpiar Todo
                                </Button>
                            )}
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Equipo</label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="w-full justify-between font-normal border-primary/20 bg-primary/5 hover:bg-primary/10">
                                        {compSelectedMachineGroup}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[300px] p-0" align="start">
                                    <Command>
                                        <CommandInput placeholder="Buscar equipo..." />
                                        <CommandList>
                                            <CommandEmpty>No hay equipos.</CommandEmpty>
                                            <CommandGroup>
                                                {uniqueMachineGroups.map(m => (
                                                    <CommandItem 
                                                        key={m} 
                                                        onSelect={() => setCompSelectedMachineGroup(m)}
                                                        className="flex items-center gap-2"
                                                    >
                                                        <Check className={cn("h-4 w-4", compSelectedMachineGroup === m ? "opacity-100" : "opacity-0")} />
                                                        {m}
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Receta</label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="w-full justify-between font-normal">
                                        {compSelectedRecipe === FILTER_ALL ? "Todas las recetas" : compSelectedRecipe}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[300px] p-0" align="start">
                                    <Command>
                                        <CommandInput placeholder="Buscar receta..." />
                                        <CommandList>
                                            <CommandEmpty>No hay recetas.</CommandEmpty>
                                            <CommandGroup>
                                                <CommandItem 
                                                    onSelect={() => setCompSelectedRecipe(FILTER_ALL)}
                                                    className="flex items-center gap-2"
                                                >
                                                    <Check className={cn("h-4 w-4", compSelectedRecipe === FILTER_ALL ? "opacity-100" : "opacity-0")} />
                                                    Todas las recetas
                                                </CommandItem>
                                                {uniqueRecipes.map(r => (
                                                    <CommandItem 
                                                        key={r} 
                                                        onSelect={() => setCompSelectedRecipe(r)}
                                                        className="flex items-center gap-2"
                                                    >
                                                        <Check className={cn("h-4 w-4", compSelectedRecipe === r ? "opacity-100" : "opacity-0")} />
                                                        {r}
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Añadir Lotes</label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="w-full justify-between font-normal">
                                        Seleccionar lotes...
                                        <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[400px] p-0" align="start">
                                    <Command shouldFilter={false}>
                                        <CommandInput 
                                            placeholder="Buscar lote o producto..." 
                                            value={searchTerm}
                                            onValueChange={setSearchTerm}
                                        />
                                        <CommandList>
                                            <CommandEmpty>No se encontraron lotes.</CommandEmpty>
                                            <CommandGroup className="max-h-[300px] overflow-auto">
                                                {filteredBatches
                                                    .filter(b => b.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                                                (batchProductMap.get(b)?.toLowerCase().includes(searchTerm.toLowerCase())))
                                                    .slice(0, 50)
                                                    .map((batch) => (
                                                    <CommandItem
                                                        key={batch}
                                                        onSelect={() => toggleBatch(batch)}
                                                        className="flex items-center justify-between"
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <div className={cn(
                                                                "flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                                                                compCompareBatchIds.includes(batch) ? "bg-primary text-primary-foreground" : "opacity-50"
                                                            )}>
                                                                {compCompareBatchIds.includes(batch) && <Check className="h-3 w-3" />}
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="font-medium text-sm">{batch}</span>
                                                                <span className="text-[10px] text-muted-foreground">{batchProductMap.get(batch)}</span>
                                                            </div>
                                                        </div>
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>

                    {compCompareBatchIds.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-2">
                            {compCompareBatchIds.map(id => (
                                <Badge key={id} variant="secondary" className="pl-2 pr-1 py-1 gap-1">
                                    {id}
                                    <button onClick={() => toggleBatch(id)} className="hover:text-destructive">
                                        <X className="h-3 w-3" />
                                    </button>
                                </Badge>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {batchTotals.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {batchTotals.map((item, index) => (
                        <Card key={item.batchId} className="bg-card/50 border-primary/10 overflow-hidden relative group">
                            <div 
                                className="absolute top-0 left-0 w-1 h-full" 
                                style={{ backgroundColor: BATCH_COLORS[index % BATCH_COLORS.length] }} 
                            />
                            <CardContent className="p-3">
                                <div className="flex flex-col">
                                    <span className="text-[10px] uppercase font-bold text-muted-foreground">Lote {item.batchId}</span>
                                    <div className="flex items-baseline gap-1 mt-1">
                                        <span className="text-xl font-bold text-primary">{item.duration}</span>
                                        <span className="text-[10px] text-muted-foreground font-medium">min</span>
                                    </div>
                                    <span className="text-[9px] text-muted-foreground mt-1 truncate italic">
                                        {item.realMachine}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <Card className="min-h-[600px] flex flex-col">
                <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2 font-semibold">
                        <BarChart3 className="h-5 w-5 text-primary" />
                        Comparativa de Tiempos por Paso
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 p-6">
                    {compCompareBatchIds.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-4 py-20 border-2 border-dashed rounded-xl border-muted-foreground/20">
                            <Clock className="h-12 w-12 opacity-20" />
                            <div className="text-center">
                                <p className="font-medium text-lg">No hay lotes seleccionados</p>
                                <p className="text-sm">Usa los filtros de arriba para añadir lotes a la comparación</p>
                            </div>
                        </div>
                    ) : (
                        <div className="h-[500px] w-full mt-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={comparisonStepsData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                                    <XAxis
                                        dataKey="stepName"
                                        tick={AXIS_LABEL_STYLE}
                                        interval={0}
                                        angle={-45}
                                        textAnchor="end"
                                        height={100}
                                    />
                                    <YAxis 
                                        label={{ value: 'Minutos', angle: -90, position: 'insideLeft', style: { fill: 'hsl(var(--muted-foreground))' } }} 
                                        tick={AXIS_LABEL_STYLE}
                                    />
                                    <Tooltip 
                                        content={({ active, payload, label }) => {
                                            if (active && payload && payload.length) {
                                                return (
                                                    <div className="bg-background border border-border p-3 rounded-xl shadow-xl space-y-2">
                                                        <p className="font-bold border-b pb-1 mb-1">{label}</p>
                                                        {payload.map((entry: any) => {
                                                            const batchId = entry.dataKey;
                                                            const realMachine = entry.payload[`${batchId}_realMachine`];
                                                            return (
                                                                <div key={batchId} className="flex flex-col gap-0.5">
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                                                                        <span className="font-medium">Lote {batchId}:</span>
                                                                        <span className="font-bold">{entry.value} min</span>
                                                                    </div>
                                                                    <div className="text-[10px] text-muted-foreground ml-4">
                                                                        Equipo: {realMachine}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }}
                                    />
                                    <Legend verticalAlign="top" height={36}/>
                                    {compCompareBatchIds.map((batchId, index) => (
                                        <Line
                                            key={batchId}
                                            type="monotone"
                                            dataKey={batchId}
                                            name={`Lote ${batchId}`}
                                            stroke={BATCH_COLORS[index % BATCH_COLORS.length]}
                                            strokeWidth={2}
                                            dot={{ r: 4, strokeWidth: 2 }}
                                            activeDot={{ r: 6, strokeWidth: 0 }}
                                        />
                                    ))}
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};
