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
import { ChartTooltip } from "@/components/ui/ChartTooltip";

interface QualityControlChartProps {
  data: BatchRecord[];
}

export function QualityControlChart({ data }: QualityControlChartProps) {
  
  // Extraer las combinaciones únicas de Receta -> Parámetros
  const { products, productParamsMap } = useMemo(() => {
     const prods = new Set<string>();
     const map = new Map<string, Set<string>>();

     data.forEach(batch => {
         const prod = batch.productName || "Desconocido";
         prods.add(prod);
         
         if (!map.has(prod)) map.set(prod, new Set());
         const currentParams = map.get(prod)!;
         
         batch.parameters.forEach(p => {
             currentParams.add(`${p.name} ::: ${p.stepName}`);
         });
     });

     const processedMap = new Map<string, string[]>();
     map.forEach((params, prod) => {
         processedMap.set(prod, Array.from(params).sort());
     });

     return {
         products: Array.from(prods).sort(),
         productParamsMap: processedMap
     };
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
              // try to default to something interesting like temp
              const match = availableParams.find(p => p.toLowerCase().includes('temp') || p.toLowerCase().includes('pres'));
              setSelectedParam(match || availableParams[0]);
          }
      }
  }, [selectedProduct, availableParams, selectedParam]);


  // Calcular la data de control
  const chartInfo = useMemo(() => {
      if (!selectedProduct || !selectedParam) return { items: [], stats: null, outOfControlCount: 0 };

      const [pName, pStep] = selectedParam.split(" ::: ");
      const sortedData = [...data].sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

      const rawItems: any[] = [];
      const values: number[] = [];

      sortedData.forEach((batch) => {
          if (batch.productName !== selectedProduct) return;
          const param = batch.parameters.find(p => p.name === pName && p.stepName === pStep);
          if (param && typeof param.value === 'number') {
              rawItems.push({
                  batchId: batch.CHARG_NR,
                  value: param.value,
                  target: param.target || null,
                  unit: param.unit || "",
              });
              values.push(param.value);
          }
      });

      if (values.length === 0) return { items: [], stats: null, outOfControlCount: 0 };

      // Calcular Media y Sigma
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / values.length;
      const sigma = Math.sqrt(variance);

      // Límites Six Sigma convencionales (± 3 desviaciones estándar)
      const UCL = mean + 3 * sigma;
      const LCL = mean - 3 * sigma;

      let outOfControlCount = 0;

      const items = rawItems.map(it => {
          const isAnomaly = it.value > UCL || it.value < LCL;
          if (isAnomaly) outOfControlCount++;
          
          return {
              ...it,
              "Valor Real": parseFloat(it.value.toFixed(2)),
              "Media": parseFloat(mean.toFixed(2)),
              "LCS (+3σ)": parseFloat(UCL.toFixed(2)),
              "LCI (-3σ)": parseFloat(LCL.toFixed(2)),
              isAnomaly
          };
      });

      return { 
          items, 
          stats: { mean, sigma, UCL, LCL, count: values.length },
          outOfControlCount
      };

  }, [data, selectedProduct, selectedParam]);


  // Formateador para nombres de parámetros (remover el ::: visualmente)
  const formatParamName = (raw: string) => {
      if (!raw) return "";
      return raw.replace(" ::: ", " en ");
  }

  // Custom dot para colorear rojo si está fuera de control
  const renderDot = (props: any) => {
      const { cx, cy, payload, key } = props;
      if (payload.isAnomaly) {
          return (
              <circle key={key} cx={cx} cy={cy} r={6} fill="hsl(var(--destructive))" stroke="hsl(var(--background))" strokeWidth={2} />
          );
      }
      return <circle key={key} cx={cx} cy={cy} r={4} fill="hsl(var(--primary))" stroke="none" />;
  };

  // Calcular un dominio para Y axis que tenga un poco de padding
  const yDomain = useMemo(() => {
    if (!chartInfo.stats) return ['auto', 'auto'];
    const { UCL, LCL } = chartInfo.stats;
    const padding = (UCL - LCL) * 0.2; // 20% padding
    
    // Si la varianza es extremadamente baja (ej. temperaturas exactas todas las veces), dar un padding artificial
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

                            {/* Líneas de Control */}
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
                            
                            {/* Datos Reales */}
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
