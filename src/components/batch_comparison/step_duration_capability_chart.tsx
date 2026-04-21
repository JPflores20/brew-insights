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
import { Clock, FileSpreadsheet } from "lucide-react";

import { useStepDurationCapability } from "./step_duration/use_step_duration_capability";
import { StepDurationFilters } from "./step_duration/step_duration_filters";
import { StepDurationChartSection } from "./step_duration/step_duration_chart_section";
import { StepDurationMetrics } from "./step_duration/step_duration_metrics";

interface StepDurationCapabilityChartProps {
  data: BatchRecord[];
}

export function StepDurationCapabilityChart({ data }: StepDurationCapabilityChartProps) {
  const capabilityData = useStepDurationCapability(data);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-2 shadow-md border-border bg-card/40 backdrop-blur-md">
        <CardHeader>
          <div className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-500" />
                  Capacidad del Proceso - Duración de Pasos
                </CardTitle>
                <CardDescription>
                  Análisis de tiempos en paso(s): {capabilityData.selectedSteps.length > 0 ? capabilityData.selectedSteps.join(', ') : '...'}
                </CardDescription>
              </div>
              
              <div className="flex items-center gap-3 bg-secondary/40 p-2 rounded-lg border border-border">
                <div className="flex flex-col">
                  <UILabel htmlFor="dur-lei" className="text-[10px] uppercase font-bold text-muted-foreground mb-1">LEI (min)</UILabel>
                  <Input
                    id="dur-lei"
                    type="number"
                    value={capabilityData.lei}
                    onChange={(e) => capabilityData.handleLeiChange(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    onFocus={(e) => e.target.select()}
                    className="h-8 w-20 text-xs font-mono"
                  />
                </div>
                <div className="flex flex-col">
                  <UILabel htmlFor="dur-les" className="text-[10px] uppercase font-bold text-muted-foreground mb-1">LES (min)</UILabel>
                  <Input
                    id="dur-les"
                    type="number"
                    value={capabilityData.les}
                    onChange={(e) => capabilityData.handleLesChange(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    onFocus={(e) => e.target.select()}
                    className="h-8 w-20 text-xs font-mono"
                  />
                </div>
              </div>
            </div>

            <StepDurationFilters
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
               analysisValuesLength={capabilityData.analysisValues.length}
            />
          </div>
        </CardHeader>

        <CardContent>
          <StepDurationChartSection
             selectedMachinesLength={capabilityData.selectedMachines.length}
             analysisValuesLength={capabilityData.analysisValues.length}
             stats={capabilityData.stats}
             chartData={capabilityData.chartData}
          />
        </CardContent>
      </Card>

      <Card className="shadow-md border-border bg-card/40 backdrop-blur-md h-full">
        <CardHeader>
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-accent" />
            Performance Duración
          </CardTitle>
          <CardDescription>Métricas de capacidad del paso</CardDescription>
        </CardHeader>
        <CardContent>
          <StepDurationMetrics 
             stats={capabilityData.stats}
             machineStats={capabilityData.machineStats}
             selectedMachines={capabilityData.selectedMachines}
          />
        </CardContent>
      </Card>
    </div>
  );
}
