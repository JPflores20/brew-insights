export interface SeriesConfig {
    id: string;
    recipe: string;
    machine: string;
    batch: string;
    color: string;
    parameter: string;
    step: string;
    availableRecipes: string[];
    availableMachines: string[];
    availableBatches: string[];
    availableParameters: string[];
    availableSteps: string[];
    setRecipe: (val: string) => void;
    setMachine: (val: string) => void;
    setBatch: (val: string) => void;
    setStep: (val: string) => void;
    setParameter: (val: string) => void;
    onRemove?: () => void;
}
