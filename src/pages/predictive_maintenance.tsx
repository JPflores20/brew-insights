import { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/dashboard_layout";
import { AnimatedPage } from "@/components/layout/animated_page";
import { useData } from "@/context/data_context";
import { useFileUpload } from "@/hooks/use_file_upload";
import { EmptyStateUploader } from "@/components/dashboard/empty_state_uploader";
import { LoadingState } from "@/components/ui/loading_state";
import { BetaPageBanner } from "@/components/ui/beta_page_banner";
import { MetricCard } from "@/components/ui/metric_card";
import { Wrench, ShieldAlert, TrendingUp, Clock } from "lucide-react";
import { DegradationAlerts } from "@/components/dashboard/degradation_alerts";
import { DegradationTrendChart } from "@/components/dashboard/degradation_trend_chart";
import { calculateDegradationAlerts } from "@/utils/math_utils";

export default function PredictiveMaintenance() {
  const { data } = useData();
  const { loading, uploadProgress, processFiles } = useFileUpload();
  const [selectedMachine, setSelectedMachine] = useState<string>("");
  const [selectedStep, setSelectedStep] = useState<string>("");
  
  const alerts = useMemo(() => calculateDegradationAlerts(data), [data]);
  
  const maxPercent = alerts.length > 0 ? Math.max(...alerts.map(a => a.percentIncrease)) : 0;
  const totalLostTime = alerts.reduce((sum, a) => {
    const historicalAvg = a.recentAvg / (1 + a.percentIncrease / 100);
    return sum + (a.recentAvg - historicalAvg);
  }, 0);

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
        <BetaPageBanner />
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight">Mantenimiento Predictivo</h1>
            <p className="text-muted-foreground mt-1">Monitoreo de degradación de equipos mediante análisis de tendencia en tiempos reales (IW).</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 pt-4">
            <MetricCard 
                title="Equipos en Riesgo" 
                value={alerts.length} 
                subtitle="Alertas activas actuales" 
                icon={Wrench} 
                color={alerts.length > 3 ? "destructive" : alerts.length > 0 ? "warning" : "success"} 
            />
            <MetricCard 
                title="Pico de Degradación" 
                value={`+${maxPercent.toFixed(1)}%`} 
                subtitle="Máx detecado vs base" 
                icon={TrendingUp} 
                color={maxPercent > 15 ? "destructive" : "warning"} 
            />
            <MetricCard 
                title="Impacto Cíclico" 
                value={`+${totalLostTime.toFixed(1)} min`} 
                subtitle="T. perdido global / lote" 
                icon={Clock} 
                color="info" 
            />
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
