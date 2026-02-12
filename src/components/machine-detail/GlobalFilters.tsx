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

interface GlobalFiltersProps {
    selectedRecipe: string;
    setSelectedRecipe: (value: string) => void;
    uniqueRecipes: string[];
    selectedBatchId: string;
    setSelectedBatchId: (value: string) => void;
    filteredBatches: string[];
    batchProductMap: Map<string, string>;
}

export function GlobalFilters({
    selectedRecipe,
    setSelectedRecipe,
    uniqueRecipes,
    selectedBatchId,
    setSelectedBatchId,
    filteredBatches,
    batchProductMap,
}: GlobalFiltersProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 1. SELECCIONAR RECETA */}
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
                    <Select value={selectedRecipe} onValueChange={setSelectedRecipe}>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Todas" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">Todas las recetas</SelectItem>
                            {uniqueRecipes.map((r) => (
                                <SelectItem key={r} value={r}>
                                    {r}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </CardContent>
            </Card>

            {/* 2. SELECCIONAR LOTE */}
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
                    <Select value={selectedBatchId} onValueChange={setSelectedBatchId}>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Buscar lote..." />
                        </SelectTrigger>
                        <SelectContent>
                            {filteredBatches.map((batch) => (
                                <SelectItem key={batch} value={batch}>
                                    {batch} - {batchProductMap.get(batch) || "Sin producto"}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </CardContent>
            </Card>
        </div>
    );
}
