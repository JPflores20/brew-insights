
import { useMemo, useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard_layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useData } from "@/context/data_context";
import { AnimatedPage } from "@/components/layout/animated_page";
import { BetaPageBanner } from "@/components/ui/beta_page_banner";
import { MetricCard } from "@/components/ui/metric_card";
import { Activity, Clock, Timer, Info } from "lucide-react";
import { format, parseISO, differenceInMinutes } from "date-fns";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function Indicadores() {
  const { data } = useData();
  const [selectedBatchId, setSelectedBatchId] = useState<string>("");

  const uniqueBatches = useMemo(() => {
    const ids = Array.from(new Set(data.map((d) => d.CHARG_NR))).sort();
    return ids;
  }, [data]);

  // Auto-select first batch if none selected
  useMemo(() => {
    if (!selectedBatchId && uniqueBatches.length > 0) {
      setSelectedBatchId(uniqueBatches[0]);
    }
  }, [uniqueBatches, selectedBatchId]);

  const bpiData = useMemo(() => {
    if (!data || data.length === 0) return null;

    // Filter and find the required steps for each batch
    const batchesWithSteps = uniqueBatches.map(id => {
      const records = data.filter(d => d.CHARG_NR === id);
      let aguaMostoStart: Date | null = null;
      let calentarFlujoStart: Date | null = null;
      
      for (const record of records) {
        if (!aguaMostoStart) {
          const step = record.steps?.find(s => 
            s.stepName.toLowerCase().includes("agua") && 
            s.stepName.toLowerCase().includes("mosto")
          );
          if (step && step.startTime) aguaMostoStart = parseISO(step.startTime);
        }
        
        if (!calentarFlujoStart) {
          const step = record.steps?.find(s => 
            s.stepName.toLowerCase().includes("calentar") && 
            s.stepName.toLowerCase().includes("flujo")
          );
          if (step && step.startTime) calentarFlujoStart = parseISO(step.startTime);
        }
      }
      
      return { id, aguaMostoStart, calentarFlujoStart };
    })
    .sort((a, b) => {
      // Sort by any available start time to establish chronological order
      const timeA = a.aguaMostoStart?.getTime() || a.calentarFlujoStart?.getTime() || 0;
      const timeB = b.aguaMostoStart?.getTime() || b.calentarFlujoStart?.getTime() || 0;
      return timeA - timeB;
    });

    const currentIndex = batchesWithSteps.findIndex(b => b.id === selectedBatchId);
    if (currentIndex === -1) return null;

    const currentBatch = batchesWithSteps[currentIndex];
    const prevBatch = currentIndex > 0 ? batchesWithSteps[currentIndex - 1] : null;

    let bpiValue: number | null = null;
    // BPI logic clarified: StartTime(Agua Mosto, CurrentBatch) - StartTime(Calentar_Flujo, PreviousBatch)
    if (prevBatch && currentBatch.aguaMostoStart && prevBatch.calentarFlujoStart) {
      bpiValue = differenceInMinutes(currentBatch.aguaMostoStart, prevBatch.calentarFlujoStart);
    }

    return {
      value: bpiValue,
      currentStart: currentBatch.aguaMostoStart,
      prevStart: prevBatch?.calentarFlujoStart,
      prevId: prevBatch?.id,
      missingCurrent: !currentBatch.aguaMostoStart,
      missingPrevStep: prevBatch && !prevBatch.calentarFlujoStart
    };
  }, [data, selectedBatchId, uniqueBatches]);

  return (
    <DashboardLayout>
      <AnimatedPage className="space-y-6 pb-10">
        <BetaPageBanner />
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Indicadores de Desempeño</h1>
            <p className="text-muted-foreground mt-1">Monitoreo de métricas clave del proceso (KPIs).</p>
          </div>
        </div>

        <Card className="bg-card/50 backdrop-blur-sm border-border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Filtros de Análisis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="w-full sm:w-[300px] space-y-1.5">
                <Label htmlFor="batch-select">Lote / Cocimiento</Label>
                <Select value={selectedBatchId} onValueChange={setSelectedBatchId}>
                  <SelectTrigger id="batch-select" className="bg-background/50">
                    <SelectValue placeholder="Selecciona un lote" />
                  </SelectTrigger>
                  <SelectContent>
                    {uniqueBatches.map((id) => (
                      <SelectItem key={id} value={id}>
                        Lote: {id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-3">
          <MetricCard
            title="BPI (Batch Process Interval)"
            value={bpiData?.value !== null && bpiData?.value !== undefined ? `${bpiData.value} min` : "N/A"}
            subtitle={bpiData?.prevId ? `Vs lote anterior: ${bpiData.prevId}` : "Primer lote en secuencia"}
            icon={Timer}
            className="border-l-4 border-l-primary"
          />
        </div>

        {bpiData && (
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border-border bg-card/30">
              <CardHeader>
                <CardTitle className="text-md flex items-center gap-2 text-primary">
                  <Info className="h-4 w-4" />
                  Detalle del Indicador BPI
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <p>
                  El <strong>BPI</strong> mide el intervalo de tiempo transcurrido desde que se inicia el paso 
                  <span className="text-secondary font-medium"> "Calentar_Flujo" </span> en el lote anterior hasta que se inicia el paso 
                  <span className="text-primary font-medium"> "Agua Mosto" </span> en el lote seleccionado.
                </p>
                <div className="space-y-2 pt-2 border-t border-border/50">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Inicio Agua Mosto (Lote {selectedBatchId}):</span>
                    <span className="font-mono">{bpiData.currentStart ? format(bpiData.currentStart, "HH:mm:ss (dd/MM)") : "---"}</span>
                  </div>
                  {bpiData.prevId && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Inicio Calentar_Flujo (Lote {bpiData.prevId}):</span>
                      <span className="font-mono">{bpiData.prevStart ? format(bpiData.prevStart, "HH:mm:ss (dd/MM)") : "---"}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {bpiData?.missingCurrent && selectedBatchId && (
          <Alert variant="destructive" className="glass">
            <Info className="h-4 w-4" />
            <AlertTitle>Datos Insuficientes (Lote Actual)</AlertTitle>
            <AlertDescription>
              No se encontró el paso "Agua Mosto" en los datos del lote seleccionado.
            </AlertDescription>
          </Alert>
        )}

        {bpiData?.missingPrevStep && bpiData.prevId && (
          <Alert variant="default" className="glass border-yellow-500/50 bg-yellow-500/10 text-yellow-500">
            <Info className="h-4 w-4" />
            <AlertTitle>Datos Insuficientes (Lote Anterior)</AlertTitle>
            <AlertDescription>
              No se encontró el paso "Calentar_Flujo" en el lote anterior ({bpiData.prevId}).
            </AlertDescription>
          </Alert>
        )}
      </AnimatedPage>
    </DashboardLayout>
  );
}
