import { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/dashboard_layout";
import { useData } from "@/context/data_context";
import { EmptyStateUploader } from "@/components/dashboard/empty_state_uploader";
import { LoadingState } from "@/components/ui/loading_state";
import { useFileUpload } from "@/hooks/use_file_upload";
import { AnimatedPage } from "@/components/layout/animated_page";
import { BookOpen, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MetricCard } from "@/components/ui/metric_card";
import { RecipeWasteTrafficLight } from "@/components/dashboard/recipe_waste_traffic_light";
import { RecipeDeviationChart } from "@/components/dashboard/recipe_deviation_chart";
import { FILTER_ALL } from "@/lib/constants";

export default function RecipeAnalysis() {
  const { data } = useData();
  const { loading, uploadProgress, processFiles } = useFileUpload();
  const [selectedRecipe, setSelectedRecipe] = useState<string | FILTER_ALL>(FILTER_ALL);
  const [selectedMaterialName, setSelectedMaterialName] = useState<string>(FILTER_ALL);
  const handleSelectRecipe = (recipe: string | FILTER_ALL) => {
      setSelectedRecipe(recipe);
      setSelectedMaterialName(FILTER_ALL); 
  };
  const recipeNames = useMemo(() => {
    const names = new Set<string>();
    data.forEach(d => {
        if (d.productName) names.add(d.productName);
    });
    return Array.from(names).sort();
  }, [data]);
  const totalWasteStats = useMemo(() => {
      let totalReal = 0;
      let totalExpected = 0;
      data.forEach(batch => {
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
  }, [data]);
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
        {}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight">Análisis de Desviación de Recetas</h1>
            <p className="text-muted-foreground mt-1">Comparación de uso de materia prima: Esperado (SW) vs Real (IW).</p>
          </div>
        </div>
        {}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <MetricCard 
                title="Desviación Global de Materiales" 
                value={`${totalWasteStats.delta > 0 ? "+" : ""}${totalWasteStats.percent.toFixed(2)}%`}
                subtitle={`Desviado vs Esperado (Todas las recetas)`}
                icon={AlertTriangle} 
                delay={0.1} 
                trend={totalWasteStats.percent > 2 ? "down" : "up"}
                trendValue={totalWasteStats.percent > 2 ? "Desperdicio Alto" : "En Rango"}
                className={totalWasteStats.percent > 2 ? "border-l-4 border-l-red-500" : "border-l-4 border-l-green-500"} 
            />
            <MetricCard 
                title="Recetas Monitoreadas" 
                value={recipeNames.length} 
                subtitle="Diferentes productos detectados" 
                icon={BookOpen} 
                delay={0.2} 
                className="border-l-4 border-l-blue-500" 
            />
        </div>
        {}
        <div className="mb-8">
            <RecipeWasteTrafficLight data={data} onSelectRecipe={handleSelectRecipe} selectedRecipe={selectedRecipe} />
        </div>
        {}
        <div className="mb-8">
            <RecipeDeviationChart 
              data={data} 
              recipeNames={recipeNames} 
              selectedRecipe={selectedRecipe} 
              setSelectedRecipe={handleSelectRecipe} 
              selectedMaterialName={selectedMaterialName}
              setSelectedMaterialName={setSelectedMaterialName}
            />
        </div>
      </AnimatedPage>
    </DashboardLayout>
  );
}
