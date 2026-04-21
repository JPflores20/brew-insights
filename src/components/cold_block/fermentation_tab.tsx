import { useState, useMemo } from "react";
import { useData } from "@/context/data_context";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  AreaChart,
  Area
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChartTooltip } from "@/components/ui/chart_tooltip";
import { Thermometer, Activity, Clock, Sliders } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import { FermentationChart } from "./fermentation_chart";

export function FermentationTab() {
  const { coldBlockData } = useData();
  const [selectedTank, setSelectedTank] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [selectedBatch, setSelectedBatch] = useState<string | null>(null);

  // 1. Extraer tanques únicos y normalizar nombres
  const tanks = useMemo(() => {
    const tankNames = new Set(
      coldBlockData
        .map(d => d.TEILANL_GRUPO)
    );
    const sorted = Array.from(tankNames).sort();
    if (sorted.length > 0 && !selectedTank) {
      setSelectedTank(sorted[0]);
    }
    return sorted;
  }, [coldBlockData, selectedTank]);

  // 2. Extraer Recetas (Productos) para el tanque seleccionado
  const products = useMemo(() => {
    if (!selectedTank) return [];
    const prods = new Set(
      coldBlockData
        .filter(d => d.TEILANL_GRUPO === selectedTank)
        .map(d => d.productName)
        .filter(Boolean)
    );
    const sorted = Array.from(prods).sort();
    if (sorted.length > 0 && !selectedProduct) {
      setSelectedProduct(sorted[0]);
    }
    return sorted;
  }, [coldBlockData, selectedTank, selectedProduct]);

  // 3. Extraer Batches para el tanque y producto seleccionados
  const batches = useMemo(() => {
    if (!selectedTank) return [];
    let filtered = coldBlockData.filter(d => d.TEILANL_GRUPO === selectedTank);
    if (selectedProduct && selectedProduct !== "ALL") {
      filtered = filtered.filter(d => d.productName === selectedProduct);
    }
    const b = new Set(filtered.map(d => d.CHARG_NR).filter(Boolean));
    const sortedBatches = Array.from(b).sort((a, b) => b.localeCompare(a));
    if (sortedBatches.length > 0 && !selectedBatch) {
      setSelectedBatch(sortedBatches[0]); // Seleccionar el más reciente por defecto
    }
    return sortedBatches;
  }, [coldBlockData, selectedTank, selectedProduct, selectedBatch]);

  // 4. Preparar datos de la serie de tiempo para el lote seleccionado
  const chartData = useMemo(() => {
    if (!selectedTank) return [];

    let records = coldBlockData.filter(d => d.TEILANL_GRUPO === selectedTank);
    
    if (selectedProduct && selectedProduct !== "ALL") {
      records = records.filter(d => d.productName === selectedProduct);
    }
    const isShowingAllBatches = !selectedBatch || selectedBatch === "ALL";
    if (!isShowingAllBatches) {
      records = records.filter(d => d.CHARG_NR === selectedBatch);
    }
    
    // Calcular tiempo de inicio por lote para alineación
    const batchStarts = new Map<string, number>();
    records.forEach(r => {
      const timestamps = r.parameters
        .map(p => p.timestamp ? new Date(p.timestamp).getTime() : null)
        .filter((t): t is number => t !== null);
      if (timestamps.length > 0) {
        batchStarts.set(r.CHARG_NR, Math.min(...timestamps));
      }
    });

    const allParams = records.flatMap(record => 
      record.parameters.map(p => ({
        ...p,
        batch: record.CHARG_NR,
        product: record.productName,
        batchStart: batchStarts.get(record.CHARG_NR) || 0
      }))
    );

    // Si mostramos todos, ordenamos por hora relativa. Si es uno solo, por timestamp real.
    if (isShowingAllBatches) {
      allParams.sort((a, b) => {
        const hourA = (new Date(a.timestamp!).getTime() - a.batchStart) / 3600000;
        const hourB = (new Date(b.timestamp!).getTime() - b.batchStart) / 3600000;
        return hourA - hourB;
      });
    } else {
      allParams.sort((a, b) => new Date(a.timestamp!).getTime() - new Date(b.timestamp!).getTime());
    }

    const globalStart = allParams.length > 0 ? new Date(allParams[0].timestamp!).getTime() : 0;

    const pointsMap = new Map<string, any>();
    allParams.forEach(p => {
      const currentTime = new Date(p.timestamp!).getTime();
      const elapsedHours = Number(((currentTime - p.batchStart) / (1000 * 60 * 60)).toFixed(1));
      
      // La llave del mapa depende de si estamos comparando o no
      // Si comparamos, usamos la hora relativa como llave para agrupar puntos de diferentes lotes en la misma "fila" de Recharts
      const key = isShowingAllBatches ? elapsedHours.toString() : p.timestamp!;
      
      if (!pointsMap.has(key)) {
        pointsMap.set(key, { 
          time: isShowingAllBatches ? 0 : currentTime, // Solo importa si no comparamos
          hour: elapsedHours,
          displayTime: format(new Date(p.timestamp!), "dd/MM/yyyy HH:mm", { locale: es }),
          batch: p.batch,
          product: p.product,
          units: {} as Record<string, string>
        });
      }
      
      const point = pointsMap.get(key);
      if (!isNaN(p.value)) {
        // Si mostramos todos, usamos una llave compuesta para el parámetro: "Nombre_Batch"
        const paramKey = isShowingAllBatches ? `${p.name}_${p.batch}` : p.name;
        point[paramKey] = p.value;
        point.units[paramKey] = p.unit;
        // También guardamos el valor "base" para que el tooltip sepa qué es
        if (isShowingAllBatches) {
           if (!point.multiBatch) point.multiBatch = {};
           point.multiBatch[paramKey] = { name: p.name, batch: p.batch, value: p.value, unit: p.unit };
        }
      }
    });

    return Array.from(pointsMap.values()).sort((a, b) => a.hour - b.hour);
  }, [coldBlockData, selectedTank, selectedProduct, selectedBatch]);

  // 5. Identificar qué series (parámetros) hay disponibles
  const series = useMemo(() => {
    if (chartData.length === 0) return [];
    const keys = new Set<string>();
    chartData.forEach(d => {
      Object.keys(d).forEach(k => {
        const lowerK = k.toLowerCase();
        const isExcluded = ['time', 'displayTime', 'batch', 'product', 'units', 'hour'].includes(lowerK) || lowerK.includes('indice');
        if (!isExcluded) {
          keys.add(k);
        }
      });
    });
    return Array.from(keys);
  }, [chartData]);

  const fermentationSteps = useMemo(() => {
    if (!selectedBatch || selectedBatch === "ALL" || !selectedTank || chartData.length === 0) return [];
    
    const batchRecord = coldBlockData.find(d => d.CHARG_NR === selectedBatch && d.TEILANL_GRUPO === selectedTank);
    if (!batchRecord || !batchRecord.steps) return [];

    const startMs = chartData[0].time;
    const groupedSteps: any[] = [];
    let lastStepName = "";

    const shortenName = (n: string) => {
      const upper = n.toUpperCase();
      if (upper.includes("FERMENT")) return "FERM";
      if (upper.includes("ATEMPERA")) return "ATEMP";
      if (upper.includes("ENFRIA")) return "ENFR";
      if (upper.includes("EXTRAC")) return "EXTR";
      if (upper.includes("LLENADO")) return "LLENADO";
      if (upper.includes("INICIO")) return "INICIO";
      if (upper.includes("FINAL")) return "FIN";
      return n.length > 10 ? n.substring(0, 8) + "..." : n;
    };

    let stepIndex = 0;
    batchRecord.steps.forEach(s => {
      const rawName = s.stepName.trim();
      if (rawName !== lastStepName && rawName !== "Espera" && s.durationMin > 15) {
        const stepStartMs = new Date(s.startTime).getTime();
        const hour = Number(((stepStartMs - startMs) / (1000 * 60 * 60)).toFixed(1));
        
        if (hour >= 0) {
          const lastIndex = groupedSteps.length - 1;
          const lastHour = lastIndex >= 0 ? groupedSteps[lastIndex].hour : -99;
          
          if (hour - lastHour > 12.0) {
            groupedSteps.push({
              name: shortenName(rawName),
              fullName: rawName,
              hour: hour,
              duration: s.durationMin
            });
            lastStepName = rawName;
            stepIndex++;
          }
        }
      }
    });

    return groupedSteps;
  }, [coldBlockData, selectedBatch, selectedTank, chartData]);

  const latestBatchData = useMemo(() => {
    if (chartData.length === 0) return null;
    return chartData[chartData.length - 1];
  }, [chartData]);

  if (tanks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] bg-slate-900/20 rounded-2xl border border-slate-800/50 border-dashed text-center p-8">
        <Thermometer className="h-12 w-12 text-slate-500 mb-4 opacity-30" />
        <h3 className="text-lg font-medium text-slate-300">No se detectaron tanques</h3>
        <p className="text-sm text-slate-500 max-w-sm mt-1">
          Asegúrate de cargar archivos que contengan información de tanques (FV, Tanques, etc.)
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4 bg-slate-900/40 p-4 rounded-xl border border-slate-800/50">
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold ml-1">Tanque</span>
          <Select value={selectedTank || ""} onValueChange={t => { setSelectedTank(t); setSelectedBatch(null); }}>
            <SelectTrigger className="w-[180px] bg-slate-900/50 border-slate-700 h-9 text-xs">
              <SelectValue placeholder="Seleccionar Tanque" />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-700">
              {tanks.map(t => (
                <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold ml-1">Receta (Producto)</span>
          <Select value={selectedProduct || "ALL"} onValueChange={p => { setSelectedProduct(p); setSelectedBatch(null); }}>
            <SelectTrigger className="w-[180px] bg-slate-900/50 border-slate-700 h-9 text-xs">
              <SelectValue placeholder="Todas las Recetas" />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-700">
              <SelectItem value="ALL" className="text-xs">Todas las Recetas</SelectItem>
              {products.map(p => (
                <SelectItem key={p} value={p} className="text-xs">{p}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold ml-1">Cocimiento / Lote</span>
          <Select value={selectedBatch || "ALL"} onValueChange={setSelectedBatch}>
            <SelectTrigger className="w-[150px] bg-slate-900/50 border-slate-700 h-9 text-xs">
              <SelectValue placeholder="Todos los Lotes" />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-700">
              <SelectItem value="ALL" className="text-xs">Todos los Lotes</SelectItem>
              {batches.map(b => (
                <SelectItem key={b} value={b} className="text-xs">Batch {b}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2 px-3 py-2 mt-auto rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs h-9">
          <Activity className="h-3.5 w-3.5" />
          <span>{chartData.length} Puntos</span>
        </div>

        {latestBatchData && (
          <div className="flex items-center gap-6 ml-auto pr-2">
            <div className="flex flex-col items-end">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider">Último Lote</span>
              <span className="text-xs text-slate-200 font-medium">{latestBatchData.batch}</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider">Producto</span>
              <span className="text-xs text-slate-200 font-medium">{latestBatchData.product}</span>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <FermentationChart data={chartData} tankName={selectedTank || "Tanque"} steps={fermentationSteps} />
        </div>

        <div className="space-y-6">
          <Card className="bg-slate-900/40 border-slate-800/50 backdrop-blur-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
                <Sliders className="h-4 w-4" />
                Variables de Control
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {series.length > 0 ? series.map((s, idx) => {
                   const colors = ['text-blue-400', 'text-emerald-400', 'text-amber-400', 'text-rose-400', 'text-purple-400'];
                   const latestPoint = chartData[chartData.length - 1];
                   return (
                     <div key={s} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/30 border border-slate-800/50">
                       <span className="text-xs text-slate-400 truncate max-w-[120px]" title={s}>{s}</span>
                       <span className={`text-sm font-bold ${colors[idx % colors.length]}`}>
                         {typeof latestPoint[s] === 'number' ? latestPoint[s].toFixed(1) : '0.0'} {latestPoint.units?.[s] || ''}
                       </span>
                     </div>
                   );
                }) : (
                  <p className="text-xs text-slate-500 text-center py-4">No hay parámetros detectados</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/40 border-slate-800/50 backdrop-blur-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Cronología
              </CardTitle>
            </CardHeader>
            <CardContent>
               <div className="relative pl-4 space-y-4 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[1px] before:bg-slate-800">
                  {chartData.slice(-4).reverse().map((p, i) => (
                    <div key={i} className="relative">
                      <div className="absolute -left-[9px] top-1.5 h-2.5 w-2.5 rounded-full bg-blue-500 ring-4 ring-slate-900" />
                      <p className="text-[11px] text-slate-500">{p.displayTime}</p>
                      <p className="text-xs text-slate-300 font-medium">Batch {p.batch}</p>
                    </div>
                  ))}
               </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
