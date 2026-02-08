import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { KPICard } from "@/components/dashboard/KPICard";
import { EfficiencyChart } from "@/components/dashboard/EfficiencyChart";
import { AlertsWidget } from "@/components/dashboard/AlertsWidget";
import { Boxes, TrendingUp, Clock, Upload, FileSpreadsheet, Beer } from "lucide-react"; // <--- Agregamos Beer
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { processExcelFile } from "@/utils/excelProcessor";
import { useData } from "@/context/DataContext"; 
import { 
  getTotalBatches, 
  getAverageCycleDeviation, 
  getMachineWithHighestIdleTime
} from "@/data/mockData";
import { cn } from "@/lib/utils";

export default function Overview() {
  const { data, setData } = useData(); 
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const { toast } = useToast();

  const processFile = async (file: File) => {
    setLoading(true);
    try {
      // Pequeño delay artificial para que se aprecie la animación (opcional)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const processedData = await processExcelFile(file);
      setData(processedData); 
      toast({
        title: "¡Cocimiento completado!",
        description: `Se procesaron ${processedData.length} registros exitosamente.`,
      });
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Error en la mezcla",
        description: "El archivo no es válido o no tiene el formato esperado.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await processFile(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!loading) setIsDragging(true); // Bloquear drag si está cargando
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (loading) return; 
    
    const file = e.dataTransfer.files?.[0];
    if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
      await processFile(file);
    } else {
      toast({
        variant: "destructive",
        title: "Ingrediente incorrecto",
        description: "Por favor arrastra un archivo Excel (.xlsx o .xls).",
      });
    }
  };

  if (data.length === 0) {
    return (
      <DashboardLayout>
        <div 
          className={cn(
            "flex h-[70vh] flex-col items-center justify-center space-y-6 text-center animate-in fade-in zoom-in duration-500 rounded-xl border-2 border-dashed transition-all",
            isDragging ? "border-primary bg-primary/5 scale-[1.02]" : "border-border",
            loading ? "border-none bg-transparent" : "" // Quitar bordes al cargar
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {loading ? (
            /* --- ANIMACIÓN DE CERVEZA --- */
            <div className="flex flex-col items-center justify-center space-y-6 animate-in fade-in duration-700">
              <div className="relative">
                {/* Fondo o brillo */}
                <div className="absolute inset-0 bg-yellow-500/20 blur-xl rounded-full animate-pulse" />
                {/* Icono animado */}
                <Beer className="h-24 w-24 text-yellow-500 animate-bounce relative z-10" strokeWidth={1.5} />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-foreground animate-pulse">Fermentando datos...</h2>
                <p className="text-muted-foreground">Procesando los tiempos de tus lotes</p>
              </div>
            </div>
          ) : (
            /* --- ESTADO NORMAL (DRAG & DROP) --- */
            <>
              <div className={cn(
                "rounded-full p-6 transition-transform duration-300",
                isDragging ? "bg-primary/20 scale-110" : "bg-primary/10"
              )}>
                <FileSpreadsheet className="h-16 w-16 text-primary" />
              </div>
              
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Cargar Datos de Producción</h1>
                <p className="text-muted-foreground max-w-lg mx-auto">
                  {isDragging ? "¡Suelta el archivo para comenzar!" : "Arrastra tu archivo Excel aquí o haz clic para seleccionarlo."}
                </p>
              </div>
              
              <div className="flex flex-col items-center gap-4">
                <Button size="lg" className="relative cursor-pointer hover:scale-105 transition-transform shadow-lg">
                  <Upload className="mr-2 h-5 w-5" />
                  Seleccionar Archivo Excel
                  <input 
                    type="file" 
                    accept=".xlsx, .xls" 
                    className="absolute inset-0 cursor-pointer opacity-0" 
                    onChange={handleFileUpload} 
                  />
                </Button>
                {!isDragging && (
                    <p className="text-xs text-muted-foreground">Soporta archivos .xlsx y .xls</p>
                )}
              </div>
            </>
          )}
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