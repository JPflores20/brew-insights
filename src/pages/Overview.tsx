import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { KPICard } from "@/components/dashboard/KPICard";
import { EfficiencyChart } from "@/components/dashboard/EfficiencyChart";
import { AlertsWidget } from "@/components/dashboard/AlertsWidget";
import { Boxes, TrendingUp, Clock, Upload, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { processExcelFile } from "@/utils/excelProcessor";
import { useData } from "@/context/DataContext"; // <-- Usar contexto
import { 
  getTotalBatches, 
  getAverageCycleDeviation, 
  getMachineWithHighestIdleTime
} from "@/data/mockData";

export default function Overview() {
  const { data, setData } = useData(); // <-- Usamos el contexto global
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const processedData = await processExcelFile(file);
      setData(processedData); // Guardamos en global
      toast({
        title: "Datos cargados correctamente",
        description: `Se procesaron ${processedData.length} registros.`,
      });
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Error al procesar",
        description: "El archivo no es válido.",
      });
    } finally {
      setLoading(false);
    }
  };

  if (data.length === 0) {
    return (
      <DashboardLayout>
        <div className="flex h-[70vh] flex-col items-center justify-center space-y-6 text-center animate-in fade-in zoom-in duration-500">
          <div className="rounded-full bg-primary/10 p-6">
            <FileSpreadsheet className="h-16 w-16 text-primary" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Cargar Datos de Producción</h1>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Sube tu archivo Excel original. El sistema procesará tiempos y eficiencias.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Button size="lg" className="relative cursor-pointer" disabled={loading}>
              {loading ? "Procesando..." : (
                <>
                  <Upload className="mr-2 h-5 w-5" />
                  Seleccionar Archivo Excel
                </>
              )}
              <input type="file" accept=".xlsx, .xls" className="absolute inset-0 cursor-pointer opacity-0" onChange={handleFileUpload} disabled={loading} />
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const totalBatches = getTotalBatches(data);
  const avgDeviation = getAverageCycleDeviation(data);
  const highestIdle = getMachineWithHighestIdleTime(data);

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tablero General</h1>
          <p className="text-muted-foreground">Monitor de eficiencia</p>
        </div>
        <Button variant="outline" onClick={() => setData([])}>Cargar otro archivo</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <KPICard title="Total Lotes" value={totalBatches} subtitle="Cargados" icon={Boxes} variant="success" />
        <KPICard title="Desviación Promedio" value={`${avgDeviation > 0 ? '+' : ''}${avgDeviation}%`} subtitle="Vs Esperado" icon={TrendingUp} variant={avgDeviation > 10 ? "danger" : "success"} />
        <KPICard title="Mayor Tiempo Muerto" value={`${highestIdle.idleTime} min`} subtitle={`Equipo: ${highestIdle.machine}`} icon={Clock} variant="warning" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2"><EfficiencyChart data={data} /></div>
        <div className="lg:col-span-1"><AlertsWidget data={data} /></div>
      </div>
    </DashboardLayout>
  );
}