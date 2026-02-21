import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AnimatedPage } from "@/components/layout/AnimatedPage";
import { useData } from "@/context/DataContext";
import { useFileUpload } from "@/hooks/useFileUpload";
import { EmptyStateUploader } from "@/components/dashboard/EmptyStateUploader";
import { LoadingState } from "@/components/ui/LoadingState";
import { MetricCard } from "@/components/ui/MetricCard";
import { Wrench, ShieldAlert } from "lucide-react";
import { DegradationAlerts } from "@/components/dashboard/DegradationAlerts";
import { DegradationTrendChart } from "@/components/dashboard/DegradationTrendChart";

export default function PredictiveMaintenance() {
  const { data } = useData();
  const { loading, uploadProgress, processFiles } = useFileUpload();

  // State to sync the selected alert card with the chart below it
  const [selectedMachine, setSelectedMachine] = useState<string>("");
  const [selectedStep, setSelectedStep] = useState<string>("");

  const handleSelectAlert = (machine: string, stepName: string) => {
      setSelectedMachine(machine);
      setSelectedStep(stepName);
      
      // Optionally scroll to the chart when an alert is clicked
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  };

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
        <LoadingState message="Procesando archivos y calculando tendencias..." />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <AnimatedPage>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight">Mantenimiento Predictivo</h1>
            <p className="text-muted-foreground mt-1">Monitoreo de degradación de equipos mediante análisis de tendencia en tiempos reales (IW).</p>
          </div>
        </div>

        <div className="mb-8">
            <DegradationAlerts data={data} onSelectAlert={handleSelectAlert} />
        </div>

        <div className="mb-8">
            <DegradationTrendChart 
               data={data} 
               selectedMachine={selectedMachine}
               setSelectedMachine={setSelectedMachine}
               selectedStep={selectedStep}
               setSelectedStep={setSelectedStep}
            />
        </div>

      </AnimatedPage>
    </DashboardLayout>
  );
}
