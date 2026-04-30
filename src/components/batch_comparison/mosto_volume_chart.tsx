import React, { useState, useMemo, useEffect } from "react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription 
} from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MultiSelect } from "@/components/ui/multi_select";
import { 
  Droplets, 
  BarChart3
} from "lucide-react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
  ReferenceLine
} from "recharts";
import { BatchRecord } from "@/types";

interface MostoVolumeChartProps {
  data: BatchRecord[];
}

export function MostoVolumeChart({ data = [] }: MostoVolumeChartProps) {
  // Filtros
  const [selectedReceta, setSelectedReceta] = useState<string>("");

  // Unique recipes from data
  const uniqueRecetas = useMemo(() => {
    return Array.from(new Set(data.map(r => r.productName).filter(Boolean))).sort();
  }, [data]);


  // --- DATOS FINALES PARA LA GRÁFICA ---
  const chartData = useMemo(() => {
    if (!selectedReceta) return [];

    let filtered = data.filter(r => (r.mosto_volume_hl || 0) > 0);
    
    if (selectedReceta !== "ALL") {
      filtered = filtered.filter(r => r.productName === selectedReceta);
    }

    // Sort by timestamp
    return filtered
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .map(row => ({
        lote: row.CHARG_NR,
        volumen: row.mosto_volume_hl || 0,
        receta: row.productName,
        date: new Date(row.timestamp).toLocaleString()
      }));
  }, [data, selectedReceta]);

  const averageVolume = useMemo(() => {
    if (chartData.length === 0) return 0;
    const sum = chartData.reduce((acc, curr) => acc + curr.volumen, 0);
    return sum / chartData.length;
  }, [chartData]);

  const hasData = chartData.length > 0;

  return (
    <Card className="bg-slate-900/40 border-slate-800/50 backdrop-blur-md shadow-2xl">
      <CardHeader className="pb-4 border-b border-slate-800/50">
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-slate-800/50 text-blue-400">
                <Droplets className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold flex items-center gap-2 text-slate-100">
                  Volumen de Coctos (Mosto)
                </CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  Resumen automático extraído de los archivos <span className="font-mono text-blue-400">.DBF</span> (Columna IW_DFM2 del paso PRIMER MOSTO.)
                </CardDescription>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 p-3 bg-slate-950/40 rounded-lg border border-slate-800">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Receta:</span>
              <Select value={selectedReceta} onValueChange={setSelectedReceta}>
                <SelectTrigger className="h-9 w-[200px] bg-slate-900 border-slate-800 text-sm focus:ring-blue-500/20">
                  <SelectValue placeholder="Seleccione una receta..." />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
                  <SelectItem value="ALL">Todas las recetas</SelectItem>
                  {uniqueRecetas.map(r => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>


            <div className="ml-auto flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold text-slate-500">Coctos Graficados:</span>
              <span className="bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded text-xs font-mono font-bold">
                {chartData.length}
              </span>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-8 px-6 pb-8">
        <div className="space-y-2">
          <div className="h-[400px] w-full bg-slate-950/20 rounded-xl border border-slate-800/30 overflow-hidden p-4">
            {hasData ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 30, right: 30, left: 0, bottom: 20 }}>
                  <defs>
                    <linearGradient id="colorVol" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.5}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} vertical={false} />
                  <XAxis 
                    dataKey="lote" 
                    stroke="#94a3b8" 
                    tick={{ fill: '#94a3b8', fontSize: 11 }} 
                    axisLine={{ stroke: '#334155' }}
                    tickLine={false}
                    label={{ value: 'Número de Lote', position: 'insideBottom', offset: -15, fill: '#64748b', fontSize: 12 }}
                  />
                  <YAxis 
                    stroke="#94a3b8" 
                    tick={{ fill: '#94a3b8', fontSize: 11 }} 
                    axisLine={false}
                    tickLine={false}
                    domain={['dataMin - 50', 'dataMax + 50']}
                    label={{ value: 'Volumen (hl)', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 12 }}
                  />
                  <RechartsTooltip
                    cursor={{ stroke: '#3b82f6', strokeWidth: 1, strokeDasharray: '4 4', fill: 'transparent' }}
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', padding: '12px' }}
                    itemStyle={{ color: '#60a5fa', fontWeight: 'bold' }}
                    labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
                    formatter={(value: number) => [`${value.toFixed(2)} hl`, 'Volumen']}
                    labelFormatter={(label, payload) => {
                       const d = payload?.[0]?.payload;
                       return (
                         <span className="flex flex-col gap-0.5">
                           <span>Lote: {label} ({d?.receta})</span>
                           {d?.date && <span className="text-[10px] text-slate-400 font-normal">{d.date}</span>}
                         </span>
                       );
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="volumen" 
                    name="Volumen de Mosto" 
                    stroke="#3b82f6" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorVol)"
                    activeDot={{ r: 6, fill: '#3b82f6', stroke: '#0f172a', strokeWidth: 2 }}
                  />
                  {averageVolume > 0 && (
                    <ReferenceLine 
                      y={averageVolume} 
                      stroke="#f59e0b" 
                      strokeDasharray="3 3" 
                      opacity={0.8}
                    />
                  )}
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 italic gap-3">
                <BarChart3 className="h-10 w-10 opacity-20" />
                <span className="text-sm">
                  {!selectedReceta 
                    ? "Por favor, seleccione una receta en el filtro superior para visualizar la evolución del volumen" 
                    : "No se encontraron datos de volumen para la selección actual"}
                </span>
                {selectedReceta && (
                  <span className="text-xs text-slate-600">Verifique que los archivos .DBF contengan el paso "PRIMER MOSTO"</span>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center justify-center gap-6 mt-4 text-[10px] uppercase font-bold text-slate-500">
             <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500"></div> Evolución de Volumen (hl)</div>
             <div className="flex items-center gap-2"><div className="w-3 h-0.5 rounded-full bg-amber-500"></div> Promedio</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}