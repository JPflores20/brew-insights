
import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Activity, Thermometer, Droplets, FlaskConical } from "lucide-react";
import { ChartTooltip } from "@/components/ui/chart_tooltip";

interface Step {
  name: string;
  fullName: string;
  hour: number;
  duration: number;
}

interface FermentationChartProps {
  data: any[];
  tankName: string;
  steps?: Step[];
}

export function FermentationChart({ data, tankName, steps = [] }: FermentationChartProps) {
  // Configurar las series dinámicamente según lo que venga en los datos
  const series = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    // Encontrar todas las llaves de parámetros
    const allKeys = new Set<string>();
    data.forEach(d => {
      Object.keys(d).forEach(k => {
        const lowerK = k.toLowerCase();
        const isExcluded = ['time', 'displayTime', 'batch', 'product', 'timestamp', 'units', 'hour', 'multibatch'].includes(lowerK) || lowerK.includes('indice');
        if (!isExcluded && typeof d[k] === 'number') {
          allKeys.add(k);
        }
      });
    });

    const baseConfig: Record<string, { name: string, color: string, yAxisId: string, dash?: string }> = {
      'Extracto (Plato)': { name: 'Plato/EMO', color: '#f59e0b', yAxisId: 'left' },
      'Temp. Tanque': { name: 'Temp. Tanque', color: '#8b5cf6', yAxisId: 'left' },
      'Temp. Consigna': { name: 'Temp. Consigna', color: '#6366f1', yAxisId: 'left', dash: '5 5' },
      'pH': { name: 'pH', color: '#10b981', yAxisId: 'right' },
    };

    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#14b8a6', '#f43f5e', '#84cc16'];

    return Array.from(allKeys).map((fullKey, idx) => {
      // Intentar extraer el nombre base y el lote si viene en formato "Param_Batch"
      let name = fullKey;
      let batch = "";
      
      const lastUnderscore = fullKey.lastIndexOf('_');
      if (lastUnderscore > 0) {
        const base = fullKey.substring(0, lastUnderscore);
        const possibleBatch = fullKey.substring(lastUnderscore + 1);
        if (baseConfig[base] || base.includes('Temp') || base.includes('Extracto') || base.includes('pH')) {
          name = base;
          batch = possibleBatch;
        }
      }

      const config = baseConfig[name];
      const unit = data.find(d => d.units?.[fullKey])?.units?.[fullKey] || '';
      
      // Si hay lote, lo añadimos al nombre para la leyenda
      const displayName = batch ? `${config?.name || name} (Lote ${batch})` : (config?.name || name);
      
      // Si estamos en comparación, variamos el color según el lote para distinguirlos
      let color = config?.color || colors[idx % colors.length];
      if (batch) {
        // Generar un color basado en el lote o usar el índice
        const batchIdx = Array.from(allKeys).filter(k => k.startsWith(name)).indexOf(fullKey);
        if (batchIdx > 0) {
           // Oscurecer/aclarar o rotar el color si es el mismo parámetro en diferentes lotes
           // Por simplicidad, usamos la paleta extendida para diferentes lotes del mismo parámetro
           color = colors[(idx) % colors.length];
        }
      }

      return { 
        key: fullKey, 
        name: displayName, 
        baseName: name,
        batch,
        color, 
        yAxisId: config?.yAxisId || (name.toLowerCase().includes('ph') ? 'right' : 'left'),
        dash: config?.dash,
        unit
      };
    }).sort((a, b) => {
      // Priorizar temperatura y plato por nombre base
      const getPriority = (n: string) => {
        if (n.includes('Temp')) return 1;
        if (n.includes('Extracto')) return 2;
        if (n.includes('pH')) return 3;
        return 4;
      };
      const prioA = getPriority(a.baseName);
      const prioB = getPriority(b.baseName);
      if (prioA !== prioB) return prioA - prioB;
      return a.key.localeCompare(b.key);
    });
  }, [data]);

  const hasData = data && data.length > 0;

  return (
    <Card className="bg-slate-900/40 border-slate-800/50 backdrop-blur-md overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Thermometer className="h-5 w-5 text-blue-500" />
              Seguimiento de Temperatura y Etapas
            </CardTitle>
            <CardDescription>Evolución de {tankName} por horas y pasos del proceso</CardDescription>
          </div>
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-[11px] text-purple-500 font-medium">
              <Thermometer className="h-3 w-3" />
              Temperatura
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="h-[450px] pt-4">
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 30, right: 10, left: 0, bottom: 20 }}>
              <defs>
                <linearGradient id="colorPlato" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} opacity={0.5} />
              <XAxis 
                dataKey="hour" 
                type="number"
                domain={[0, 'auto']}
                stroke="#64748b" 
                fontSize={11} 
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
                minTickGap={40}
                label={{ value: 'Tiempo (Horas)', position: 'insideBottom', offset: -10, fill: '#64748b', fontSize: 10 }}
              />
              <YAxis 
                yAxisId="left"
                stroke="#64748b" 
                fontSize={11} 
                tickLine={false}
                axisLine={false}
                label={{ value: '°C / °P', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 10, offset: 10 }}
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                stroke="#10b981" 
                fontSize={11} 
                tickLine={false}
                axisLine={false}
                domain={[3.5, 6]}
                label={{ value: 'pH', angle: 90, position: 'insideRight', fill: '#10b981', fontSize: 10, offset: 10 }}
              />
              <Tooltip 
                content={({ active, payload, label }) => {
                  if (!active || !payload || payload.length === 0) return null;
                  const d = payload[0].payload;
                  const formattedLabel = `${d.displayTime || ''} (H: ${label}h)`;
                  return <ChartTooltip active={active} payload={payload} label={formattedLabel} indicator="dot" />;
                }}
                cursor={{ stroke: '#334155', strokeWidth: 2 }}
              />
              <Legend 
                verticalAlign="top" 
                height={36}
                wrapperStyle={{ paddingTop: '0px', paddingBottom: '20px', fontSize: '11px' }}
              />

              {steps.map((step, idx) => (
                <ReferenceLine
                  key={`step-${idx}`}
                  yAxisId="left"
                  x={step.hour}
                  stroke="#475569"
                  strokeWidth={1}
                  strokeDasharray="3 3"
                  label={{
                    value: step.name,
                    position: 'insideTopLeft',
                    fill: '#94a3b8',
                    fontSize: 9,
                    fontWeight: 'bold',
                    angle: -90,
                    dy: 10,
                    dx: -10
                  }}
                />
              ))}

              {series.map(s => (
                <Line
                  key={s.key}
                  yAxisId={s.yAxisId}
                  type="monotone"
                  dataKey={s.key}
                  name={s.name}
                  unit={s.unit}
                  stroke={s.color}
                  strokeWidth={s.name.includes('Temp') ? 3 : 1.5}
                  strokeDasharray={s.dash}
                  dot={data.length < 40}
                  connectNulls={true}
                  activeDot={{ r: 6, strokeWidth: 0, fill: s.color }}
                  animationDuration={1500}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-2">
            <Activity className="h-10 w-10 opacity-20" />
            <p className="text-sm">No hay datos de fermentación disponibles</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
