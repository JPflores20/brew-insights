import { useState, useEffect, useRef, useMemo } from "react";
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
  AlertTriangle,
  Factory, 
  Sun,
  Moon,
  PieChart as PieChartIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { processExcelFile } from "@/utils/excelProcessor";
import { useData } from "@/context/DataContext"; 
import { 
  getTotalBatches, 
  getAverageCycleDeviation, 
  getMachineWithHighestIdleTime,
  getRecipeStats, 
  getShiftStats
} from "@/data/mockData";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend,
  PieChart, 
  Pie, 
  Cell 
} from "recharts";

export default function Overview() {
  const { data, setData } = useData(); 
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  const [uploadProgress, setUploadProgress] = useState(0);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const { toast } = useToast();
  const navigate = useNavigate();

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

  const totalBatches = getTotalBatches(data);
  const avgDeviation = getAverageCycleDeviation(data);
  const highestIdle = getMachineWithHighestIdleTime(data);
  
  const recipeStats = useMemo(() => getRecipeStats ? getRecipeStats(data) : [], [data]);
  const shiftStats = useMemo(() => getShiftStats ? getShiftStats(data) : [], [data]);

  // Datos para la gráfica de pastel (Distribución de productos)
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        
        {/* 1. Comparativa de Recetas */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Factory className="h-5 w-5 text-purple-500" />
              Rendimiento por Receta
            </CardTitle>
            <CardDescription>Comparación de tiempos reales y tiempos muertos promedio</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={recipeStats.slice(0, 5)} layout="vertical" margin={{ left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.3} />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={120} tick={{fontSize: 10}} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))' }}
                    itemStyle={{ color: 'hsl(var(--popover-foreground))' }}
                  />
                  <Legend />
                  <Bar dataKey="avgReal" name="T. Real Promedio" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} barSize={20} />
                  <Bar dataKey="avgIdle" name="T. Muerto Promedio" fill="#ef4444" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* 2. Distribución de Productos (GRÁFICA DE PASTEL NUEVA) */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <PieChartIcon className="h-5 w-5 text-amber-500" />
              Distribución de Productos
            </CardTitle>
            <CardDescription>Cantidad de lotes producidos por marca</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center">
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="name"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))' }}
                      itemStyle={{ color: 'hsl(var(--popover-foreground))' }}
                      formatter={(value: number) => [`${value} Lotes`, 'Cantidad']}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-muted-foreground">No hay datos suficientes</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 3. Análisis de Turnos (Movido al final) */}
        <Card className="bg-card border-border lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Moon className="h-5 w-5 text-indigo-500" />
              Eficiencia por Turno
            </CardTitle>
            <CardDescription>Desempeño acumulado por horario de inicio</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {shiftStats.map((shift) => (
                <div key={shift.name} className="flex flex-col justify-between p-4 rounded-lg bg-secondary/30 border border-border/50 hover:bg-secondary/50 transition-colors">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={cn("p-2 rounded-full", 
                        shift.name.includes("Matutino") ? "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400" : 
                        shift.name.includes("Vespertino") ? "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400" : 
                        "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400"
                    )}>
                      {shift.name.includes("Matutino") ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{shift.name}</p>
                      <p className="text-xs text-muted-foreground">{shift.batches} lotes</p>
                    </div>
                  </div>
                  <div className="text-right mt-auto">
                    <p className={cn("text-xl font-bold", shift.avgIdle > 15 ? "text-red-500" : "text-green-600")}>
                      {shift.avgIdle} min
                    </p>
                    <p className="text-[10px] text-muted-foreground">T. Muerto Promedio</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
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