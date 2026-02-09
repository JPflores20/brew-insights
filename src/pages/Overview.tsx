import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { KPICard } from "@/components/dashboard/KPICard";
import { EfficiencyChart } from "@/components/dashboard/EfficiencyChart";
import { AlertsWidget } from "@/components/dashboard/AlertsWidget";
import { 
  Boxes, 
  TrendingUp, 
  Clock, 
  Upload, 
  FileSpreadsheet, 
  Beer, 
  Info, 
  AlertTriangle 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"; // Importamos componentes de Card
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
      // Pequeño delay para apreciar la animación
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
    if (!loading) setIsDragging(true);
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
            loading ? "border-none bg-transparent" : ""
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {loading ? (
            <div className="flex flex-col items-center justify-center space-y-6 animate-in fade-in duration-700">
              <div className="relative">
                <div className="absolute inset-0 bg-yellow-500/20 blur-xl rounded-full animate-pulse" />
                <Beer className="h-24 w-24 text-yellow-500 animate-bounce relative z-10" strokeWidth={1.5} />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-foreground animate-pulse">Fermentando datos...</h2>
                <p className="text-muted-foreground">Procesando los tiempos de tus lotes</p>
              </div>
            </div>
          ) : (
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
          <p className="text-muted-foreground">Monitor de eficiencia y métricas clave</p>
        </div>
        <Button variant="outline" onClick={() => setData([])}>Cargar otro archivo</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <KPICard title="Total Lotes" value={totalBatches} subtitle="Cargados" icon={Boxes} variant="success" />
        <KPICard title="Desviación Promedio" value={`${avgDeviation > 0 ? '+' : ''}${avgDeviation}%`} subtitle="Vs Esperado" icon={TrendingUp} variant={avgDeviation > 10 ? "danger" : "success"} />
        <KPICard title="Mayor Tiempo Muerto" value={`${highestIdle.idleTime} min`} subtitle={`Equipo: ${highestIdle.machine}`} icon={Clock} variant="warning" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2"><EfficiencyChart data={data} /></div>
        <div className="lg:col-span-1"><AlertsWidget data={data} /></div>
      </div>

      {/* --- NUEVA SECCIÓN: GLOSARIO DE INDICADORES --- */}
      <Card className="bg-card border-border shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-full">
              <Info className="h-4 w-4 text-primary" />
            </div>
            <CardTitle className="text-lg">Glosario de Indicadores</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          
          {/* Definición de RETRASO */}
          <div className="flex gap-4 p-4 rounded-lg bg-secondary/30 border border-border/50 hover:bg-secondary/50 transition-colors">
            <div className="mt-1">
              <div className="p-2 rounded-full bg-chart-delay/10">
                <Clock className="h-5 w-5 text-chart-delay" />
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                Retraso (Delay)
                <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-chart-delay/10 text-chart-delay">Ineficiencia Interna</span>
              </h3>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                Mide la lentitud <strong>dentro</strong> de los pasos del proceso. Ocurre cuando la máquina tarda más de lo estipulado en la receta.
              </p>
              <p className="text-xs text-muted-foreground mt-2 font-mono bg-background/50 inline-block px-2 py-1 rounded border border-border">
                Cálculo: Tiempo Real - Tiempo Esperado
              </p>
            </div>
          </div>

          {/* Definición de TIEMPO MUERTO */}
          <div className="flex gap-4 p-4 rounded-lg bg-secondary/30 border border-border/50 hover:bg-secondary/50 transition-colors">
            <div className="mt-1">
              <div className="p-2 rounded-full bg-orange-500/10">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                Tiempo Muerto (Idle Time)
                <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-500">Ineficiencia Externa</span>
              </h3>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                Mide la ineficiencia <strong>entre</strong> pasos. Es la suma de los "huecos" (gaps) donde la máquina estuvo detenida esperando entre el fin de un paso y el inicio del siguiente.
              </p>
              <p className="text-xs text-muted-foreground mt-2 font-mono bg-background/50 inline-block px-2 py-1 rounded border border-border">
                Cálculo: Suma de Gaps (Inicio<sub>n</sub> - Fin<sub>n-1</sub>)
              </p>
            </div>
          </div>

        </CardContent>
      </Card>
    </DashboardLayout>
  );
}