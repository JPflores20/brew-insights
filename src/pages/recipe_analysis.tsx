import { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/dashboard_layout";
import { useData } from "@/context/data_context";
import { EmptyStateUploader } from "@/components/dashboard/empty_state_uploader";
import { LoadingState } from "@/components/ui/loading_state";
import { BetaPageBanner } from "@/components/ui/beta_page_banner";
import { motion } from "framer-motion";
import { useFileUpload } from "@/hooks/use_file_upload";
import { AnimatedPage } from "@/components/layout/animated_page";
import { BookOpen, AlertTriangle, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MetricCard } from "@/components/ui/metric_card";
import { RecipeWasteTrafficLight } from "@/components/dashboard/recipe_waste_traffic_light";
import { RecipeDeviationChart } from "@/components/dashboard/recipe_deviation_chart";
import { FILTER_ALL } from "@/lib/constants";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function RecipeAnalysis() {
  const { data } = useData();
  const { loading, uploadProgress, processFiles } = useFileUpload();
  
  const [selectedRecipe, setSelectedRecipe] = useState<string | typeof FILTER_ALL>(FILTER_ALL);
  const [selectedMaterialNames, setSelectedMaterialNames] = useState<string[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<string | typeof FILTER_ALL>(FILTER_ALL);

  const handleSelectRecipe = (recipe: string | typeof FILTER_ALL) => {
      setSelectedRecipe(recipe);
      setSelectedMaterialNames([]); 
      setSelectedBatch(FILTER_ALL);
  };

  const recipeNames = useMemo(() => {
    const names = new Set<string>();
    data.forEach(d => {
        if (d.productName) names.add(d.productName);
    });
    return Array.from(names).sort();
  }, [data]);

  const availableBatches = useMemo(() => {
    let baseData = data;
    if (selectedRecipe !== FILTER_ALL) {
      baseData = data.filter(d => d.productName === selectedRecipe);
    }
    
    const batchMap = new Map<string, string>();
    baseData.forEach(d => {
      if (d.CHARG_NR && !batchMap.has(d.CHARG_NR)) {
        batchMap.set(d.CHARG_NR, d.productName || "Desconocido");
      }
    });
    
    return Array.from(batchMap.entries())
      .map(([batch, productName]) => ({ batch, productName }))
      .sort((a, b) => a.batch.localeCompare(b.batch));
  }, [data, selectedRecipe]);

  const filteredData = useMemo(() => {
    if (selectedBatch === FILTER_ALL) return data;
    return data.filter(d => d.CHARG_NR === selectedBatch);
  }, [data, selectedBatch]);

  const totalWasteStats = useMemo(() => {
      let totalReal = 0;
      let totalExpected = 0;
      filteredData.forEach(batch => {
          batch.materials.forEach(mat => {
              totalReal += mat.totalReal;
              totalExpected += mat.totalExpected;
          });
      });
      const delta = totalReal - totalExpected;
      const percent = totalExpected > 0 ? (delta / totalExpected) * 100 : 0;
      return {
          totalReal,
          totalExpected,
          delta,
          percent
      };
  }, [filteredData]);

  if (data.length === 0) {
    return (
      <DashboardLayout>
        <EmptyStateUploader loading={loading} uploadProgress={uploadProgress} onFilesSelected={processFiles} />
      </DashboardLayout>
    );
  }

  if (loading) {
    return (
      <DashboardLayout>
        <LoadingState message="Procesando archivos..." />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <AnimatedPage>
        <BetaPageBanner />
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight">Análisis de Desviación de Recetas</h1>
            <p className="text-muted-foreground mt-1">Comparación de uso de materia prima: Setpoint (SW) vs Real (IW).</p>
          </div>
          
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-muted-foreground" />
            <div className="w-[300px]">
              <Select value={selectedBatch} onValueChange={setSelectedBatch}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar Lote (Cocto)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={FILTER_ALL}>Todos los Lotes</SelectItem>
                  {availableBatches.map(({ batch, productName }) => (
                    <SelectItem key={batch} value={batch}>
                      {batch} {productName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <MetricCard 
                title="Desviación Global de Materiales" 
                value={`${totalWasteStats.delta > 0 ? "+" : ""}${totalWasteStats.percent.toFixed(2)}%`}
                subtitle={`Desviado vs Setpoint ${selectedBatch !== FILTER_ALL ? '(Lote Filtrado)' : '(Todas las recetas)'}`}
                icon={AlertTriangle} 
                delay={0.1} 
                trend={totalWasteStats.percent > 2 ? "down" : "up"}
                trendValue={totalWasteStats.percent > 2 ? "Desperdicio Alto" : "En Rango"}
                className={totalWasteStats.percent > 2 ? "border-l-4 border-l-red-500" : "border-l-4 border-l-green-500"} 
            />
            <MetricCard 
                title={selectedBatch !== FILTER_ALL ? "Lote Analizado" : "Recetas Monitoreadas"} 
                value={selectedBatch !== FILTER_ALL ? selectedBatch : recipeNames.length} 
                subtitle={selectedBatch !== FILTER_ALL ? "Cocto específico" : "Diferentes productos detectados"} 
                icon={BookOpen} 
                delay={0.2} 
                className="border-l-4 border-l-blue-500" 
            />
        </div>

        <div className="mb-8">
            <RecipeWasteTrafficLight 
              data={filteredData} 
              onSelectRecipe={handleSelectRecipe} 
              selectedRecipe={selectedRecipe} 
            />
        </div>

        <div className="mb-8">
            <RecipeDeviationChart 
              data={filteredData} 
              recipeNames={recipeNames} 
              selectedRecipe={selectedRecipe} 
              setSelectedRecipe={handleSelectRecipe} 
              selectedMaterialNames={selectedMaterialNames}
              setSelectedMaterialNames={setSelectedMaterialNames}
            />
        </div>
      </AnimatedPage>
    </DashboardLayout>
  );
}