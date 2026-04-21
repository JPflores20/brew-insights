import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label as UILabel } from "@/components/ui/label";
import { BatchRecord } from "@/types";
import { FileSpreadsheet, Thermometer } from "lucide-react";

import { useStepCapability } from "./step_capability/use_step_capability";
import { StepCapabilityFilters } from "./step_capability/step_capability_filters";
import { StepCapabilityChartSection } from "./step_capability/step_capability_chart_section";
import { StepCapabilityMetrics } from "./step_capability/step_capability_metrics";

interface StepCapabilityChartProps {
  data: BatchRecord[];
}

export function StepCapabilityChart({ data }: StepCapabilityChartProps) {
  const capabilityData = useStepCapability(data);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-2 shadow-md border-border bg-card/40 backdrop-blur-md">
        <CardHeader>
          <div className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  <Thermometer className="h-5 w-5 text-purple-500" />
                  Capacidad del Proceso - Temperatura por Paso
                </CardTitle>
                <CardDescription>
                  Análisis de {capabilityData.selectedParams.length > 0 ? capabilityData.selectedParams.join(', ') : 'variable(s)'} en paso(s): {capabilityData.selectedSteps.length > 0 ? capabilityData.selectedSteps.join(', ') : '...'}
                </CardDescription>
              </div>
              
              <div className="flex items-center gap-3 bg-secondary/40 p-2 rounded-lg border border-border">
                <div className="flex flex-col">
                  <UILabel htmlFor="step-lei" className="text-[10px] uppercase font-bold text-muted-foreground mb-1">LEI</UILabel>
                  <Input
                    id="step-lei"
                    type="number"
                    value={capabilityData.lei}
                    onChange={(e) => capabilityData.handleLeiChange(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    onFocus={(e) => e.target.select()}
                    className="h-8 w-20 text-xs font-mono"
                  />
                </div>
                <div className="flex flex-col">
                  <UILabel htmlFor="step-les" className="text-[10px] uppercase font-bold text-muted-foreground mb-1">LES</UILabel>
                  <Input
                    id="step-les"
                    type="number"
                    value={capabilityData.les}
                    onChange={(e) => capabilityData.handleLesChange(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    onFocus={(e) => e.target.select()}
                    className="h-8 w-20 text-xs font-mono"
                  />
                </div>
              </div>
            </div>

            <StepCapabilityFilters
               dateRange={capabilityData.dateRange}
               setDateRange={capabilityData.setDateRange}
               minDataDate={capabilityData.minDataDate}
               maxDataDate={capabilityData.maxDataDate}
               selectedRecipe={capabilityData.selectedRecipe}
               setSelectedRecipe={capabilityData.setSelectedRecipe}
               uniqueRecipes={capabilityData.uniqueRecipes}
               selectedMachines={capabilityData.selectedMachines}
               setSelectedMachines={capabilityData.setSelectedMachines}
               uniqueMachines={capabilityData.uniqueMachines}
               selectedSteps={capabilityData.selectedSteps}
               setSelectedSteps={capabilityData.setSelectedSteps}
               uniqueSteps={capabilityData.uniqueSteps}
               selectedParams={capabilityData.selectedParams}
               setSelectedParams={capabilityData.setSelectedParams}
               uniqueParams={capabilityData.uniqueParams}
               analysisValuesLength={capabilityData.analysisValues.length}
            />
          </div>
        </CardHeader>

        <CardContent>
          <StepCapabilityChartSection
             selectedMachinesLength={capabilityData.selectedMachines.length}
             analysisValuesLength={capabilityData.analysisValues.length}
             stats={capabilityData.stats}
             chartData={capabilityData.chartData}
             lei={capabilityData.lei}
             les={capabilityData.les}
          />
        </CardContent>
      </Card>

      <Card className="shadow-md border-border bg-card/40 backdrop-blur-md h-full">
        <CardHeader>
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-accent" />
            Performance {capabilityData.selectedParams.length > 0 ? capabilityData.selectedParams.join(', ') : ''}
          </CardTitle>
          <CardDescription>Métricas de capacidad del paso</CardDescription>
        </CardHeader>
        <CardContent>
          <StepCapabilityMetrics 
             stats={capabilityData.stats}
             machineStats={capabilityData.machineStats}
             selectedMachines={capabilityData.selectedMachines}
             lei={capabilityData.lei}
             les={capabilityData.les}
          />
        </CardContent>
      </Card>
    </div>
  );
}
