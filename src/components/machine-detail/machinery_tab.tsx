import { useMemo, useState, useEffect } from "react";
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
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { BatchRecord, getUniqueBatchIds } from "@/data/mock_data";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Check, ChevronsUpDown, Plus, X, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
interface MachineryTabProps {
  data: BatchRecord[];
  selectedBatchId: string;
  compareBatchIds: string[];
  setCompareBatchIds: React.Dispatch<React.SetStateAction<string[]>>;
}
export function MachineryTab({ 
  data, 
  selectedBatchId,
  compareBatchIds,
  setCompareBatchIds
}: MachineryTabProps) {
  const batchRecords = useMemo(() => {
    return data.filter((d) => d.CHARG_NR === selectedBatchId);
  }, [data, selectedBatchId]);
  const filterRecord = batchRecords.find((r) =>
    r.TEILANL_GRUPO.toLowerCase().includes("filtro"),
  );
  const maceratorRecord = batchRecords.find((r) =>
    r.TEILANL_GRUPO.toLowerCase().includes("macerador"),
  );
  const filterSteps = filterRecord?.steps || [];
  const startStepFilter = "Arranca Olla";
  const endStepFilter = "Ag.Ultimo Lavado";
  const startFilterIndex = filterSteps.findIndex(
    (s) => s.stepName.toLowerCase() === startStepFilter.toLowerCase(),
  );
  const endFilterIndex = filterSteps.findIndex(
    (s) => s.stepName.toLowerCase() === endStepFilter.toLowerCase(),
  );

  const filterTotalTime = useMemo(() => {
    if (startFilterIndex === -1 || endFilterIndex === -1 || startFilterIndex >= endFilterIndex) return 0;
    let total = 0;
    // Sumar pasos estrictamente entre Arranca Olla y Ag.Ultimo Lavado
    for (let i = startFilterIndex + 1; i < endFilterIndex; i++) {
        total += filterSteps[i].durationMin;
    }
    return total;
  }, [filterSteps, startFilterIndex, endFilterIndex]);
  const maceratorSteps = useMemo(() => {
    const rawSteps = maceratorRecord?.steps || [];
    if (!rawSteps.length) return [];
    
    const collapsed = [];
    let current = { ...rawSteps[0] };
    
    for (let i = 1; i < rawSteps.length; i++) {
        if (rawSteps[i].stepName === current.stepName) {
            current.durationMin += rawSteps[i].durationMin;
        } else {
            collapsed.push(current);
            current = { ...rawSteps[i] };
        }
    }
    collapsed.push(current);
    return collapsed;
  }, [maceratorRecord]);

  const recibirCocedorTime = useMemo(() => {
    if (!maceratorSteps.length) return "N/A";
    const step = maceratorSteps.find(
      (s) => s.stepName.toLowerCase() === "recibir cocedor"
    );
    return step ? `${step.durationMin} min` : "N/A"; 
  }, [maceratorSteps]);

  const pauseDetails = useMemo(() => {
    const steps = maceratorSteps;
    const normalize = (s: string) => s.toLowerCase().trim();
    const startPauseIndex = steps.findIndex((s) =>
      normalize(s.stepName).includes("control temp"),
    );
    const endPauseIndex = steps.findIndex(
      (s) =>
        normalize(s.stepName).includes("cont. conversion") ||
        normalize(s.stepName).includes("cont. conversión"),
    );
    if (
      startPauseIndex === -1 ||
      endPauseIndex === -1 ||
      startPauseIndex >= endPauseIndex
    ) {
      return {
        duration: 0,
        valid: false,
        startFound:
          startPauseIndex !== -1
            ? steps[startPauseIndex].stepName
            : "NO ENCONTRADO (Buscado: 'control temp')",
        endFound:
          endPauseIndex !== -1
            ? steps[endPauseIndex].stepName
            : "NO ENCONTRADO (Buscado: 'cont. conversion')",
        allSteps: steps.map((s) => s.stepName).join(", "),
        includedSteps: [],
      };
    }
    let targetStep = null;
    let totalPauseDuration = 0;
    const includedPauseSteps = [];

    for (let i = startPauseIndex + 1; i < endPauseIndex; i++) {
      if (normalize(steps[i].stepName).includes("pausa")) {
        targetStep = steps[i];
        totalPauseDuration += steps[i].durationMin;
        includedPauseSteps.push({ name: steps[i].stepName, dur: steps[i].durationMin });
      }
    }
    if (!targetStep) {
      return {
        duration: 0,
        valid: false,
        message: "No se encontró un paso llamado 'Pausa' en el rango.",
        startFound: steps[startPauseIndex].stepName,
        endFound: steps[endPauseIndex].stepName,
        allSteps: steps.map((s) => s.stepName).join(", "),
        includedSteps: [],
      };
    }
    return {
      duration: totalPauseDuration,
      valid: true,
      startFound: steps[startPauseIndex].stepName,
      endFound: steps[endPauseIndex].stepName,
      includedSteps: includedPauseSteps,
    };
  }, [maceratorSteps]);
  const [selectedMaceratorStepIndex, setSelectedMaceratorStepIndex] = useState<string>("0");
  const maceratorStepOptions = useMemo(() => {
    return maceratorSteps.map((s, idx) => ({
      stepName: s.stepName,
      index: idx,
    }));
  }, [maceratorSteps]);
  const maceratorCalculatedTime = useMemo(() => {
    const index = parseInt(selectedMaceratorStepIndex, 10);
    if (isNaN(index) || !maceratorSteps[index]) {
      return { duration: 0, valid: false };
    }
    return { duration: maceratorSteps[index].durationMin, valid: true };
  }, [maceratorSteps, selectedMaceratorStepIndex]);
  const conversionTemp = useMemo(() => {
    if (!maceratorRecord?.parameters) return "N/A";
    const normalize = (s: string) => s.toLowerCase().trim();
    const param = maceratorRecord.parameters.find(
      (p) =>
        (normalize(p.stepName).includes("cont. conversion") ||
          normalize(p.stepName).includes("cont. conversión")) &&
        (p.name.toLowerCase().includes("temp") ||
          p.unit.toLowerCase().includes("c")),
    );
    return param ? `${param.value} ${param.unit}` : "N/A";
  }, [maceratorRecord]);
  // Estado local eliminado: ahora se usa via props desde context global de la página


  const allBatchIds = useMemo(() => getUniqueBatchIds(data), [data]);

  const selectedEndStepName = useMemo(() => {
    return endStepFilter;
  }, []);

  const selectedMaceratorStepName = useMemo(() => {
    const idx = parseInt(selectedMaceratorStepIndex, 10);
    return isNaN(idx) ? "" : maceratorSteps[idx]?.stepName || "";
  }, [maceratorSteps, selectedMaceratorStepIndex]);

  const comparisonData = useMemo(() => {
    return compareBatchIds.map(batchId => {
        const batchRecords = data.filter(d => d.CHARG_NR === batchId);
        const fRec = batchRecords.find(r => r.TEILANL_GRUPO.toLowerCase().includes("filtro"));
        const mRec = batchRecords.find(r => r.TEILANL_GRUPO.toLowerCase().includes("macerador"));
        
        // Filtro Tiempo
        let fTime = 0;
        if (fRec) {
            const fSteps = fRec.steps || [];
            const sIdx = fSteps.findIndex(s => s.stepName.toLowerCase() === "arranca olla".toLowerCase());
            const eIdx = fSteps.findIndex(s => s.stepName.toLowerCase() === "ag.ultimo lavado".toLowerCase());
            if (sIdx !== -1 && eIdx !== -1 && sIdx < eIdx) {
                for (let i = sIdx + 1; i < eIdx; i++) fTime += fSteps[i].durationMin;
            }
        }

        // Macerador Steps Collapsed
        const rawMSteps = mRec?.steps || [];
        const mSteps = [];
        if (rawMSteps.length > 0) {
            let curr = { ...rawMSteps[0] };
            for (let i = 1; i < rawMSteps.length; i++) {
                if (rawMSteps[i].stepName === curr.stepName) curr.durationMin += rawMSteps[i].durationMin;
                else { mSteps.push(curr); curr = { ...rawMSteps[i] }; }
            }
            mSteps.push(curr);
        }

        const recCocTime = mSteps.find(s => s.stepName.toLowerCase() === "recibir cocedor")?.durationMin;
        
        // Pausa
        const normalize = (s: string) => s.toLowerCase().trim();
        const startPIdx = mSteps.findIndex(s => normalize(s.stepName).includes("control temp"));
        const endPIdx = mSteps.findIndex(s => normalize(s.stepName).includes("cont. conversion") || normalize(s.stepName).includes("cont. conversión"));
        let pDur = 0;
        if (startPIdx !== -1 && endPIdx !== -1 && startPIdx < endPIdx) {
            for (let i = startPIdx + 1; i < endPIdx; i++) {
                if (normalize(mSteps[i].stepName).includes("pausa")) pDur += mSteps[i].durationMin;
            }
        }

        const selStepDur = mSteps.find(s => s.stepName.toLowerCase() === selectedMaceratorStepName.toLowerCase())?.durationMin;
        
        const convTemp = mRec?.parameters?.find(p => 
            (normalize(p.stepName).includes("cont. conversion") || normalize(p.stepName).includes("cont. conversión")) && 
            (p.name.toLowerCase().includes("temp") || p.unit.toLowerCase().includes("c"))
        );

        const platoParam = batchRecords.flatMap(r => r.parameters || []).find(p => p.dfmCode === "DFM8" && p.value > 0);

        return {
            batchId,
            filterTime: fTime,
            recibirCocedor: recCocTime || 0,
            recibirCocedorLabel: recCocTime !== undefined ? `${recCocTime} min` : "N/A",
            pauseDur: pDur,
            selectedStepDur: selStepDur || 0,
            selectedStepLabel: selStepDur !== undefined ? `${selStepDur.toFixed(2)} min` : "—",
            conversionTemp: convTemp?.value || 0,
            conversionTempLabel: convTemp ? `${convTemp.value} ${convTemp.unit}` : "N/A",
            plato: platoParam?.value || 0,
            platoLabel: platoParam ? `${platoParam.value} ${platoParam.unit || ""}` : "N/A"
        };
    });
  }, [data, compareBatchIds, selectedEndStepName, selectedMaceratorStepName, startStepFilter]);

  const chartData = useMemo(() => {
    const metrics = [
        { key: "filterTime", name: "Filtro (min)" },
        { key: "recibirCocedor", name: "Rec. Cocedor (min)" },
        { key: "pauseDur", name: "Pausa (min)" },
        { key: "selectedStepDur", name: "Paso Sel. (min)" },
        { key: "conversionTemp", name: "Temp. Conv (°C)" },
        { key: "plato", name: "Grado Plato" },
    ];

    return metrics.map(m => {
        const point: any = { metric: m.name };
        comparisonData.forEach(d => {
            point[d.batchId] = d[m.key as keyof typeof d];
        });
        return point;
    });
  }, [comparisonData]);

  const colors = ["#8884d8", "#82ca9d", "#ffc658", "#ff8042", "#0088fe", "#00c49f", "#ffbb28", "#ff4444", "#a4de6c"];

  const evolutionMetrics = [
    { key: "filterTime", name: "Filtro", color: "#8884d8" },
    { key: "recibirCocedor", name: "Rec. Cocedor", color: "#82ca9d" },
    { key: "pauseDur", name: "Pausa", color: "#ffc658" },
    { key: "selectedStepDur", name: "Paso Sel.", color: "#ff8042" },
    { key: "conversionTemp", name: "Temp. Conv", color: "#0088fe" },
    { key: "plato", name: "Grado Plato", color: "#00c49f" },
  ];

  if (!selectedBatchId) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center bg-muted/20 rounded-lg border border-dashed">
        <p className="text-muted-foreground">
          Selecciona un lote para ver la información de maquinaria.
        </p>
      </div>
    );
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
                Cálculo automático: entre pasos <strong>{startStepFilter}</strong> y <strong>{endStepFilter}</strong>
            </p>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="bg-muted/30 p-4 rounded-lg border flex items-baseline justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                Tiempo Calculado
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold font-mono tracking-tight text-primary">
                  {filterTotalTime.toFixed(3)}
                </span>
                <span className="text-sm font-medium text-muted-foreground">
                  min
                </span>
              </div>
            </div>
            {(startFilterIndex === -1 || endFilterIndex === -1) && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                ⚠️ No se encontraron los pasos "{startStepFilter}" y/o "{endStepFilter}" en este
                lote.
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
                <Clock className="w-4 h-4" /> Consulta de Tiempo por Paso
              </h4>
              <div className="space-y-2">
                <label className="text-xs font-medium">Seleccionar Paso:</label>
                <Select
                  value={selectedMaceratorStepIndex}
                  onValueChange={setSelectedMaceratorStepIndex}
                >
                  <SelectTrigger className="h-10 text-sm">
                    <SelectValue placeholder="Seleccionar paso..." />
                  </SelectTrigger>
                  <SelectContent>
                    {maceratorStepOptions.map((opt) => (
                      <SelectItem
                        key={`macerator-${opt.index}`}
                        value={opt.index.toString()}
                        className="text-sm"
                      >
                        {opt.index + 1}. {opt.stepName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-between items-center pt-2 border-t mt-2">
                <span className="text-sm font-medium">Tiempo del Paso:</span>
                <span className="font-mono font-bold text-lg text-primary">
                  {maceratorCalculatedTime.valid
                    ? `${maceratorCalculatedTime.duration.toFixed(2)} min`
                    : "—"}
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
            {!maceratorRecord && (
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
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <CardTitle className="text-lg">Resumen General de Maquinaria</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">Comparativa de métricas entre lotes seleccionados</p>
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 gap-2">
                  <Plus className="h-4 w-4" /> Comparar Lotes
                  {compareBatchIds.length > 1 && (
                    <Badge variant="secondary" className="ml-1 px-1 h-5 min-w-5 flex items-center justify-center rounded-full">
                      {compareBatchIds.length}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[300px] p-0" align="end">
                <Command>
                   <CommandInput placeholder="Buscar lote..." />
                   <CommandList>
                     <CommandEmpty>No se encontraron lotes.</CommandEmpty>
                     <CommandGroup className="max-h-[300px] overflow-auto">
                       {allBatchIds.map((batchId) => (
                         <CommandItem
                           key={batchId}
                           onSelect={() => {
                             setCompareBatchIds(prev => 
                               prev.includes(batchId) 
                                 ? prev.filter(id => id !== batchId || id === selectedBatchId) 
                                 : [...prev, batchId]
                             );
                           }}
                           className="flex items-center justify-between"
                         >
                           <div className="flex items-center gap-2">
                             <div className={cn(
                               "flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                               compareBatchIds.includes(batchId) ? "bg-primary text-primary-foreground" : "opacity-50"
                             )}>
                               {compareBatchIds.includes(batchId) && <Check className="h-3 w-3" />}
                             </div>
                             <span>{batchId}</span>
                           </div>
                           {batchId === selectedBatchId && (
                             <Badge variant="outline" className="text-[10px] h-4">Principal</Badge>
                           )}
                         </CommandItem>
                       ))}
                     </CommandGroup>
                   </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
          {compareBatchIds.length > 1 && (
            <div className="flex flex-wrap gap-2 mt-4">
               <AnimatePresence>
                 {compareBatchIds.map(id => (
                   <motion.div
                     key={id}
                     initial={{ opacity: 0, scale: 0.8 }}
                     animate={{ opacity: 1, scale: 1 }}
                     exit={{ opacity: 0, scale: 0.8 }}
                   >
                     <Badge 
                       variant={id === selectedBatchId ? "default" : "secondary"} 
                       className="gap-1 pr-1 pl-2 py-1"
                     >
                       {id}
                       {id !== selectedBatchId && (
                         <Button 
                           variant="ghost" 
                           size="icon" 
                           className="h-4 w-4 hover:bg-transparent" 
                           onClick={() => setCompareBatchIds(prev => prev.filter(bid => bid !== id))}
                         >
                           <X className="h-3 w-3" />
                         </Button>
                       )}
                     </Badge>
                   </motion.div>
                 ))}
               </AnimatePresence>
            </div>
          )}
        </CardHeader>
        <CardContent className="p-0 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="w-[100px] sticky left-0 bg-background z-10">Equipo</TableHead>
                <TableHead className="w-[180px] sticky left-[100px] bg-background z-10">Métrica</TableHead>
                {comparisonData.map(d => (
                  <TableHead key={d.batchId} className="text-right min-w-[120px]">
                    <div className="flex flex-col items-end">
                      <span className="font-bold text-foreground">{d.batchId}</span>
                      {d.batchId === selectedBatchId && <span className="text-[10px] text-primary italic font-normal">Vista actual</span>}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium sticky left-0 bg-background z-10">Filtro</TableCell>
                <TableCell className="sticky left-[100px] bg-background z-10">Tiempo Total Real</TableCell>
                {comparisonData.map(d => (
                  <TableCell key={`f-time-${d.batchId}`} className="text-right font-mono font-bold">
                    {d.filterTime > 0 ? `${d.filterTime.toFixed(3)} min` : "—"}
                  </TableCell>
                ))}
              </TableRow>
              <TableRow>
                <TableCell className="font-medium sticky left-0 bg-background z-10">Macerador</TableCell>
                <TableCell className="sticky left-[100px] bg-background z-10">Tiempo "Recibir Cocedor"</TableCell>
                {comparisonData.map(d => (
                  <TableCell key={`m-rec-${d.batchId}`} className="text-right font-mono font-bold">
                    {d.recibirCocedorLabel}
                  </TableCell>
                ))}
              </TableRow>
              <TableRow>
                <TableCell className="font-medium sticky left-0 bg-background z-10">Macerador</TableCell>
                <TableCell className="sticky left-[100px] bg-background z-10">Pausa Macerador</TableCell>
                {comparisonData.map(d => (
                  <TableCell key={`m-pause-${d.batchId}`} className="text-right font-mono font-bold">
                    {d.pauseDur > 0 ? `${d.pauseDur.toFixed(2)} min` : "—"}
                  </TableCell>
                ))}
              </TableRow>
              <TableRow>
                <TableCell className="font-medium sticky left-0 bg-background z-10">Macerador</TableCell>
                <TableCell className="sticky left-[100px] bg-background z-10">Paso: {selectedMaceratorStepName || "..."}</TableCell>
                {comparisonData.map(d => (
                  <TableCell key={`m-step-${d.batchId}`} className="text-right font-mono font-bold">
                    {d.selectedStepLabel}
                  </TableCell>
                ))}
              </TableRow>
              <TableRow>
                <TableCell className="font-medium sticky left-0 bg-background z-10">Macerador</TableCell>
                <TableCell className="sticky left-[100px] bg-background z-10">Temp. "Cont. Conversión"</TableCell>
                {comparisonData.map(d => (
                  <TableCell key={`m-temp-${d.batchId}`} className="text-right font-mono font-bold">
                    {d.conversionTempLabel}
                  </TableCell>
                ))}
              </TableRow>
              <TableRow>
                <TableCell className="font-medium sticky left-0 bg-background z-10">Macerador / Cocimiento</TableCell>
                <TableCell className="sticky left-[100px] bg-background z-10">Grado Plato (DFM8)</TableCell>
                {comparisonData.map(d => (
                  <TableCell key={`m-plato-${d.batchId}`} className="text-right font-mono font-bold">
                    {d.platoLabel}
                  </TableCell>
                ))}
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader className="pb-4">
             <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Análisis de Fluctuaciones entre Lotes
             </CardTitle>
             <p className="text-sm text-muted-foreground">Comparativa visual de métricas críticas</p>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis 
                    dataKey="metric" 
                    tick={{ fontSize: 10 }} 
                    stroke="hsl(var(--muted-foreground))"
                    interval={0}
                    angle={-45}
                    textAnchor="end"
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }} 
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <RechartsTooltip 
                    contentStyle={{ 
                        backgroundColor: "hsl(var(--background))", 
                        borderColor: "hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: "12px"
                    }}
                  />
                  <Legend verticalAlign="top" height={36}/>
                  {compareBatchIds.map((id, index) => (
                    <Line
                      key={id}
                      type="monotone"
                      dataKey={id}
                      stroke={colors[index % colors.length]}
                      strokeWidth={id === selectedBatchId ? 3 : 1.5}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                      name={`Lote ${id}`}
                      opacity={id === selectedBatchId ? 1 : 0.7}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
             <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Tendencia Histórica por Métrica
             </CardTitle>
             <p className="text-sm text-muted-foreground">Evolución de cada variable a través de los lotes seleccionados</p>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={comparisonData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis 
                    dataKey="batchId" 
                    tick={{ fontSize: 12 }} 
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }} 
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <RechartsTooltip 
                    contentStyle={{ 
                        backgroundColor: "hsl(var(--background))", 
                        borderColor: "hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: "12px"
                    }}
                  />
                  <Legend verticalAlign="top" height={36}/>
                  {evolutionMetrics.map((m) => (
                    <Line
                      key={m.key}
                      type="monotone"
                      dataKey={m.key}
                      stroke={m.color}
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                      name={m.name}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
