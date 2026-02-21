import { useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard_layout";
import { AnimatedPage } from "@/components/layout/animated_page";
import { useData } from "@/context/data_context";
import { useFileUpload } from "@/hooks/use_file_upload";
import { EmptyStateUploader } from "@/components/dashboard/empty_state_uploader";
import { LoadingState } from "@/components/ui/loading_state";
import { QualityControlChart } from "@/components/dashboard/quality_control_chart";
export default function QualityConsistency() {
  const { data } = useData();
  const { loading, uploadProgress, processFiles } = useFileUpload();
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
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight">Consistencia de Calidad</h1>
            <p className="text-muted-foreground mt-1">Análisis Six Sigma de parámetros físicos (DFM) y control de proceso por lote y receta.</p>
          </div>
        </div>
        <div className="mb-8">
            <QualityControlChart data={data} />
        </div>
      </AnimatedPage>
    </DashboardLayout>
  );
}
