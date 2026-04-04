import { useState, useMemo, useEffect } from "react";
import { useData } from "@/context/data_context";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ChartTooltip } from "@/components/ui/chart_tooltip";
import { Thermometer, Activity, Sliders, CheckSquare, Square, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { exportToCSV } from "@/utils/export_utils";

export function FermentationComparisonTab() {
  const { coldBlockData } = useData();
  const [selectedBatchKeys, setSelectedBatchKeys] = useState<string[]>([]);
  const [productFilter, setProductFilter] = useState<string>("ALL");
  const [selectedParam, setSelectedParam] = useState<string>("Temp. Tanque");

  // 1. Get unique products for filter
  const products = useMemo(() => {
    const set = new Set(coldBlockData.map(d => d.productName));
    return Array.from(set).sort();
  }, [coldBlockData]);

  // 2. Get available batches based on filter
  const availableBatches = useMemo(() => {
    let filtered = coldBlockData;
    if (productFilter !== "ALL") {
      filtered = filtered.filter(d => 
        d.productName.trim().toUpperCase() === productFilter.trim().toUpperCase()
      );
    }
    
    // De-duplicate just in case (by key)
    const uniqueMap = new Map();
    filtered.forEach(d => {
      const key = `${d.CHARG_NR.trim()}|${d.TEILANL_GRUPO.trim()}`;
      if (!uniqueMap.has(key)) uniqueMap.set(key, d);
    });
    
    const uniqueList = Array.from(uniqueMap.values());

    // Sort by batch number descending
    return uniqueList.sort((a, b) => b.CHARG_NR.localeCompare(a.CHARG_NR, undefined, {numeric: true}));
  }, [coldBlockData, productFilter]);

  // 3. Get available common parameters
  const availableParams = useMemo(() => {
    const params = new Set<string>();
    coldBlockData.forEach(batch => {
      batch.parameters.forEach(p => {
        const lowerName = p.name.toLowerCase();
        if (!lowerName.includes('indice')) {
            params.add(p.name);
        }
      });
    });
    // Add default options if not present
    if (params.size === 0) {
      params.add("Temp. Tanque");
      params.add("Temp. Consigna");
      params.add("Extracto (Plato)");
    }
    return Array.from(params).sort();
  }, [coldBlockData]);

  // Auto-select first two batches if none selected and data loaded
  useEffect(() => {
    if (selectedBatchKeys.length === 0 && availableBatches.length > 0) {
      const initial = availableBatches.slice(0, 2).map(b => `${b.CHARG_NR}|${b.TEILANL_GRUPO}`);
      setSelectedBatchKeys(initial);
    }
  }, [availableBatches, selectedBatchKeys.length]);

  // 4. Prepare Multi-Series Data (Normalized to T=0 per batch)
  const chartData = useMemo(() => {
    if (selectedBatchKeys.length === 0) return [];

    const normalizedPoints: Map<number, any> = new Map();

    selectedBatchKeys.forEach((key) => {
        const [chargNr, tank] = key.split('|');
        const batch = coldBlockData.find(d => d.CHARG_NR === chargNr && d.TEILANL_GRUPO === tank);
        if (!batch) return;

        // Find individual batch start time
        const batchParams = batch.parameters.filter(p => p.name === selectedParam && p.timestamp);
        if (batchParams.length === 0) return;

        const startTime = Math.min(...batchParams.map(p => new Date(p.timestamp!).getTime()));
        const seriesName = `Lote ${chargNr} (${tank})`;

        batchParams.forEach(p => {
            const currentTime = new Date(p.timestamp!).getTime();
            const hour = Number(((currentTime - startTime) / (1000 * 60 * 60)).toFixed(1));
            
            if (!normalizedPoints.has(hour)) {
                normalizedPoints.set(hour, { hour });
            }
            const point = normalizedPoints.get(hour);
            point[seriesName] = p.value;
            if (!point.displayTime) {
                point.displayTime = format(new Date(p.timestamp!), "dd/MM/yyyy HH:mm", { locale: es });
            }
        });
    });

    return Array.from(normalizedPoints.values()).sort((a, b) => a.hour - b.hour);
  }, [coldBlockData, selectedBatchKeys, selectedParam]);

  const toggleBatch = (key: string) => {
    setSelectedBatchKeys(prev => 
      prev.includes(key) 
        ? prev.filter(k => k !== key) 
        : [...prev, key]
    );
  };

  const colors = [
    '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', 
    '#06b6d4', '#ec4899', '#f97316', '#84cc16', '#a855f7'
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="bg-slate-900/40 border-slate-800/50 backdrop-blur-md lg:col-span-1">
          <CardHeader className="pb-3 pt-4 px-4 space-y-3">
            <CardTitle className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <CheckSquare className="h-4 w-4" />
              Comparar Lotes
            </CardTitle>
            
            <div className="space-y-1">
              <span className="text-[10px] text-slate-500 font-medium uppercase">Filtrar Receta</span>
              <Select value={productFilter} onValueChange={setProductFilter}>
                <SelectTrigger className="w-full bg-slate-900/50 border-slate-700 h-8 text-[11px]">
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
          </CardHeader>
          
          <CardContent className="px-2 pb-4">
            <div className="space-y-1 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar px-2">
              {availableBatches.map((batch) => {
                const key = `${batch.CHARG_NR}|${batch.TEILANL_GRUPO}`;
                const isSelected = selectedBatchKeys.includes(key);
                const colorIdx = selectedBatchKeys.indexOf(key);
                
                return (
                  <div 
                    key={key}
                    onClick={() => toggleBatch(key)}
                    className={`
                      flex flex-col gap-0.5 p-2 rounded-lg cursor-pointer transition-all border
                      ${isSelected ? 'bg-blue-600/30 border-blue-500/50' : 'hover:bg-slate-800/40 border-slate-800'}
                    `}
                  >
                    <div className="flex items-center gap-2">
                        <div className={`
                        h-3.5 w-3.5 rounded border flex items-center justify-center transition-all
                        ${isSelected ? 'bg-white border-white' : 'border-slate-600'}
                        `}>
                        {isSelected && <div className="h-1.5 w-1.5 bg-blue-600 rounded-full" />}
                        </div>
                        <span className={`text-[11px] font-bold ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                        Lote {batch.CHARG_NR} - {batch.TEILANL_GRUPO}
                        </span>
                        {isSelected && (
                            <div className="ml-auto h-2 w-2 rounded-full" style={{ backgroundColor: colors[colorIdx % colors.length] }} />
                        )}
                    </div>
                    <div className="flex items-center gap-1.5 ml-5.5 pl-0.5">
                        <span className={`text-[10px] truncate max-w-[120px] ${isSelected ? 'text-blue-200' : 'text-slate-500'}`}>
                            {batch.productName}
                        </span>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 px-2">
                <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full text-[10px] uppercase text-slate-500 hover:text-slate-300 h-7"
                    onClick={() => setSelectedBatchKeys([])}
                >
                    Limpiar Selección
                </Button>
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-3 space-y-6">
          <Card className="bg-slate-900/40 border-slate-800/50 backdrop-blur-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="space-y-1">
                <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                  <Activity className="h-5 w-5 text-blue-500" />
                  Superposición de Lotes
                </CardTitle>
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-[10px]">
                        Eje X: Tiempo transcurrido (T=0)
                    </Badge>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Variable a Comparar</span>
                  <Select value={selectedParam} onValueChange={setSelectedParam}>
                    <SelectTrigger className="w-[200px] bg-slate-900/50 border-slate-700 h-9 text-xs">
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-700">
                      {availableParams.map(p => (
                        <SelectItem key={p} value={p} className="text-xs">{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[500px] w-full mt-4">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                      <XAxis 
                        dataKey="hour" 
                        type="number"
                        domain={[0, 'auto']}
                        stroke="#64748b" 
                        fontSize={10} 
                        tickLine={false} 
                        axisLine={false}
                        label={{ value: 'Horas desde el inicio', position: 'insideBottom', offset: -10, fill: '#64748b', fontSize: 10 }}
                      />
                      <YAxis 
                        stroke="#64748b" 
                        fontSize={10} 
                        tickLine={false} 
                        axisLine={false}
                        domain={['auto', 'auto']}
                        label={{ value: selectedParam, angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 10, offset: 10 }}
                      />
                      <Tooltip 
                        content={({ active, payload, label }) => {
                          if (!active || !payload) return null;
                          return <ChartTooltip active={active} payload={payload} label={`T + ${label}h`} />;
                        }}
                      />
                      <Legend 
                        verticalAlign="top" 
                        align="right" 
                        height={36}
                        iconType="circle"
                        wrapperStyle={{ fontSize: '10px', paddingTop: '0px' }}
                      />
                      {selectedBatchKeys.map((key, idx) => {
                        const [chargNr, tank] = key.split('|');
                        const seriesName = `Lote ${chargNr} (${tank})`;
                        return (
                          <Line
                            key={key}
                            type="monotone"
                            dataKey={seriesName}
                            name={seriesName}
                            stroke={colors[idx % colors.length]}
                            strokeWidth={2}
                            dot={false}
                            activeDot={{ r: 4, strokeWidth: 0 }}
                            connectNulls={true}
                            animationDuration={1000}
                          />
                        );
                      })}
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-4">
                    <Thermometer className="h-12 w-12 opacity-20" />
                    <p className="text-sm text-center max-w-xs">Selecciona lotes en el panel izquierdo para superponer sus curvas de {selectedParam}.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

