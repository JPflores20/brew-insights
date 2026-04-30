import React, { useState, useMemo, useCallback } from "react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription 
} from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePickerWithRange } from "@/components/ui/date_range_picker";
import { DateRange } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { 
  Droplets, 
  BarChart3,
  Download
} from "lucide-react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BatchRecord } from "@/types";

interface LastWaterVolumeChartProps {
  data: BatchRecord[];
}

const ALLOWED_EQUIPMENTS = [
  "Filtro Mosto 1", 
  "Filtro Mosto 2", // Note: user said "Filtro Mosto2", I'll check exact match or normalize
  "Filtro Mosto2",
  "Filtro Mosto 3", 
  "Filtro Mosto 4"
];

export function LastWaterVolumeChart({ data = [] }: LastWaterVolumeChartProps) {
  // Filtros
  const [selectedReceta, setSelectedReceta] = useState<string>("");
  const [selectedEquipo, setSelectedEquipo] = useState<string>("");

  // Date range filter
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  // Compute min and max dates available in the dataset
  const { minDate, maxDate } = useMemo(() => {
    if (!data || data.length === 0) return { minDate: undefined as Date | undefined, maxDate: undefined as Date | undefined };
    const timestamps = data.map(r => new Date(r.timestamp));
    const min = new Date(Math.min(...timestamps.map(d => d.getTime())));
    const max = new Date(Math.max(...timestamps.map(d => d.getTime())));
    return { minDate: min, maxDate: max };
  }, [data]);

  // Unique recipes from data
  const uniqueRecetas = useMemo(() => {
    return Array.from(new Set(data.map(r => r.productName).filter(Boolean))).sort();
  }, [data]);

  // Unique equipments from data that match allowed
  const availableEquipments = useMemo(() => {
    const allEquips = Array.from(new Set(data.map(r => r.TEILANL_GRUPO).filter(Boolean)));
    // We filter to show only the ones the user requested, ignoring case/spacing slightly if possible
    return allEquips.filter(eq => 
      eq.toUpperCase().includes("FILTRO MOSTO") || 
      ALLOWED_EQUIPMENTS.includes(eq)
    ).sort();
  }, [data]);

  // --- DATOS FINALES PARA LA GRÁFICA ---
  const chartData = useMemo(() => {
    // Filtrar los que tengan ultima_agua_hl definida
    let filtered = data.filter(r => r.ultima_agua_hl !== undefined && r.ultima_agua_hl !== null);
    
    // Si no se ha seleccionado receta ni equipo, no mostrar datos
    if (!selectedReceta && !selectedEquipo) return [];

    // Filtrar por receta
    if (selectedReceta && selectedReceta !== "ALL") {
      filtered = filtered.filter(r => r.productName === selectedReceta);
    }

    // Filtrar por equipo (solo los permitidos)
    if (selectedEquipo && selectedEquipo !== "ALL") {
      filtered = filtered.filter(r => r.TEILANL_GRUPO === selectedEquipo);
    } else if (selectedEquipo === "ALL") {
      // Si es "ALL", solo mostrar los de los equipos permitidos
      filtered = filtered.filter(r => 
        r.TEILANL_GRUPO.toUpperCase().includes("FILTRO MOSTO") || 
        ALLOWED_EQUIPMENTS.includes(r.TEILANL_GRUPO)
      );
    }

    // Filtrar por rango de fechas si ambos están definidos
    if (dateRange?.from) {
      const start = new Date(dateRange.from);
      start.setHours(0, 0, 0, 0);
      filtered = filtered.filter(r => new Date(r.timestamp) >= start);
    }
    if (dateRange?.to) {
      const end = new Date(dateRange.to);
      end.setHours(23, 59, 59, 999);
      filtered = filtered.filter(r => new Date(r.timestamp) <= end);
    }

    // Sort by timestamp
    return filtered
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .map(row => ({
        lote: row.CHARG_NR,
        volumen: row.ultima_agua_hl || 0,
        receta: row.productName,
        equipo: row.TEILANL_GRUPO,
        date: new Date(row.timestamp).toLocaleString()
      }));
  }, [data, selectedReceta, selectedEquipo, dateRange]);

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
              <div className="p-2 rounded-lg bg-slate-800/50 text-cyan-400">
                <Droplets className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold flex items-center gap-2 text-slate-100">
                  Volumen de Última Agua
                </CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  Diferencia de volumen (IW_DFM2) entre el último paso <span className="font-mono text-cyan-400">LAVADO NEW</span> y el primer paso <span className="font-mono text-cyan-400">Vaciar</span>.
                </CardDescription>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 p-3 bg-slate-950/40 rounded-lg border border-slate-800">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Receta:</span>
              <Select value={selectedReceta} onValueChange={setSelectedReceta}>
                <SelectTrigger className="h-9 w-[200px] bg-slate-900 border-slate-800 text-sm focus:ring-cyan-500/20">
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

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Equipo:</span>
              <Select value={selectedEquipo} onValueChange={setSelectedEquipo}>
                <SelectTrigger className="h-9 w-[200px] bg-slate-900 border-slate-800 text-sm focus:ring-cyan-500/20">
                  <SelectValue placeholder="Seleccione equipo..." />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
                  <SelectItem value="ALL">Todos los Filtros</SelectItem>
                  {availableEquipments.map(eq => (
                    <SelectItem key={eq} value={eq}>{eq}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Rango de Fechas:</span>
              <DatePickerWithRange
                date={dateRange}
                setDate={setDateRange}
                minDate={minDate}
                maxDate={maxDate}
              />
            </div>

            <div className="ml-auto flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold text-slate-500">Coctos Graficados:</span>
              <span className="bg-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded text-xs font-mono font-bold">
                {chartData.length}
              </span>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-8 px-6 pb-8">
        <Tabs defaultValue="chart" className="w-full">
          <div className="flex justify-between items-center mb-4">
            <TabsList className="bg-slate-900 border border-slate-800">
              <TabsTrigger value="chart" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">Gráfica</TabsTrigger>
              <TabsTrigger value="table" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">Tabla</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="chart" className="space-y-2 mt-0">
            <div className="h-[400px] w-full bg-slate-950/20 rounded-xl border border-slate-800/30 overflow-hidden p-4">
              {hasData ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 30, right: 30, left: 0, bottom: 20 }}>
                    <defs>
                      <linearGradient id="colorLastWater" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.5}/>
                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
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
                      domain={['auto', 'auto']}
                      label={{ value: 'Diferencia Volumen (hl)', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 12 }}
                    />
                    <RechartsTooltip
                      cursor={{ stroke: '#06b6d4', strokeWidth: 1, strokeDasharray: '4 4', fill: 'transparent' }}
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', padding: '12px' }}
                      itemStyle={{ color: '#22d3ee', fontWeight: 'bold' }}
                      labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
                      formatter={(value: number) => [`${value.toFixed(2)} hl`, 'Diferencia']}
                      labelFormatter={(label, payload) => {
                         const d = payload?.[0]?.payload;
                         return (
                           <span className="flex flex-col gap-0.5">
                             <span>Lote: {label} ({d?.receta})</span>
                             <span className="text-[10px] text-cyan-400 font-bold">{d?.equipo}</span>
                             {d?.date && <span className="text-[10px] text-slate-400 font-normal">{d.date}</span>}
                           </span>
                         );
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="volumen" 
                      name="Diferencia Volumen" 
                      stroke="#06b6d4" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorLastWater)"
                      activeDot={{ r: 6, fill: '#06b6d4', stroke: '#0f172a', strokeWidth: 2 }}
                    />
                    {averageVolume !== 0 && (
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
                    {!selectedReceta && !selectedEquipo 
                      ? "Seleccione al menos un filtro (Receta o Equipo) para visualizar los datos" 
                      : "No se encontraron datos que cumplan con los filtros seleccionados"}
                  </span>
                  {(selectedReceta || selectedEquipo) && (
                    <span className="text-xs text-slate-600">Verifique que los lotes tengan pasos "LAVADO NEW" y "Vaciar"</span>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center justify-center gap-6 mt-4 text-[10px] uppercase font-bold text-slate-500">
               <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-cyan-500"></div> Evolución (LAVADO NEW - Vaciar)</div>
               <div className="flex items-center gap-2"><div className="w-3 h-0.5 rounded-full bg-amber-500"></div> Promedio: <span className="text-amber-400 font-mono ml-1">{averageVolume.toFixed(2)} hl</span></div>
            </div>
          </TabsContent>

          <TabsContent value="table" className="mt-0">
            <div className="flex justify-end mb-3">
              <Button
                variant="outline"
                size="sm"
                disabled={!hasData}
                onClick={() => {
                  const rows = chartData.map(row => ({
                      "Lote": row.lote,
                      "Receta": row.receta,
                      "Equipo": row.equipo,
                      "Fecha": row.date,
                      "Diferencia (hl)": row.volumen
                    }));
                  rows.push({ "Lote": "", "Receta": "", "Equipo": "", "Fecha": "", "Diferencia (hl)": "" as any });
                  rows.push({ "Lote": "PROMEDIO", "Receta": "", "Equipo": "", "Fecha": "", "Diferencia (hl)": parseFloat(averageVolume.toFixed(2)) });
                  const ws = XLSX.utils.json_to_sheet(rows);
                  const wb = XLSX.utils.book_new();
                  XLSX.utils.book_append_sheet(wb, ws, "Última Agua");
                  const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
                  saveAs(new Blob([buf], { type: "application/octet-stream" }), "ultima_agua_reporte.xlsx");
                }}
                className="bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-cyan-400 gap-2"
              >
                <Download className="h-4 w-4" />
                Exportar Excel
              </Button>
            </div>
            <div className="rounded-xl border border-slate-800/50 overflow-hidden bg-slate-950/40">
              <div className="max-h-[440px] overflow-auto">
                <Table>
                  <TableHeader className="bg-slate-900 sticky top-0 z-10">
                    <TableRow className="border-slate-800 hover:bg-transparent">
                      <TableHead className="text-slate-400 font-bold whitespace-nowrap">Lote</TableHead>
                      <TableHead className="text-slate-400 font-bold whitespace-nowrap">Receta</TableHead>
                      <TableHead className="text-slate-400 font-bold whitespace-nowrap">Equipo</TableHead>
                      <TableHead className="text-slate-400 font-bold whitespace-nowrap">Fecha</TableHead>
                      <TableHead className="text-right text-cyan-400 font-bold whitespace-nowrap">Diferencia (hl)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {hasData ? chartData.map((row, idx) => (
                      <TableRow key={`${row.lote}-${idx}`} className="border-slate-800/50 hover:bg-slate-800/30">
                        <TableCell className="font-medium text-slate-300">{row.lote}</TableCell>
                        <TableCell className="text-slate-400">{row.receta}</TableCell>
                        <TableCell className="text-slate-400">{row.equipo}</TableCell>
                        <TableCell className="text-slate-500 text-xs">{row.date}</TableCell>
                        <TableCell className="text-right font-mono text-cyan-400">{row.volumen.toFixed(2)}</TableCell>
                      </TableRow>
                    )) : (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center text-slate-500">
                          Sin datos para mostrar
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                  {hasData && (
                    <tfoot>
                      <TableRow className="border-t-2 border-amber-500/30 bg-slate-900/80">
                        <TableCell colSpan={4} className="font-bold text-amber-400 text-sm">
                          Promedio
                        </TableCell>
                        <TableCell className="text-right font-mono font-bold text-amber-400 text-sm">
                          {averageVolume.toFixed(2)} hl
                        </TableCell>
                      </TableRow>
                    </tfoot>
                  )}
                </Table>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
