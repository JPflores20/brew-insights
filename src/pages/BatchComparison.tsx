import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { ArrowRight } from "lucide-react";
import { useData } from "@/context/DataContext";
import { getUniqueBatchIds, getBatchById, getUniqueMachineGroups } from "@/data/mockData";

export default function BatchComparison() {
  const { data } = useData();
  const batchIds = getUniqueBatchIds(data);
  
  // Estados para selección
  const [batchA, setBatchA] = useState<string>("");
  const [batchB, setBatchB] = useState<string>("");

  // Inicializar selección cuando cargan los datos
  useEffect(() => {
    if (batchIds.length >= 2) {
      setBatchA(batchIds[0]);
      setBatchB(batchIds[1]);
    }
  }, [data]);

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

  // Preparar datos para gráfica
  const comparisonData = machines.map(machineName => {
    const recordA = batchAData.find(d => d.TEILANL_GRUPO === machineName);
    const recordB = batchBData.find(d => d.TEILANL_GRUPO === machineName);
    
    return {
      machine: machineName,
      [batchA]: recordA?.real_total_min || 0,
      [batchB]: recordB?.real_total_min || 0,
    };
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
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
                  <SelectTrigger><SelectValue placeholder="Lote A" /></SelectTrigger>
                  <SelectContent>{batchIds.map(id => <SelectItem key={id} value={id}>{id}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <ArrowRight className="h-6 w-6 text-muted-foreground" />
              <div className="flex-1 w-full">
                <Select value={batchB} onValueChange={setBatchB}>
                  <SelectTrigger><SelectValue placeholder="Lote B" /></SelectTrigger>
                  <SelectContent>{batchIds.map(id => <SelectItem key={id} value={id}>{id}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparisonData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="machine" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey={batchA} fill="#10b981" name={`Lote ${batchA}`} />
                  <Bar dataKey={batchB} fill="#3b82f6" name={`Lote ${batchB}`} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}