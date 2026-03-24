export interface SeriesConfig {
    id: string;
    recipe: string;
    machine: string;
    batch: string;
    color: string;
    availableRecipes: string[];
    availableMachines: string[];
    availableBatches: string[];
    setRecipe: (val: string) => void;
    setMachine: (val: string) => void;
    setBatch: (val: string) => void;
    onRemove?: () => void;
}


