import { useState, useMemo, useEffect } from "react";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  ReferenceLine
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePickerWithRange } from "@/components/ui/date_range_picker";
import { ChartTooltip } from "@/components/ui/chart_tooltip";
import { Thermometer, Activity, Calendar, Filter } from "lucide-react";
import { format, startOfDay, endOfDay } from "date-fns";
import { es } from "date-fns/locale";
import { useData } from "@/context/data_context";
import { DateRange } from "react-day-picker";

export function SimpleFermentationChart() {
  const { coldBlockData } = useData();
  const [selectedTank, setSelectedTank] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  // 1. Extraer tanques únicos
  const tanks = useMemo(() => {
    const tankNames = new Set(coldBlockData.map(d => d.TEILANL_GRUPO));
    const sorted = Array.from(tankNames).sort();
    if (sorted.length > 0 && !selectedTank) {
      setSelectedTank(sorted[0]);
    }
    return sorted;
  }, [coldBlockData, selectedTank]);

  // 2. Determinar rango de fechas disponibles para el tanque seleccionado
  const availableDateRange = useMemo(() => {
    if (!selectedTank) return { min: undefined, max: undefined };

    const tankRecords = coldBlockData.filter(d => d.TEILANL_GRUPO === selectedTank);
    const allDates = tankRecords
      .flatMap(d => d.parameters)
      .map(p => p.timestamp ? new Date(p.timestamp).getTime() : null)
      .filter((t): t is number => t !== null);
    
    if (allDates.length === 0) return { min: undefined, max: undefined };
    
    return {
      min: new Date(Math.min(...allDates)),
      max: new Date(Math.max(...allDates))
    };
  }, [coldBlockData, selectedTank]);

  // Resetear el rango de fechas si se sale de los límites del nuevo tanque
  useEffect(() => {
    if (dateRange?.from && availableDateRange.min && availableDateRange.max) {
      // Check if the 'from' date of the selected range is outside the available range
      if (dateRange.from < availableDateRange.min || dateRange.from > availableDateRange.max) {
        setDateRange(undefined);
      }
    }
  }, [selectedTank, availableDateRange, dateRange, setDateRange]);

  // 3. Preparar datos para la gráfica
  const chartData = useMemo(() => {
    if (!selectedTank) return [];

    // Filtrar por tanque
    const tankRecords = coldBlockData.filter(d => d.TEILANL_GRUPO === selectedTank);
    
    // Extraer parámetros de temperatura
    let points = tankRecords.flatMap(record => 
      record.parameters
        .filter(p => p.name === 'Temp. Tanque')
        .map(p => ({
          timestamp: new Date(p.timestamp!).getTime(),
          displayTime: format(new Date(p.timestamp!), "dd/MM HH:mm", { locale: es }),
          fullTime: format(new Date(p.timestamp!), "dd/MM/yyyy HH:mm", { locale: es }),
          value: p.value,
          batch: record.CHARG_NR,
          product: record.productName
        }))
    );

    // Filtrar por fecha si hay rango seleccionado
    if (dateRange?.from) {
      const start = startOfDay(dateRange.from).getTime();
      const end = dateRange.to ? endOfDay(dateRange.to).getTime() : endOfDay(dateRange.from).getTime();
      points = points.filter(p => p.timestamp >= start && p.timestamp <= end);
    }

    // Ordenar por tiempo absoluto
    return points.sort((a, b) => a.timestamp - b.timestamp);
  }, [coldBlockData, selectedTank, dateRange]);

  if (tanks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] bg-slate-900/20 rounded-2xl border border-slate-800/50 border-dashed text-center p-8">
        <Thermometer className="h-12 w-12 text-slate-500 mb-4 opacity-30" />
        <h3 className="text-lg font-medium text-slate-300">No se detectaron datos de tanques</h3>
        <p className="text-sm text-slate-500 max-w-sm mt-1">
          Carga archivos DBF de Bloque Frío para comenzar el análisis.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters Section */}
      <div className="flex flex-wrap items-center gap-4 bg-slate-900/40 p-4 rounded-xl border border-slate-800/50 backdrop-blur-sm">
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold ml-1">Tanque (TEILANL)</span>
          <Select value={selectedTank || ""} onValueChange={setSelectedTank}>
            <SelectTrigger className="w-[200px] bg-slate-900/50 border-slate-700 h-9 text-xs">
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
          <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold ml-1">Rango de Fechas</span>
          <DatePickerWithRange 
            date={dateRange} 
            setDate={setDateRange} 
            minDate={availableDateRange.min}
            maxDate={availableDateRange.max}
            className="h-9"
          />
        </div>

        <div className="flex items-center gap-2 px-3 py-2 mt-auto rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs h-9">
          <Activity className="h-3.5 w-3.5" />
          <span>{chartData.length} Puntos de datos</span>
        </div>
      </div>

      {/* Chart Section */}
      <Card className="bg-slate-900/40 border-slate-800/50 backdrop-blur-md overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Thermometer className="h-5 w-5 text-blue-500" />
                Historial de Temperatura - {selectedTank}
              </CardTitle>
              <CardDescription>Seguimiento continuo de la temperatura en el tiempo</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="h-[500px] pt-4">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} opacity={0.5} />
                <XAxis 
                  dataKey="timestamp" 
                  type="number"
                  domain={['dataMin', 'dataMax']}
                  scale="time"
                  stroke="#64748b" 
                  fontSize={10} 
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(unixTime) => format(new Date(unixTime), "dd/MM HH:mm", { locale: es })}
                  minTickGap={50}
                />
                <YAxis 
                  stroke="#64748b" 
                  fontSize={11} 
                  tickLine={false}
                  axisLine={false}
                  label={{ value: '°C', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 10, offset: 10 }}
                  domain={['auto', 'auto']}
                />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (!active || !payload || payload.length === 0) return null;
                    const d = payload[0].payload;
                    return (
                      <div className="bg-slate-900/95 border border-slate-800 p-3 rounded-lg shadow-xl backdrop-blur-md">
                        <p className="text-[10px] uppercase font-bold text-slate-500 mb-2">{d.fullTime}</p>
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-xs text-slate-300">Temperatura:</span>
                            <span className="text-xs font-bold text-blue-400">{d.value.toFixed(1)} °C</span>
                          </div>
                          <div className="flex items-center justify-between gap-4 border-t border-slate-800 pt-1.5 mt-1.5">
                            <span className="text-[10px] text-slate-500 italic">Batch: {d.batch}</span>
                            <span className="text-[10px] text-slate-500 italic truncate max-w-[100px]">{d.product}</span>
                          </div>
                        </div>
                      </div>
                    );
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  name="Temperatura"
                  stroke="#3b82f6"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5, strokeWidth: 0, fill: '#3b82f6' }}
                  animationDuration={1000}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-2">
              <Activity className="h-10 w-10 opacity-20" />
              <p className="text-sm">No hay datos de temperatura para los filtros seleccionados</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
