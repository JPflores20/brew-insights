import { useEffect, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { ArrowRight } from "lucide-react";
import { useData } from "@/context/DataContext";
import { getUniqueBatchIds, getBatchById } from "@/data/mockData";
import { useLocalStorage } from "@/hooks/use-local-storage";

export default function BatchComparison() {
  const { data } = useData();
  const batchIds = getUniqueBatchIds(data);
  
  // Mapa auxiliar para obtener nombre de producto rápido (Igual que en MachineDetail)
  const batchProductMap = useMemo(() => {
    const map = new Map<string, string>();
    data.forEach(d => {
        if(d.productName) map.set(d.CHARG_NR, d.productName);
    });
    return map;
  }, [data]);

  // Estados persistentes para la selección
  const [batchA, setBatchA] = useLocalStorage<string>("batch-comparison-a", "");
  const [batchB, setBatchB] = useLocalStorage<string>("batch-comparison-b", "");

  // Lógica inteligente para inicializar
  useEffect(() => {
    if (batchIds.length >= 2) {
      if (!batchA || !batchIds.includes(batchA)) {
        setBatchA(batchIds[0]);
      }
      if (!batchB || !batchIds.includes(batchB)) {
        setBatchB(batchIds[1]);
      }
    }
  }, [batchIds, batchA, batchB, setBatchA, setBatchB]);

  if (data.length === 0) {
    return (
      <DashboardLayout>
        <div className="p-8 text-center text-muted-foreground">
          Por favor carga un archivo Excel en la pestaña "Overview" primero.
        </div>
      </DashboardLayout>
    );
  }

  const batchAData = getBatchById(data, batchA);
  const batchBData = getBatchById(data, batchB);

  // 1. FILTRADO: Solo mostramos máquinas que tengan datos en alguno de los dos lotes
  const relevantMachines = useMemo(() => {
    const machinesA = batchAData.map(d => d.TEILANL_GRUPO);
    const machinesB = batchBData.map(d => d.TEILANL_GRUPO);
    return Array.from(new Set([...machinesA, ...machinesB])).sort();
  }, [batchAData, batchBData]);

  // Preparar datos para gráfica
  const comparisonData = relevantMachines.map(machineName => {
    const recordA = batchAData.find(d => d.TEILANL_GRUPO === machineName);
    const recordB = batchBData.find(d => d.TEILANL_GRUPO === machineName);
    
    return {
      machine: machineName,
      [batchA || 'Lote A']: recordA?.real_total_min || 0,
      [batchB || 'Lote B']: recordB?.real_total_min || 0,
    };
  });

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-in fade-in duration-500">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Comparación de Lotes</h1>
          <p className="text-muted-foreground">Analiza diferencias de tiempo entre dos cocimientos</p>
        </div>

        <Card className="bg-card border-border">
          <CardHeader><CardTitle>Seleccionar Lotes</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="flex-1 w-full">
                <Select value={batchA} onValueChange={setBatchA}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar Lote A" /></SelectTrigger>
                  <SelectContent>
                    {batchIds.map(id => (
                      <SelectItem key={id} value={id}>
                        {id} - {batchProductMap.get(id) || "Sin producto"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <ArrowRight className="h-6 w-6 text-muted-foreground hidden sm:block" />
              <div className="flex-1 w-full">
                <Select value={batchB} onValueChange={setBatchB}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar Lote B" /></SelectTrigger>
                  <SelectContent>
                    {batchIds.map(id => (
                      <SelectItem key={id} value={id}>
                        {id} - {batchProductMap.get(id) || "Sin producto"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {batchA && batchB && (
          <Card className="bg-card border-border">
            <CardContent className="pt-6">
              {/* Aumentamos un poco la altura para dar espacio a los textos rotados */}
              <div className="h-[500px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={comparisonData} 
                    margin={{ top: 20, right: 30, left: 20, bottom: 80 }} // Aumentamos margen inferior (bottom)
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                    
                    {/* Rotación de textos en eje X */}
                    <XAxis 
                        dataKey="machine" 
                        tick={{ 
                            fill: 'hsl(var(--muted-foreground))',
                            fontSize: 12 
                        }} 
                        axisLine={{ stroke: 'hsl(var(--border))' }}
                        interval={0} // Muestra todas las etiquetas
                        angle={-45}  // Rota el texto 45 grados
                        textAnchor="end" // Alinea el final del texto con la marca
                        height={80} // Altura extra para que quepan
                    />
                    
                    <YAxis 
                        label={{ value: 'Minutos', angle: -90, position: 'insideLeft', fill: 'hsl(var(--muted-foreground))' }}
                        tick={{ fill: 'hsl(var(--muted-foreground))' }} 
                        axisLine={false}
                    />
                    <Tooltip 
                        contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--popover-foreground))' }}
                        cursor={{ fill: 'hsl(var(--muted)/0.2)' }}
                    />
                    <Legend wrapperStyle={{ paddingTop: '20px' }}/>
                    <Bar 
                      dataKey={batchA} 
                      fill="hsl(var(--primary))" 
                      name={`Lote ${batchA} (${batchProductMap.get(batchA) || ''})`} 
                      radius={[4, 4, 0, 0]} 
                    />
                    <Bar 
                      dataKey={batchB} 
                      fill="hsl(var(--chart-real))" 
                      name={`Lote ${batchB} (${batchProductMap.get(batchB) || ''})`} 
                      radius={[4, 4, 0, 0]} 
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}