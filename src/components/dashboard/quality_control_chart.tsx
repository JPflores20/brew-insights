import { useState, useMemo, useEffect } from "react";
import { BatchRecord } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Activity } from "lucide-react";
import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceArea
} from "recharts";
import { ChartTooltip } from "@/components/ui/chart_tooltip";
interface QualityControlChartProps {
  data: BatchRecord[];
}
import { extractProductParams, calculateControlChartData } from "@/utils/math_utils";
export function QualityControlChart({ data }: QualityControlChartProps) {
  const { products, productParamsMap } = useMemo(() => {
    return extractProductParams(data);
  }, [data]);
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [selectedParam, setSelectedParam] = useState<string>("");
  useEffect(() => {
      if (!selectedProduct && products.length > 0) {
          setSelectedProduct(products[0]);
      }
  }, [products, selectedProduct]);
  const availableParams = useMemo(() => {
      if (!selectedProduct || !productParamsMap.has(selectedProduct)) return [];
      return productParamsMap.get(selectedProduct)!;
  }, [selectedProduct, productParamsMap]);
  useEffect(() => {
      if (selectedProduct && availableParams.length > 0) {
          if (!selectedParam || !availableParams.includes(selectedParam)) {
              const match = availableParams.find(p => p.toLowerCase().includes('temp') || p.toLowerCase().includes('pres'));
              setSelectedParam(match || availableParams[0]);
          }
      }
  }, [selectedProduct, availableParams, selectedParam]);
  const chartInfo = useMemo(() => {
    return calculateControlChartData(data, selectedProduct, selectedParam);
  }, [data, selectedProduct, selectedParam]);
  const formatParamName = (raw: string) => {
      if (!raw) return "";
      return raw.replace(" ::: ", " en ");
  }
  const renderDot = (props: any) => {
      const { cx, cy, payload, key } = props;
      if (payload.isAnomaly) {
          return (
              <circle key={key} cx={cx} cy={cy} r={6} fill="hsl(var(--destructive))" stroke="hsl(var(--background))" strokeWidth={2} />
          );
      }
      return <circle key={key} cx={cx} cy={cy} r={4} fill="hsl(var(--primary))" stroke="none" />;
  };
  const yDomain = useMemo(() => {
    if (!chartInfo.stats) return ['auto', 'auto'];
    const { UCL, LCL } = chartInfo.stats;
    const padding = (UCL - LCL) * 0.2; 
    const safePad = padding === 0 ? 5 : padding;
    return [
        (dataMin: number) => Math.floor(Math.min(dataMin, LCL - safePad)),
        (dataMax: number) => Math.ceil(Math.max(dataMax, UCL + safePad))
    ];
  }, [chartInfo.stats]);
  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-6">
            <Card className="bg-card shadow-sm border-border">
                <CardHeader>
                    <CardTitle className="text-lg">Filtros de Control</CardTitle>
                    <CardDescription>
                        Selecciona el producto y el parámetro físico a analizar.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">Producto / Receta</label>
                        <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                            <SelectTrigger>
                                <SelectValue placeholder="Producto" />
                            </SelectTrigger>
                            <SelectContent>
                                {products.map(m => (
                                    <SelectItem key={m} value={m}>{m}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">Parámetro DFM (Paso)</label>
                        <Select value={selectedParam} onValueChange={setSelectedParam}>
                            <SelectTrigger>
                                <SelectValue placeholder="Parámetro a la vez..." />
                            </SelectTrigger>
                            <SelectContent>
                                {availableParams.map(s => (
                                    <SelectItem key={s} value={s}>{formatParamName(s)}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>
            {chartInfo.stats && (
                <Card className="bg-card shadow-sm border-border">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex justify-between items-center">
                            Estadísticas
                            <Activity className="w-4 h-4 text-muted-foreground" />
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs text-muted-foreground uppercase">Muestras (n)</p>
                                <p className="text-xl font-bold">{chartInfo.stats.count}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground uppercase">Desv. Std (σ)</p>
                                <p className="text-xl font-bold">{chartInfo.stats.sigma.toFixed(3)}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground uppercase">Media (μ)</p>
                                <p className="text-xl font-bold">{chartInfo.stats.mean.toFixed(2)}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground uppercase">Anomalías</p>
                                <div className="flex items-center gap-2">
                                    <p className={`text-xl font-bold ${chartInfo.outOfControlCount > 0 ? "text-destructive" : "text-green-500"}`}>
                                        {chartInfo.outOfControlCount}
                                    </p>
                                </div>
                            </div>
                        </div>
                        {chartInfo.outOfControlCount > 0 ? (
                            <Badge variant="outline" className="w-full justify-center bg-red-500/10 text-red-600 border-red-500/20 py-1">
                                Proceso Fuera de Control
                            </Badge>
                        ) : (
                            <Badge variant="outline" className="w-full justify-center bg-green-500/10 text-green-600 border-green-500/20 py-1">
                                Proceso 6-Sigma Estable
                            </Badge>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
        <div className="lg:col-span-3">
            <Card className="bg-card shadow-sm border-border h-full flex flex-col">
            <CardHeader>
                <CardTitle className="text-xl font-semibold text-foreground">Gráfico de Control Individual (I-Chart)</CardTitle>
                <CardDescription>
                    Monitoreo de la estabilidad del proceso. Puntos rojos indican lotes fuera del rango ±3 Sigma (Límites Estadísticos).
                </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 min-h-[400px]">
                {chartInfo.items.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart
                            data={chartInfo.items}
                            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} vertical={false}/>
                            <XAxis
                                dataKey="batchId"
                                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                                axisLine={{ stroke: 'hsl(var(--border))' }}
                                tickLine={false}
                            />
                            <YAxis
                                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                                axisLine={false}
                                tickLine={false}
                                domain={yDomain as any}
                            />
                            <Tooltip content={<ChartTooltip indicator="line" />} cursor={{ stroke: 'hsl(var(--muted))', strokeWidth: 1 }} />
                            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                            <ReferenceArea 
                                y1={chartInfo.stats?.LCL} 
                                y2={chartInfo.stats?.UCL} 
                                fill="hsl(var(--primary))" 
                                fillOpacity={0.03} 
                                strokeOpacity={0} 
                            />
                            {}
                            <Line
                                type="step"
                                dataKey="Media"
                                stroke="hsl(var(--chart-1))"
                                strokeWidth={2}
                                dot={false}
                                activeDot={false}
                            />
                            <Line
                                type="step"
                                dataKey="LCS (+3σ)"
                                stroke="hsl(var(--destructive)/0.5)"
                                strokeWidth={1}
                                strokeDasharray="5 5"
                                dot={false}
                                activeDot={false}
                            />
                            <Line
                                type="step"
                                dataKey="LCI (-3σ)"
                                stroke="hsl(var(--destructive)/0.5)"
                                strokeWidth={1}
                                strokeDasharray="5 5"
                                dot={false}
                                activeDot={false}
                            />
                            {}
                            <Line
                                type="monotone"
                                dataKey="Valor Real"
                                stroke="hsl(var(--foreground))"
                                strokeWidth={2}
                                dot={renderDot}
                                activeDot={{ r: 6, stroke: 'hsl(var(--background))', strokeWidth: 2 }}
                            />
                        </ComposedChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="flex items-center justify-center h-full w-full text-muted-foreground border border-dashed rounded-lg bg-muted/10">
                        No hay suficientes datos paramétricos para trazar el control de este producto.
                    </div>
                )}
            </CardContent>
            </Card>
        </div>
    </div>
  );
}
