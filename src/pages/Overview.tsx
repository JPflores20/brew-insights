import { useState, useEffect, useRef } from "react";
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
  Beer, // Mantenemos el icono para el texto final
  Info, 
  AlertTriangle 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { processExcelFile } from "@/utils/excelProcessor";
import { useData } from "@/context/DataContext"; 
import { 
  getTotalBatches, 
  getAverageCycleDeviation, 
  getMachineWithHighestIdleTime
} from "@/data/mockData";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

export default function Overview() {
  const { data, setData } = useData(); 
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  // 1. Nuevo estado para controlar el porcentaje de llenado (0-100)
  const [uploadProgress, setUploadProgress] = useState(0);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const { toast } = useToast();
  const navigate = useNavigate();

  // Función para limpiar el intervalo del simulador
  const clearProgressInterval = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  };

  const processFile = async (file: File) => {
    setLoading(true);
    setUploadProgress(0);

    // 2. Iniciar simulación de progreso
    // Incrementa rápidamente al principio, luego más lento hasta el 90%
    progressIntervalRef.current = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) {
          // Si llega al 90% y aún no termina el proceso real, se queda ahí "esperando"
          return 90 + Math.random() * 2; // Pequeña variación para que parezca vivo
        }
        // Incremento rápido inicial
        const increment = Math.random() * 15;
        return Math.min(prev + increment, 90);
      });
    }, 300);

    try {
      // El procesamiento real (puede tardar unos segundos)
      const processedData = await processExcelFile(file);
      
      // 3. Proceso terminado: Llenar al 100%
      clearProgressInterval();
      setUploadProgress(100);

      // Pequeña pausa visual para disfrutar la cerveza llena antes de mostrar el dashboard
      await new Promise(resolve => setTimeout(resolve, 800));

      setData(processedData); 
      toast({
        title: "¡Tanque lleno!",
        description: `Se han procesado ${processedData.length} registros correctamente.`,
        // Usamos un color dorado para el toast de éxito
        className: "bg-amber-500 text-white border-none",
      });
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Error en la mezcla",
        description: "El archivo no es válido o no tiene el formato esperado.",
      });
    } finally {
      clearProgressInterval();
      setLoading(false);
      setUploadProgress(0);
    }
  };

  // Limpieza al desmontar el componente por si acaso
  useEffect(() => {
    return () => clearProgressInterval();
  }, []);

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
        title: "Archivo incorrecto",
        description: "Por favor arrastra un archivo Excel (.xlsx o .xls).",
      });
    }
  };

  const highestIdle = getMachineWithHighestIdleTime(data);
  const handleNavigateToDetail = () => {
    if (highestIdle.machine !== "N/A") {
      window.localStorage.setItem("detail-machine-selection-v2", JSON.stringify(highestIdle.machine));
      navigate("/machine");
    }
  };

  if (data.length === 0) {
    return (
      <DashboardLayout>
        {/* Contenedor principal de la zona de carga */}
        <div 
          className={cn(
            "relative flex h-[70vh] flex-col items-center justify-center space-y-6 text-center rounded-xl transition-all overflow-hidden",
            // Si está cargando, quitamos bordes y fondo para que se vea la animación completa
            loading ? "" : "border-2 border-dashed",
            !loading && isDragging ? "border-amber-500 bg-amber-500/5 scale-[1.02]" : "border-border",
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {loading ? (
            /* --- 4. NUEVA ANIMACIÓN DE CERVEZA LLENANDO LA PANTALLA --- */
            <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-background/90 backdrop-blur-sm">
               
               {/* Contenedor del Líquido y Espuma (ocupa todo el espacio disponible) */}
               <div className="absolute inset-x-0 bottom-0 h-full w-full overflow-hidden rounded-xl">
                 
                 {/* CAPA DE LÍQUIDO (Cerveza Ámbar) */}
                 <div 
                   className="absolute bottom-0 w-full bg-gradient-to-t from-amber-600 via-amber-500 to-amber-400 transition-all duration-300 ease-out"
                   // Usamos estilo en línea para controlar la altura dinámicamente
                   style={{ height: `${uploadProgress}%` }}
                 >
                    {/* Burbujas decorativas dentro del líquido */}
                    <div className="absolute inset-0 opacity-50 bg-[radial-gradient(circle,rgba(255,255,255,0.2)_1px,transparent_1px)] bg-[length:20px_20px] animate-pulse"></div>
                 </div>

                 {/* CAPA DE ESPUMA (Blanca, encima del líquido) */}
                 <div 
                   className="absolute w-full h-12 bg-white/90 backdrop-blur-md transition-all duration-300 ease-out flex items-end overflow-hidden shadow-sm"
                   // La espuma sube junto con el líquido
                   style={{ bottom: `${uploadProgress}%`, opacity: uploadProgress > 0 ? 1 : 0 }}
                 >
                    {/* Efecto "ola" en la parte superior de la espuma */}
                   <div className="w-[200%] h-full bg-[radial-gradient(circle,white_60%,transparent_65%)] bg-[length:30px_60px] relative -top-4 animate-[spin_4s_linear_infinite] opacity-70"></div>
                   <div className="w-[200%] h-full bg-[radial-gradient(circle,white_60%,transparent_65%)] bg-[length:40px_50px] relative -top-2 -left-10 animate-[spin_3s_linear_reverse_infinite]"></div>
                 </div>
               </div>

               {/* TEXTO E ICONO SUPERPUESTOS (Siempre visibles encima del líquido) */}
               <div className="relative z-10 flex flex-col items-center space-y-4 p-8 rounded-2xl bg-background/20 backdrop-blur-md border border-white/20 shadow-2xl animate-in fade-in zoom-in duration-500">
                 <div className="relative">
                    {/* Icono de Beer que brilla y rebota al final */}
                   <Beer className={cn(
                     "h-20 w-20 text-amber-100 drop-shadow-[0_0_15px_rgba(251,191,36,0.8)]",
                     uploadProgress >= 100 ? "animate-bounce" : "animate-pulse"
                   )} strokeWidth={1.5} />
                 </div>
                 <div className="space-y-1">
                   <h2 className="text-3xl font-bold text-white drop-shadow-md">
                     {uploadProgress < 100 ? "Llenando el tanque..." : "¡Salud! Datos listos."}
                   </h2>
                   <p className="text-xl text-white/90 font-mono font-bold drop-shadow-sm">
                     {Math.round(uploadProgress)}%
                   </p>
                 </div>
               </div>

            </div>
          ) : (
            /* --- ESTADO NORMAL (DRAG & DROP) --- */
            <>
              <div className={cn(
                "rounded-full p-6 transition-transform duration-300",
                isDragging ? "bg-amber-500/20 scale-110" : "bg-primary/10"
              )}>
                {/* Cambiamos el icono a Beer si se arrastra para dar feedback temático */}
                {isDragging ? (
                    <Beer className="h-16 w-16 text-amber-500 animate-bounce" />
                ) : (
                    <FileSpreadsheet className="h-16 w-16 text-primary" />
                )}
              </div>
              
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Cargar Datos de Producción</h1>
                <p className="text-muted-foreground max-w-lg mx-auto">
                  {isDragging ? "¡Suelta para empezar el cocimiento!" : "Arrastra tu archivo Excel aquí o haz clic para seleccionarlo."}
                </p>
              </div>
              
              <div className="flex flex-col items-center gap-4">
                <Button size="lg" className={cn(
                    "relative cursor-pointer hover:scale-105 transition-transform shadow-lg",
                    isDragging ? "bg-amber-500 hover:bg-amber-600" : ""
                )}>
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
        
        <KPICard 
          title="Mayor Tiempo Muerto" 
          value={`${highestIdle.idleTime} min`} 
          subtitle={`Equipo: ${highestIdle.machine}`} 
          icon={Clock} 
          variant="warning"
          onClick={handleNavigateToDetail}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2"><EfficiencyChart data={data} /></div>
        <div className="lg:col-span-1"><AlertsWidget data={data} /></div>
      </div>

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