import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AnimatedPage } from "@/components/layout/AnimatedPage";
import { useData } from "@/context/DataContext";
import { useFileUpload } from "@/hooks/useFileUpload";
import { EmptyStateUploader } from "@/components/dashboard/EmptyStateUploader";
import { LoadingState } from "@/components/ui/LoadingState";
import { QualityControlChart } from "@/components/dashboard/QualityControlChart";

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
