import { useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard_layout";
import { AnimatedPage } from "@/components/layout/animated_page";
import { useData } from "@/context/data_context";
import { useFileUpload } from "@/hooks/use_file_upload";
import { EmptyStateUploader } from "@/components/dashboard/empty_state_uploader";
import { LoadingState } from "@/components/ui/loading_state";
import { MetricCard } from "@/components/ui/metric_card";
import { Wrench, ShieldAlert } from "lucide-react";
import { DegradationAlerts } from "@/components/dashboard/degradation_alerts";
import { DegradationTrendChart } from "@/components/dashboard/degradation_trend_chart";
export default function PredictiveMaintenance() {
  const { data } = useData();
  const { loading, uploadProgress, processFiles } = useFileUpload();
  const [selectedMachine, setSelectedMachine] = useState<string>("");
  const [selectedStep, setSelectedStep] = useState<string>("");
  const handleSelectAlert = (machine: string, stepName: string) => {
      setSelectedMachine(machine);
      setSelectedStep(stepName);
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
