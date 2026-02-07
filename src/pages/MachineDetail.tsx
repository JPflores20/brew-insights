import { useEffect, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { AlertTriangle, Clock, ListFilter } from "lucide-react";
import { useData } from "@/context/DataContext";
import { getUniqueBatchIds, getMachineData } from "@/data/mockData";
import { useLocalStorage } from "@/hooks/use-local-storage";

export default function MachineDetail() {
  const { data } = useData();
  
  // 1. Obtener todos los lotes únicos disponibles
  const allBatches = useMemo(() => getUniqueBatchIds(data), [data]);

  // --- ESTADOS (Persistentes) ---
  const [selectedBatchId, setSelectedBatchId] = useLocalStorage<string>("detail-batch-selection-v2", "");
  const [selectedMachine, setSelectedMachine] = useLocalStorage<string>("detail-machine-selection-v2", "");

  // --- EFECTOS DE SELECCIÓN ---

  // 1. Inicializar Lote si es necesario
  useEffect(() => {
    if (allBatches.length > 0) {
      if (!selectedBatchId || !allBatches.includes(selectedBatchId)) {
        setSelectedBatchId(allBatches[0]);
      }
    }
  }, [allBatches, selectedBatchId, setSelectedBatchId]);

  // 2. Calcular máquinas disponibles para el lote seleccionado
  const availableMachinesForBatch = useMemo(() => {
    if (!selectedBatchId) return [];
    const records = data.filter(d => d.CHARG_NR === selectedBatchId);
    return Array.from(new Set(records.map(r => r.TEILANL_GRUPO))).sort();
  }, [data, selectedBatchId]);

  // 3. Inicializar Máquina cuando cambia el lote
  useEffect(() => {
    if (availableMachinesForBatch.length > 0) {
      if (!selectedMachine || !availableMachinesForBatch.includes(selectedMachine)) {
        setSelectedMachine(availableMachinesForBatch[0]);
      }
    } else {
        setSelectedMachine("");
    }
  }, [availableMachinesForBatch, selectedMachine, setSelectedMachine]);


  // --- DATOS PARA VISUALIZACIÓN ---

  if (data.length === 0) {
    return (
      <DashboardLayout>
        <div className="flex h-[50vh] items-center justify-center">
          <div className="text-center text-muted-foreground">
            <Clock className="mx-auto h-12 w-12 opacity-50 mb-4" />
            <h2 className="text-xl font-semibold">Sin Datos</h2>
            <p>Por favor carga un archivo Excel en la pestaña "Resumen" primero.</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // A. Registro Específico
  const selectedRecord = data.find(
    d => d.CHARG_NR === selectedBatchId && d.TEILANL_GRUPO === selectedMachine
  );
  
  const stepsData = selectedRecord?.steps || [];

  // B. Contexto Histórico
  const machineHistoryData = useMemo(() => {
     if (!selectedMachine) return [];
     return getMachineData(data, selectedMachine)
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
        .map((record) => ({
            batchId: record.CHARG_NR,
            realTime: record.real_total_min,
            idle: record.idle_wall_minus_sumsteps_min,
            isCurrent: record.CHARG_NR === selectedBatchId
        }));
  }, [data, selectedMachine, selectedBatchId]);

  const currentGap = selectedRecord ? selectedRecord.max_gap_min : 0;
  const currentIdle = selectedRecord ? selectedRecord.idle_wall_minus_sumsteps_min : 0;

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-in fade-in duration-500">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Detalle de Lote y Pasos</h1>
          <p className="text-muted-foreground">Selecciona un lote para analizar su ejecución paso a paso</p>
        </div>

        {/* --- SELECTORES --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-card border-border">
                <CardHeader className="pb-2 pt-4">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <span className="bg-primary/20 text-primary w-6 h-6 rounded-full flex items-center justify-center text-xs">1</span>
                        Seleccionar Lote
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Select value={selectedBatchId} onValueChange={setSelectedBatchId}>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Buscar lote..." />
                        </SelectTrigger>
                        <SelectContent>
                            {allBatches.map(batch => (
                                <SelectItem key={batch} value={batch}>{batch}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </CardContent>
            </Card>

            <Card className="bg-card border-border">
                <CardHeader className="pb-2 pt-4">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                         <span className="bg-primary/20 text-primary w-6 h-6 rounded-full flex items-center justify-center text-xs">2</span>
                         Ver en Equipo
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Select value={selectedMachine} onValueChange={setSelectedMachine} disabled={availableMachinesForBatch.length === 0}>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder={availableMachinesForBatch.length === 0 ? "Lote sin equipos" : "Selecciona equipo"} />
                        </SelectTrigger>
                        <SelectContent>
                            {availableMachinesForBatch.map(machine => (
                                <SelectItem key={machine} value={machine}>{machine}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </CardContent>
            </Card>
        </div>

        {/* --- KPIs --- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card className="bg-card border-border">
            <CardContent className="pt-6 flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Mayor Gap en este Lote</p>
                <p className="text-3xl font-bold mt-2 text-chart-delay">{currentGap} min</p>
                <p className="text-xs text-muted-foreground">Pausa más larga detectada</p>
              </div>
              <div className="p-4 rounded-full bg-chart-delay/10">
                <AlertTriangle className="h-8 w-8 text-chart-delay" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="pt-6 flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tiempo Muerto Total</p>
                <p className="text-3xl font-bold mt-2 text-blue-500">{currentIdle} min</p>
                <p className="text-xs text-muted-foreground">Suma de todas las esperas</p>
              </div>
              <div className="p-4 rounded-full bg-blue-500/10">
                <Clock className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* --- GRÁFICO DE PASOS (DETALLE) --- */}
        {selectedRecord && stepsData.length > 0 ? (
            <Card className="bg-card border-border p-6 border-l-4 border-l-primary">
                <div className="flex items-center gap-2 mb-6">
                    <ListFilter className="h-5 w-5 text-primary" />
                    <div>
                        <CardTitle className="text-lg font-semibold">
                            Secuencia de Pasos ({selectedBatchId} en {selectedMachine})
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">Desglose detallado por operación (GOP_NAME)</p>
                    </div>
                </div>
                
                <div className="h-[500px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                        data={stepsData} 
                        layout="vertical" 
                        margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                        barCategoryGap="20%"
                    >
                        <CartesianGrid strokeDasharray="3 3" opacity={0.1} horizontal={true} vertical={true} />
                        <XAxis type="number" hide />
                        <YAxis 
                            dataKey="stepName" 
                            type="category" 
                            width={200}
                            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                            interval={0}
                        />
                        <Tooltip 
                            contentStyle={{ 
                                backgroundColor: 'hsl(var(--popover))', 
                                borderColor: 'hsl(var(--border))', 
                                borderRadius: '8px',
                                color: 'hsl(var(--popover-foreground))'
                            }}
                            cursor={{fill: 'transparent'}}
                        />
                        <Legend wrapperStyle={{ paddingTop: '10px' }} />
                        {/* Barra Real: Verde (Primary) */}
                        <Bar dataKey="durationMin" name="Duración Real (min)" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} barSize={20} />
                        
                        {/* Barra Esperada: Amarillo Ámbar (Para resaltar más) */}
                        <Bar dataKey="expectedDurationMin" name="Duración Esperada (min)" fill="#fbbf24" radius={[0, 4, 4, 0]} barSize={10} />
                    </BarChart>
                    </ResponsiveContainer>
                </div>
            </Card>
        ) : (
             selectedRecord && (
                <Card className="bg-card border-border p-6 border-l-4 border-l-yellow-500">
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-yellow-500" />
                        <p className="text-sm font-medium">
                          No se encontraron pasos detallados. Intenta recargar el archivo Excel.
                        </p>
                    </div>
                </Card>
             )
        )}

        {/* --- TENDENCIA HISTÓRICA --- */}
        {machineHistoryData.length > 0 && (
            <Card className="bg-card border-border h-[400px] p-6 opacity-90 hover:opacity-100 transition-opacity">
            <CardTitle className="mb-6 text-lg font-semibold flex items-center justify-between">
                <span>Histórico de {selectedMachine}</span>
                <span className="text-sm font-normal text-muted-foreground">Comparativa con otros lotes</span>
            </CardTitle>
            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={machineHistoryData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                    <linearGradient id="colorRealTime" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                    </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} vertical={false} />
                    <XAxis 
                        dataKey="batchId" 
                        tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} 
                        axisLine={{ stroke: 'hsl(var(--border))' }}
                    />
                    <YAxis 
                        label={{ value: 'Minutos', angle: -90, position: 'insideLeft', fill: 'hsl(var(--muted-foreground))' }}
                        tick={{ fill: 'hsl(var(--muted-foreground))' }}
                        axisLine={false}
                    />
                    <Tooltip 
                        contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                        labelStyle={{ color: 'hsl(var(--popover-foreground))' }}
                    />
                    <Area 
                        type="monotone" 
                        dataKey="realTime" 
                        stroke="#8884d8" 
                        strokeWidth={2}
                        fillOpacity={1} 
                        fill="url(#colorRealTime)" 
                        name="Tiempo Real" 
                    />
                </AreaChart>
                </ResponsiveContainer>
            </div>
            </Card>
        )}
      </div>
    </DashboardLayout>
  );
}