import { useEffect } from "react"; // Quitamos useState
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { ArrowRight } from "lucide-react";
import { useData } from "@/context/DataContext";
import { getUniqueBatchIds, getBatchById, getUniqueMachineGroups } from "@/data/mockData";
import { useLocalStorage } from "@/hooks/use-local-storage"; // Importamos el hook

export default function BatchComparison() {
  const { data } = useData();
  const batchIds = getUniqueBatchIds(data);
  
  // CAMBIO: Estados persistentes para la selección
  const [batchA, setBatchA] = useLocalStorage<string>("batch-comparison-a", "");
  const [batchB, setBatchB] = useLocalStorage<string>("batch-comparison-b", "");

  // Lógica inteligente para inicializar
  useEffect(() => {
    if (batchIds.length >= 2) {
      // Solo reseteamos si no hay nada guardado O si lo guardado ya no existe en los datos
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
  const machines = getUniqueMachineGroups(data);

  // Preparar datos para gráfica (Esto crea un array con la comparación)
  const comparisonData = machines.map(machineName => {
    const recordA = batchAData.find(d => d.TEILANL_GRUPO === machineName);
    const recordB = batchBData.find(d => d.TEILANL_GRUPO === machineName);
    
    // Si no hay dato, usamos 0 para que la gráfica no falle
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
                    {batchIds.map(id => <SelectItem key={id} value={id}>{id}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <ArrowRight className="h-6 w-6 text-muted-foreground hidden sm:block" />
              <div className="flex-1 w-full">
                <Select value={batchB} onValueChange={setBatchB}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar Lote B" /></SelectTrigger>
                  <SelectContent>
                    {batchIds.map(id => <SelectItem key={id} value={id}>{id}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {batchA && batchB && (
          <Card className="bg-card border-border">
            <CardContent className="pt-6">
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={comparisonData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                    <XAxis 
                        dataKey="machine" 
                        tick={{ fill: 'hsl(var(--muted-foreground))' }} 
                        axisLine={{ stroke: 'hsl(var(--border))' }}
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
                    <Bar dataKey={batchA} fill="hsl(var(--primary))" name={`Lote ${batchA}`} radius={[4, 4, 0, 0]} />
                    <Bar dataKey={batchB} fill="hsl(var(--chart-real))" name={`Lote ${batchB}`} radius={[4, 4, 0, 0]} />
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