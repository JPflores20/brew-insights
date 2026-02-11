import { useState, useEffect, useRef, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { KPICard } from "@/components/dashboard/KPICard";
import { EfficiencyChart } from "@/components/dashboard/EfficiencyChart";
import { 
  Boxes, 
  TrendingUp, 
  Clock, 
  Upload, 
  FileSpreadsheet, 
  Beer, 
  Info, 
  AlertTriangle,
  PieChart as PieChartIcon,
  Maximize2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { processExcelFile } from "@/utils/excelProcessor";
import { useData } from "@/context/DataContext"; 
import { 
  getTotalBatches, 
  getAverageCycleDeviation, 
  getMachineWithHighestIdleTime,
  getRecipeStats
} from "@/data/mockData";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { 
  ResponsiveContainer, 
  Legend,
  PieChart, 
  Pie, 
  Cell,
  Tooltip as RechartsTooltip,
  Label
} from "recharts";

export default function Overview() {
  const { data, setData } = useData(); 
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [expandedChart, setExpandedChart] = useState<"efficiency" | "distribution" | null>(null);
  
  const [uploadProgress, setUploadProgress] = useState(0);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const { toast } = useToast();
  const navigate = useNavigate();

  // --- Lógica de carga de archivos (sin cambios) ---
  const clearProgressInterval = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  };

  const processFile = async (file: File) => {
    setLoading(true);
    setUploadProgress(0);

    progressIntervalRef.current = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) {
          return 90 + Math.random() * 2; 
        }
        const increment = Math.random() * 15;
        return Math.min(prev + increment, 90);
      });
    }, 300);

    try {
      const processedData = await processExcelFile(file);
      clearProgressInterval();
      setUploadProgress(100);
      await new Promise(resolve => setTimeout(resolve, 800));
      setData(processedData); 
      toast({
        title: "¡Tanque lleno!",
        description: `Se han procesado ${processedData.length} registros correctamente.`,
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
        title: "Ingrediente incorrecto",
        description: "Por favor arrastra un archivo Excel (.xlsx o .xls).",
      });
    }
  };
  // -------------------------------------------

  // --- Cálculos ---
  const totalBatches = getTotalBatches(data);
  const avgDeviation = getAverageCycleDeviation(data);
  const highestIdle = getMachineWithHighestIdleTime(data);
  const recipeStats = useMemo(() => getRecipeStats ? getRecipeStats(data) : [], [data]);

  const pieData = useMemo(() => {
    return recipeStats.map(stat => ({
      name: stat.name,
      value: stat.batchCount
    })).sort((a, b) => b.value - a.value);
  }, [recipeStats]);

  const PIE_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

  const handleNavigateToDetail = () => {
    if (highestIdle.machine !== "N/A") {
      window.localStorage.setItem("detail-machine-selection-v2", JSON.stringify(highestIdle.machine));
      navigate("/machine");
    }
  };

  // --- Componente interno para la gráfica de pastel con el Total Central ---
  const ProductPieChart = ({ expanded = false }: { expanded?: boolean }) => (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={pieData}
          cx="50%"
          cy="50%"
          labelLine={{ stroke: 'hsl(var(--muted-foreground))', strokeWidth: 1 }}
          label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
          outerRadius={expanded ? 200 : 110} 
          innerRadius={expanded ? 100 : 60} // Estilo dona
          paddingAngle={2}
          dataKey="value"
          nameKey="name"
        >
          {pieData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} stroke="hsl(var(--card))" strokeWidth={2}/>
          ))}
          
          {/* Etiqueta central con el Total de Lotes */}
          <Label
            content={({ viewBox }) => {
              if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                return (
                  <text
                    x={viewBox.cx}
                    y={viewBox.cy}
                    textAnchor="middle"
                    dominantBaseline="middle"
                  >
                    <tspan
                      x={viewBox.cx}
                      y={viewBox.cy}
                      className={cn(
                        "fill-foreground font-bold",
                        expanded ? "text-5xl" : "text-3xl"
                      )}
                    >
                      {totalBatches}
                    </tspan>
                    <tspan
                      x={viewBox.cx}
                      y={(viewBox.cy || 0) + (expanded ? 32 : 24)}
                      className={cn(
                        "fill-muted-foreground",
                        expanded ? "text-base" : "text-xs"
                      )}
                    >
                      Lotes
                    </tspan>
                  </text>
                )
              }
            }}
          />
        </Pie>
        <RechartsTooltip 
          contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
          itemStyle={{ color: 'hsl(var(--popover-foreground))' }}
          formatter={(value: number) => [`${value} Lotes`, 'Cantidad']}
        />
        <Legend verticalAlign="bottom" height={36} iconType="circle"/>
      </PieChart>
    </ResponsiveContainer>
  );

  // --- Vista de Carga ---
  if (data.length === 0) {
    return (
      <DashboardLayout>
        <div 
          className={cn(
            "relative flex h-[70vh] flex-col items-center justify-center space-y-6 text-center rounded-xl transition-all overflow-hidden",
            loading ? "" : "border-2 border-dashed",
            !loading && isDragging ? "border-amber-500 bg-amber-500/5 scale-[1.02]" : "border-border",
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {loading ? (
            <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-background/90 backdrop-blur-sm">
               <div className="absolute inset-x-0 bottom-0 h-full w-full overflow-hidden rounded-xl">
                 <div 
                   className="absolute bottom-0 w-full bg-gradient-to-t from-amber-600 via-amber-500 to-amber-400 transition-all duration-300 ease-out"
                   style={{ height: `${uploadProgress}%` }}
                 >
                    <div className="absolute inset-0 opacity-50 bg-[radial-gradient(circle,rgba(255,255,255,0.2)_1px,transparent_1px)] bg-[length:20px_20px] animate-pulse"></div>
                 </div>
                 <div 
                   className="absolute w-full h-12 bg-white/90 backdrop-blur-md transition-all duration-300 ease-out flex items-end overflow-hidden shadow-sm"
                   style={{ bottom: `${uploadProgress}%`, opacity: uploadProgress > 0 ? 1 : 0 }}
                 >
                   <div className="w-[200%] h-full bg-[radial-gradient(circle,white_60%,transparent_65%)] bg-[length:30px_60px] relative -top-4 animate-[spin_4s_linear_infinite] opacity-70"></div>
                   <div className="w-[200%] h-full bg-[radial-gradient(circle,white_60%,transparent_65%)] bg-[length:40px_50px] relative -top-2 -left-10 animate-[spin_3s_linear_reverse_infinite]"></div>
                 </div>
               </div>

               <div className="relative z-10 flex flex-col items-center space-y-4 p-8 rounded-2xl bg-background/20 backdrop-blur-md border border-white/20 shadow-2xl animate-in fade-in zoom-in duration-500">
                 <div className="relative">
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
            <>
              <div className={cn(
                "rounded-full p-6 transition-transform duration-300",
                isDragging ? "bg-amber-500/20 scale-110" : "bg-primary/10"
              )}>
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

  // --- VISTA PRINCIPAL DEL DASHBOARD ---
  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Tablero General</h1>
          <p className="text-muted-foreground mt-1">Monitor de eficiencia y métricas clave de producción.</p>
        </div>
        <Button variant="outline" className="shadow-sm" onClick={() => setData([])}>
          <Upload className="mr-2 h-4 w-4" /> Cargar otro archivo
        </Button>
      </div>

      {/* 1. Fila Superior: KPIs Principales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <KPICard title="Total Lotes" value={totalBatches} subtitle="Procesados en el periodo" icon={Boxes} variant="success" />
        <KPICard title="Desviación Promedio" value={`${avgDeviation > 0 ? '+' : ''}${avgDeviation}%`} subtitle="Vs. Tiempo Esperado Total" icon={TrendingUp} variant={avgDeviation > 10 ? "danger" : "success"} />
        <KPICard 
          title="Mayor Tiempo Muerto" 
          value={`${highestIdle.idleTime} min`} 
          subtitle={`Equipo crítico: ${highestIdle.machine}`} 
          icon={Clock} 
          variant="warning"
          onClick={handleNavigateToDetail}
        />
      </div>

      {/* 2. Fila Central: Análisis Gráfico */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8 items-stretch">
        
        {/* Gráfico de Barras: Eficiencia por Grupo (Clickeable) */}
        <div 
          className="relative group cursor-pointer transition-all hover:ring-2 hover:ring-primary/20 rounded-xl"
          onClick={() => setExpandedChart("efficiency")}
        >
          <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 p-1.5 rounded-md shadow-sm border border-border">
             <Maximize2 className="w-4 h-4 text-muted-foreground" />
          </div>
          <EfficiencyChart data={data} />
        </div>

        {/* Gráfico de Pastel: Distribución de Productos (Clickeable) */}
        <Card 
          className="bg-card border-border shadow-sm flex flex-col cursor-pointer group relative transition-all hover:ring-2 hover:ring-primary/20"
          onClick={() => setExpandedChart("distribution")}
        >
          <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 p-1.5 rounded-md shadow-sm border border-border">
             <Maximize2 className="w-4 h-4 text-muted-foreground" />
          </div>
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <PieChartIcon className="h-5 w-5 text-amber-500" />
              Distribución de Productos
            </CardTitle>
            <CardDescription>Volumen de producción por tipo de cerveza</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex items-center justify-center p-2">
            <div className="h-[350px] w-full">
              {pieData.length > 0 ? (
                <ProductPieChart />
              ) : (
                <div className="text-muted-foreground flex flex-col items-center justify-center h-full">
                  <Info className="h-8 w-8 mb-2 opacity-50" />
                  No hay datos suficientes para graficar.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. Fila Inferior: Glosario de Indicadores */}
      <div>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Info className="h-5 w-5 text-primary" />
          Guía Rápida de Indicadores
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Tarjeta 1: Desviación */}
          <Card className="bg-card border-border shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
            <div className="absolute top-0 right-0 p-3 opacity-5">
              <TrendingUp className="h-24 w-24" />
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium flex items-center gap-2 text-green-600 dark:text-green-400">
                <TrendingUp className="h-4 w-4" /> Desviación Promedio
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                Porcentaje global que indica qué tanto se alejan los tiempos reales de los teóricos. Un valor positivo significa producción más lenta.
              </p>
              <div className="bg-secondary/50 p-2 rounded-md border border-border/50">
                <code className="text-xs font-mono text-foreground">((T.Real - T.Esp) / T.Esp) * 100</code>
              </div>
            </CardContent>
          </Card>

          {/* Tarjeta 2: Retraso */}
          <Card className="bg-card border-border shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
            <div className="absolute top-0 right-0 p-3 opacity-5">
              <Clock className="h-24 w-24" />
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium flex items-center gap-2 text-chart-delay">
                <Clock className="h-4 w-4" /> Retraso (Delay)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                Ineficiencia <strong>interna</strong> en los pasos. Ocurre cuando una máquina tarda más de lo estipulado en la receta para una tarea.
              </p>
              <div className="bg-secondary/50 p-2 rounded-md border border-border/50">
                <code className="text-xs font-mono text-foreground">Tiempo Real - Tiempo Esperado</code>
              </div>
            </CardContent>
          </Card>

          {/* Tarjeta 3: Tiempo Muerto */}
          <Card className="bg-card border-border shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
            <div className="absolute top-0 right-0 p-3 opacity-5">
              <AlertTriangle className="h-24 w-24" />
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium flex items-center gap-2 text-orange-500">
                <AlertTriangle className="h-4 w-4" /> Tiempo Muerto (Idle)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                Ineficiencia <strong>externa</strong> entre pasos. Es la suma de los "huecos" donde la máquina esperó entre el fin de un paso y el inicio del siguiente.
              </p>
              <div className="bg-secondary/50 p-2 rounded-md border border-border/50">
                <code className="text-xs font-mono text-foreground">Σ (Inicioₙ - Finₙ₋₁)</code>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* DIALOGS PARA GRÁFICAS EXPANDIDAS */}
      <Dialog open={!!expandedChart} onOpenChange={(open) => !open && setExpandedChart(null)}>
        <DialogContent className="max-w-[90vw] h-[80vh] flex flex-col p-6">
          <DialogHeader>
             <DialogTitle className="text-2xl flex items-center gap-2">
                {expandedChart === 'efficiency' && <><TrendingUp className="h-6 w-6 text-primary"/> Eficiencia Detallada por Grupo</>}
                {expandedChart === 'distribution' && <><PieChartIcon className="h-6 w-6 text-amber-500"/> Distribución Completa de Productos</>}
             </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 w-full min-h-0 mt-4">
             {expandedChart === 'efficiency' && (
                // Pasamos una clase de altura específica para el modo expandido
                <EfficiencyChart data={data} className="h-[60vh]" titleClassName="hidden" />
             )}
             
             {expandedChart === 'distribution' && (
                <ProductPieChart expanded={true} />
             )}
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}