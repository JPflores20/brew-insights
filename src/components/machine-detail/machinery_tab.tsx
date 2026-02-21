import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { BatchRecord } from "@/data/mock_data";
import { motion } from "framer-motion";
import { Clock } from "lucide-react";
interface MachineryTabProps {
  data: BatchRecord[];
  selectedBatchId: string;
}
export function MachineryTab({ data, selectedBatchId }: MachineryTabProps) {
  const batchRecords = useMemo(() => {
    return data.filter((d) => d.CHARG_NR === selectedBatchId);
  }, [data, selectedBatchId]);
  const filterRecord = batchRecords.find((r) =>
    r.TEILANL_GRUPO.toLowerCase().includes("filtro")
  );
  const maceratorRecord = batchRecords.find((r) =>
    r.TEILANL_GRUPO.toLowerCase().includes("macerador")
  );
  const filterSteps = filterRecord?.steps || [];
  const startStepName = "PRIMER MOSTO new";
  const startIndex = filterSteps.findIndex((s) => s.stepName.toLowerCase() === startStepName.toLowerCase());
  const endStepOptions = useMemo(() => {
    if (startIndex === -1) return [];
    return filterSteps.slice(startIndex + 1).map((s, idx) => ({
        stepName: s.stepName,
        index: startIndex + 1 + idx 
    }));
  }, [filterSteps, startIndex]);
  const [selectedEndStepIndex, setSelectedEndStepIndex] = useState<string>("");
  const filterTotalTime = useMemo(() => {
    if (startIndex === -1 || !selectedEndStepIndex) return 0;
    const endIndex = parseInt(selectedEndStepIndex, 10);
    if (isNaN(endIndex) || endIndex <= startIndex) return 0;
    let total = 0;
    for (let i = startIndex; i <= endIndex; i++) {
        total += filterSteps[i].durationMin;
    }
    return total;
  }, [filterSteps, startIndex, selectedEndStepIndex]);
  const recibirCocedorTime = useMemo(() => {
    if (!maceratorRecord?.steps) return "N/A";
    const step = maceratorRecord.steps.find(
      (s) => s.stepName.toLowerCase() === "recibir cocedor"
    );
    return step ? `${step.durationMin} min` : "N/A"; 
  }, [maceratorRecord]);
  const pauseDetails = useMemo(() => {
    const steps = maceratorRecord?.steps || [];
    const normalize = (s: string) => s.toLowerCase().trim();
    const startPauseIndex = steps.findIndex((s) => normalize(s.stepName).includes("control temp"));
    const endPauseIndex = steps.findIndex((s) => normalize(s.stepName).includes("cont. conversion") || normalize(s.stepName).includes("cont. conversión"));
    if (startPauseIndex === -1 || endPauseIndex === -1 || startPauseIndex >= endPauseIndex) {
        return {
            duration: 0,
            valid: false,
            startFound: startPauseIndex !== -1 ? steps[startPauseIndex].stepName : "NO ENCONTRADO (Buscado: 'control temp')",
            endFound: endPauseIndex !== -1 ? steps[endPauseIndex].stepName : "NO ENCONTRADO (Buscado: 'cont. conversion')",
            allSteps: steps.map(s => s.stepName).join(", "),
            includedSteps: []
        };
    }
    let targetStep = null;
    for (let i = startPauseIndex + 1; i < endPauseIndex; i++) {
        if (normalize(steps[i].stepName).includes("pausa")) {
            targetStep = steps[i];
            break; 
        }
    }
    if (!targetStep) {
         return {
            duration: 0,
            valid: false,
            message: "No se encontró un paso llamado 'Pausa' en el rango.",
            startFound: steps[startPauseIndex].stepName,
            endFound: steps[endPauseIndex].stepName,
            allSteps: steps.map(s => s.stepName).join(", "),
            includedSteps: []
        };
    }
    return {
        duration: targetStep.durationMin,
        valid: true,
        startFound: steps[startPauseIndex].stepName,
        endFound: steps[endPauseIndex].stepName,
        includedSteps: [{ name: targetStep.stepName, dur: targetStep.durationMin }]
    };
  }, [maceratorRecord]);
  const [maceratorStartIndex, setMaceratorStartIndex] = useState<string>("");
  const [maceratorEndIndex, setMaceratorEndIndex] = useState<string>("");
  const maceratorSteps = maceratorRecord?.steps || [];
  const maceratorStepOptions = useMemo(() => {
     return maceratorSteps.map((s, idx) => ({
         stepName: s.stepName,
         index: idx
     }));
  }, [maceratorSteps]);
  const maceratorCalculatedTime = useMemo(() => {
      const start = parseInt(maceratorStartIndex, 10);
      const end = parseInt(maceratorEndIndex, 10);
      if (isNaN(start) || isNaN(end) || start > end) {
          return { duration: 0, valid: false };
      }
      let total = 0;
      for (let i = start; i <= end; i++) {
        total += maceratorSteps[i].durationMin;
      }
      return { duration: total, valid: true };
  }, [maceratorSteps, maceratorStartIndex, maceratorEndIndex]);
  const conversionTemp = useMemo(() => {
      if (!maceratorRecord?.parameters) return "N/A";
      const normalize = (s: string) => s.toLowerCase().trim();
      const param = maceratorRecord.parameters.find(p => 
          (normalize(p.stepName).includes("cont. conversion") || normalize(p.stepName).includes("cont. conversión")) && 
          (p.name.toLowerCase().includes("temp") || p.unit.toLowerCase().includes("c"))
      );
      return param ? `${param.value} ${param.unit}` : "N/A";
  }, [maceratorRecord]);
  if (!selectedBatchId) {
      return (
          <div className="flex flex-col items-center justify-center p-8 text-center bg-muted/20 rounded-lg border border-dashed">
              <p className="text-muted-foreground">Selecciona un lote para ver la información de maquinaria.</p>
          </div>
      )
  }
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {}
        <Card>
          <CardHeader className="pb-4">
             <div className="flex justify-between items-center">
                <CardTitle className="text-lg flex items-center gap-2">
                <Badge variant="outline">Filtro</Badge>
                Tiempo Total Real
                </CardTitle>
            </div>
            <p className="text-sm text-muted-foreground">
                Cálculo de tiempo desde <strong>{startStepName}</strong>
            </p>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="space-y-3">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Hasta el paso:
              </label>
              <Select
                value={selectedEndStepIndex}
                onValueChange={setSelectedEndStepIndex}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecciona paso final..." />
                </SelectTrigger>
                <SelectContent>
                  {endStepOptions.length > 0 ? (
                    endStepOptions.map((opt) => (
                        <SelectItem key={`${opt.index}-${opt.stepName}`} value={opt.index.toString()}>
                        {opt.stepName} <span className="text-xs text-muted-foreground ml-2">(Paso {opt.index + 1})</span>
                        </SelectItem>
                    ))
                  ) : (
                    <div className="p-2 text-sm text-muted-foreground text-center">
                        No hay pasos disponibles o no se encontró el paso inicial.
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="bg-muted/30 p-4 rounded-lg border flex items-baseline justify-between">
                <span className="text-sm font-medium text-muted-foreground">Tiempo Calculado</span>
                <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold font-mono tracking-tight text-primary">
                        {filterTotalTime}
                    </span>
                    <span className="text-sm font-medium text-muted-foreground">min</span>
                </div>
            </div>
             {startIndex === -1 && (
                 <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                 ⚠️ El paso inicial "{startStepName}" no se encontró en este lote.
               </div>
            )}
          </CardContent>
        </Card>
        {}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Badge variant="outline">Macerador</Badge>
              Detalles del Proceso
            </CardTitle>
             <p className="text-sm text-muted-foreground">
                Métricas clave y cálculo de tiempos
            </p>
          </CardHeader>
          <CardContent className="p-4 space-y-6">
            {}
            <div className="space-y-4 border rounded-md p-4 bg-background/50">
                <h4 className="font-medium text-sm text-muted-foreground flex items-center gap-2">
                    <Clock className="w-4 h-4" /> Cálculo de Tiempo (Rango)
                </h4>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-xs font-medium">Desde:</label>
                        <Select
                            value={maceratorStartIndex}
                            onValueChange={setMaceratorStartIndex}
                        >
                            <SelectTrigger className="h-8 text-xs">
                                <SelectValue placeholder="Inicio..." />
                            </SelectTrigger>
                            <SelectContent>
                                {maceratorStepOptions.map((opt) => (
                                    <SelectItem key={`start-${opt.index}`} value={opt.index.toString()} className="text-xs">
                                        {opt.index + 1}. {opt.stepName}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-medium">Hasta:</label>
                        <Select
                            value={maceratorEndIndex}
                            onValueChange={setMaceratorEndIndex}
                        >
                            <SelectTrigger className="h-8 text-xs">
                                <SelectValue placeholder="Fin..." />
                            </SelectTrigger>
                            <SelectContent>
                                {maceratorStepOptions.map((opt) => (
                                    <SelectItem key={`end-${opt.index}`} value={opt.index.toString()} className="text-xs">
                                        {opt.index + 1}. {opt.stepName}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <div className="flex justify-between items-center pt-2 border-t mt-2">
                    <span className="text-sm font-medium">Tiempo Calculado:</span>
                    <span className="font-mono font-bold text-lg text-primary">
                        {maceratorCalculatedTime.valid ? `${maceratorCalculatedTime.duration.toFixed(2)} min` : "—"}
                    </span>
                </div>
            </div>
            <Table>
                <TableBody>
                    <TableRow>
                        <TableCell className="font-medium py-3 text-sm">
                            Tiempo "Recibir Cocedor"
                        </TableCell>
                        <TableCell className="text-right font-mono font-medium text-base py-3 text-foreground/80">
                            {recibirCocedorTime}
                        </TableCell>
                    </TableRow>
                    <TableRow className="border-0">
                        <TableCell className="font-medium py-3 text-sm">
                            Temp. "Cont. Conversión"
                        </TableCell>
                         <TableCell className="text-right font-mono font-medium text-base py-3 text-foreground/80">
                            {conversionTemp}
                        </TableCell>
                    </TableRow>
                </TableBody>
            </Table>
             {(!maceratorRecord) && (
                 <div className="rounded-md bg-muted p-3 text-sm text-center text-muted-foreground">
                 No se encontraron datos para el Macerador en este lote.
               </div>
            )}
          </CardContent>
        </Card>
      </div>
      {}
      <Card>
          <CardHeader className="bg-muted/50 pb-4">
              <CardTitle className="text-lg">Resumen General de Maquinaria</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
              <Table>
                  <TableHeader>
                      <TableRow>
                          <TableHead>Equipo</TableHead>
                          <TableHead>Métrica / Proceso</TableHead>
                          <TableHead className="text-right">Valor</TableHead>
                          <TableHead className="text-right hidden md:table-cell">Detalles Adicionales</TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      {}
                      <TableRow>
                          <TableCell className="font-medium">Filtro</TableCell>
                          <TableCell>Tiempo Total Real</TableCell>
                          <TableCell className="text-right font-mono font-bold">
                              {filterTotalTime > 0 ? `${filterTotalTime} min` : "—"}
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground text-xs hidden md:table-cell">
                              Desde "{startStepName}" hasta "{selectedEndStepIndex ? endStepOptions.find(o => o.index.toString() === selectedEndStepIndex)?.stepName : '...'}"
                          </TableCell>
                      </TableRow>
                      {}
                      <TableRow>
                          <TableCell className="font-medium">Macerador</TableCell>
                          <TableCell>Tiempo "Recibir Cocedor"</TableCell>
                          <TableCell className="text-right font-mono font-bold">
                              {recibirCocedorTime}
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground text-xs hidden md:table-cell">
                              Duración del paso específico
                          </TableCell>
                      </TableRow>
                      {}
                      <TableRow>
                          <TableCell className="font-medium">Macerador</TableCell>
                          <TableCell>Pausa Macerador</TableCell>
                          <TableCell className="text-right font-mono font-bold">
                              {pauseDetails.valid ? `${pauseDetails.duration.toFixed(2)} min` : "—"}
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground text-xs hidden md:table-cell">
                               {pauseDetails.valid ? (
                                   "Paso 'Pausa' entre Control Temp y Cont. Conversión"
                               ) : (
                                   pauseDetails.message || "No detectado"
                               )}
                          </TableCell>
                      </TableRow>
                       {}
                       <TableRow>
                          <TableCell className="font-medium">Macerador</TableCell>
                          <TableCell>Cálculo Manual (Rango)</TableCell>
                          <TableCell className="text-right font-mono font-bold">
                              {maceratorCalculatedTime.valid ? `${maceratorCalculatedTime.duration.toFixed(2)} min` : "—"}
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground text-xs hidden md:table-cell">
                               Rango seleccionado manualmente
                          </TableCell>
                      </TableRow>
                      {}
                      <TableRow>
                          <TableCell className="font-medium">Macerador</TableCell>
                          <TableCell>Temp. "Cont. Conversión"</TableCell>
                          <TableCell className="text-right font-mono font-bold">
                              {conversionTemp}
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground text-xs hidden md:table-cell">
                              Parámetro registrado en el paso
                          </TableCell>
                      </TableRow>
                      {}
                      <TableRow>
                          <TableCell className="font-medium">Macerador / Cocimiento</TableCell>
                          <TableCell>Grado Plato (DFM8)</TableCell>
                          <TableCell className="text-right font-mono font-bold">
                              {(() => {
                                  const allParams = batchRecords.flatMap(r => r.parameters || []);
                                  const platoParam = allParams.find(p => p.dfmCode === "DFM8" && p.value > 0);
                                  if (!platoParam) return "N/A";
                                  return `${platoParam.value} ${platoParam.unit || ""}`;
                              })()}
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground text-xs hidden md:table-cell">
                               {(() => {
                                    const allParams = batchRecords.flatMap(r => r.parameters || []);
                                    const platoParam = allParams.find(p => p.dfmCode === "DFM8" && p.value > 0);
                                    return platoParam ? `Detectado en paso: "${platoParam.stepName}"` : "No encontrado en columna IW_DFM8";
                               })()}
                          </TableCell>
                      </TableRow>
                  </TableBody>
              </Table>
          </CardContent>
      </Card>
    </motion.div>
  );
}
