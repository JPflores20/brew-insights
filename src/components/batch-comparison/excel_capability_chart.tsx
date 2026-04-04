import React, { useState, useMemo, useEffect } from "react";
import * as XLSX from "xlsx";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ReferenceLine,
  Label,
} from "recharts";
import { Input } from "@/components/ui/input";
import { Label as UILabel } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLocalStorage } from "@/hooks/use_local_storage";
import { Activity, FileSpreadsheet, Filter, Loader2, Download, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FILTER_ALL } from "@/lib/constants";

import { DateRange } from "react-day-picker";
import { DatePickerWithRange } from "@/components/ui/date_range_picker";
import { parse, isAfter, isBefore, startOfDay, endOfDay } from "date-fns";
import { es } from "date-fns/locale";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background/90 backdrop-blur-md border border-border p-3 rounded-lg shadow-xl">
        <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Valor: {label}</p>
        <p className="text-sm font-bold text-primary">
          Densidad: <span className="font-mono">{parseFloat(payload[0].value).toFixed(4)}</span>
        </p>
      </div>
    );
  }
  return null;
};

interface ExcelRow {
  Val: number;
  Param: string;
  Etapa: string;
  Marca: string;
  LEI: number;
  LES: number;
  Date: Date | null;
}

export function ExcelCapabilityChart() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [extData, setExtData] = useState<ExcelRow[]>([]);
  
  // Specification limits
  const [lei, setLei] = useLocalStorage<number | "">("excel-cpk-lei", 0);
  const [les, setLes] = useLocalStorage<number | "">("excel-cpk-les", 100);

  // Filters
  const [selectedEtapa, setSelectedEtapa] = useState<string>(FILTER_ALL);
  const [selectedMarca, setSelectedMarca] = useState<string>(FILTER_ALL);
  const [selectedParam, setSelectedParam] = useState<string>(FILTER_ALL);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const processWorkbook = (workbook: XLSX.WorkBook) => {
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    
    // Convert to JSON with array of arrays (no headers)
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" }) as any[][];
    
    if (jsonData.length === 0) throw new Error("Archivo Excel vacío");

    // Identificar índices de columnas dinámicamente
    const headers = (jsonData[0] || []).map(h => String(h).toLowerCase().trim());

    const findIdx = (names: string[], defaultIdx: number) => {
        const idx = headers.findIndex(h => names.some(n => h.includes(n.toLowerCase())));
        return idx !== -1 ? idx : defaultIdx;
    };

    const iVal = findIdx(["media", "valor"], 4);
    const iParam = findIdx(["texto", "parámetro"], 7);
    const iLEI = findIdx(["ti", "lpi", "lei"], 6);
    const iLES = findIdx(["ts", "lps", "les"], 5);
    const iMarca = findIdx(["marca"], 12);
    const iEtapa = findIdx(["tipo", "etapa"], 13);

    const validRows = jsonData.filter((row, idx) => {
        if (idx === 0) return false; // Skip headers
        if (row.length <= Math.max(iVal, iParam, iLEI, iLES)) return false;
        const valStr = row[iVal];
        if (valStr === undefined || valStr === null || valStr === "") return false;
        const val = parseFloat(valStr);
        return !isNaN(val);
    }).map(row => {
        let rowDate: Date | null = null;
        const dateStr = String(row[0]).trim();
        if (dateStr) {
          rowDate = parse(dateStr, 'dd.MM.yyyy', new Date());
          if (isNaN(rowDate.getTime())) {
            if (typeof row[0] === 'number') {
              rowDate = new Date((row[0] - 25569) * 86400 * 1000);
            } else {
              rowDate = null;
            }
          }
        }

        return {
          Val: parseFloat(row[iVal]),
          Param: row[iParam] || "N/A",
          Etapa: row[iEtapa] || "N/A",
          Marca: row[iMarca] || "N/A",
          LEI: parseFloat(row[iLEI]) || 0,
          LES: parseFloat(row[iLES]) || 0,
          Date: rowDate
        };
    });

    setExtData(validRows);
    setError(null);
    setLoading(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const workbook = XLSX.read(bstr, { type: 'binary' });
        processWorkbook(workbook);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al procesar el archivo");
        setLoading(false);
      }
    };
    reader.onerror = () => {
      setError("Error al leer el archivo");
      setLoading(false);
    };
    reader.readAsBinaryString(file);
  };

  // Load Excel data (optional static fallback)
  useEffect(() => {
    const loadDefaultExcel = async () => {
      try {
        setLoading(true);
        const response = await fetch("/cpcpk/BPI%202026.xlsx");
        if (!response.ok) {
           setLoading(false); // Silent fail, let user upload
           return;
        }
        
        const arrayBuffer = await response.arrayBuffer();
        const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array' });
        processWorkbook(workbook);
      } catch (err) {
        console.warn("Default excel not found:", err);
        setLoading(false);
      }
    };

    loadDefaultExcel();
  }, []);

  // Filter options
  const uniqueEtapas = useMemo(() => {
    return Array.from(new Set(extData.map(d => d.Etapa).filter(Boolean))).sort();
  }, [extData]);

  const uniqueMarcas = useMemo(() => {
    return Array.from(new Set(extData.map(d => d.Marca).filter(Boolean))).sort();
  }, [extData]);

  const uniqueParams = useMemo(() => {
    return Array.from(new Set(extData.map(d => d.Param).filter(Boolean))).sort();
  }, [extData]);

  const availableDateRange = useMemo(() => {
    const dates = extData.map(d => d.Date).filter((d): d is Date => d !== null);
    if (dates.length === 0) return { min: undefined, max: undefined };
    return {
      min: new Date(Math.min(...dates.map(d => d.getTime()))),
      max: new Date(Math.max(...dates.map(d => d.getTime())))
    };
  }, [extData]);

  // Auto-update limits when parameter/brand/stage changes
  useEffect(() => {
    if (selectedParam !== FILTER_ALL && extData.length > 0) {
      // Intentar encontrar una fila que coincida con todos los filtros para obtener los límites específicos
      const specificMatch = extData.find(d => 
        d.Param === selectedParam && 
        (selectedMarca === FILTER_ALL || d.Marca === selectedMarca) &&
        (selectedEtapa === FILTER_ALL || d.Etapa === selectedEtapa)
      );
      
      const match = specificMatch || extData.find(d => d.Param === selectedParam);
      
      if (match) {
        setLei(match.LEI);
        setLes(match.LES);
      }
    }
  }, [selectedParam, selectedMarca, selectedEtapa, extData]);

  // Filtered data for calculation
  const filteredValues = useMemo(() => {
    return extData
      .filter(d => {
        const etapaMatch = selectedEtapa === FILTER_ALL || d.Etapa === selectedEtapa;
        const marcaMatch = selectedMarca === FILTER_ALL || d.Marca === selectedMarca;
        const paramMatch = selectedParam === FILTER_ALL || d.Param === selectedParam;
        
        let dateMatch = true;
        if (dateRange?.from && d.Date) {
          const start = startOfDay(dateRange.from);
          const end = dateRange.to ? endOfDay(dateRange.to) : endOfDay(dateRange.from);
          dateMatch = d.Date >= start && d.Date <= end;
        }

        return etapaMatch && marcaMatch && paramMatch && dateMatch;
      })
      .map(d => d.Val);
  }, [extData, selectedEtapa, selectedMarca, selectedParam, dateRange]);

  // Statistical calculations
  const stats = useMemo(() => {
    const n = filteredValues.length;
    if (n < 2) return null;

    const mean = filteredValues.reduce((a, b) => a + b, 0) / n;
    const min = Math.min(...filteredValues);
    const max = Math.max(...filteredValues);
    
    const sumSqDiff = filteredValues.reduce((a, b) => a + Math.pow(b - mean, 2), 0);
    const variance = sumSqDiff / (n - 1);
    const stdDev = Math.sqrt(variance);

    const nLei = Number(lei);
    const nLes = Number(les);
    
    // Target is middle of spec limits
    const target = (nLei + nLes) / 2;

    // Cp = (LES - LEI) / (6 * deviation)
    const cp = stdDev !== 0 ? (nLes - nLei) / (6 * stdDev) : 0;

    // Cpk = MIN((LES - media) / (3 * deviation), (media - LEI) / (3 * deviation))
    const cpkUpper = stdDev !== 0 ? (nLes - mean) / (3 * stdDev) : 0;
    const cpkLower = stdDev !== 0 ? (mean - nLei) / (3 * stdDev) : 0;
    const cpk = Math.min(cpkUpper, cpkLower);

    return { n, mean, min, max, stdDev, cp, cpk, lei: nLei, les: nLes, target };
  }, [filteredValues, lei, les]);

  // Gaussian curve data
  const chartDataBase = useMemo(() => {
    if (!stats) return [];
    const { mean, stdDev, lei: sLei, les: sLes } = stats;
    if (stdDev === 0) return [];
    
    const points = [];
    const sigmaCount = 4;
    
    const dataStart = mean - sigmaCount * stdDev;
    const dataEnd = mean + sigmaCount * stdDev;
    
    const start = Math.min(dataStart, sLei - stdDev);
    const end = Math.max(dataEnd, sLes + stdDev);
    
    const step = (end - start) / 100;

    for (let x = start; x <= end; x += step) {
      const y = (1 / (stdDev * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * Math.pow((x - mean) / stdDev, 2));
      points.push({ x: parseFloat(x.toFixed(3)), y: parseFloat(y.toFixed(5)) });
    }
    return points;
  }, [stats]);

  if (loading) {
    return (
      <Card className="shadow-sm border-border bg-card/50 backdrop-blur-sm p-12 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
          <p className="text-muted-foreground animate-pulse text-sm font-medium">Procesando datos de BPI 2026...</p>
        </div>
      </Card>
    );
  }

  if (error || (extData.length === 0 && !loading)) {
    return (
      <Card className="shadow-sm border-border bg-card/50 backdrop-blur-sm p-12 text-center border-dashed">
        <div className="flex flex-col items-center gap-4">
          <UploadCloud className="h-12 w-12 text-muted-foreground opacity-50" />
          <div className="space-y-1">
            <p className="font-bold text-lg">Habilitar análisis de capacidad</p>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Sube tu archivo BPI 2026.xlsx para comenzar a analizar la capacidad del proceso.
            </p>
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".xlsx, .xls, .csv"
            className="hidden"
          />
          <Button 
            onClick={() => fileInputRef.current?.click()}
            className="bg-fuchsia-600 hover:bg-fuchsia-700 mt-4"
          >
            Seleccionar archivo Excel
          </Button>
          {error && <p className="text-xs text-destructive mt-4">{error}</p>}
        </div>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
      <Card className="lg:col-span-2 shadow-sm border-border bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <div className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-xl font-bold flex items-center gap-2 text-fuchsia-500">
                  <FileSpreadsheet className="h-5 w-5" />
                  Capacidad del Proceso - BPI Excel
                </CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <CardDescription>Análisis estadístico dinámico</CardDescription>
                  <Button 
                    variant="link" 
                    size="sm" 
                    className="h-auto p-0 text-[10px] text-fuchsia-500 font-bold uppercase tracking-wider"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Actualizar Archivo
                  </Button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept=".xlsx, .xls, .csv"
                    className="hidden"
                  />
                </div>
              </div>
              
              <div className="flex items-center gap-3 bg-secondary/30 p-2 rounded-lg border border-border">
                <div className="flex flex-col">
                  <UILabel htmlFor="ex-lei" className="text-[10px] uppercase font-bold text-muted-foreground mb-1">LEI</UILabel>
                  <Input
                    id="ex-lei"
                    type="number"
                    value={lei}
                    onChange={(e) => setLei(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    className="h-8 w-20 text-xs font-mono"
                  />
                </div>
                <div className="flex flex-col">
                  <UILabel htmlFor="ex-les" className="text-[10px] uppercase font-bold text-muted-foreground mb-1">LES</UILabel>
                  <Input
                    id="ex-les"
                    type="number"
                    value={les}
                    onChange={(e) => setLes(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    className="h-8 w-20 text-xs font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Filters Row */}
            <div className="flex flex-wrap items-center gap-4 p-3 bg-muted/30 rounded-lg border border-border/50">
              <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium mr-2">
                <Filter className="h-4 w-4" /> Filtros Excel:
              </div>
              
              <div className="flex flex-wrap gap-3 items-center">
                <Select value={selectedParam} onValueChange={setSelectedParam}>
                  <SelectTrigger className="w-[200px] h-9 bg-background">
                    <SelectValue placeholder="Parámetro" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={FILTER_ALL}>Todos parámetros</SelectItem>
                    {uniqueParams.map((p) => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedEtapa} onValueChange={setSelectedEtapa}>
                  <SelectTrigger className="w-[150px] h-9 bg-background">
                    <SelectValue placeholder="Etapa" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={FILTER_ALL}>Todas las etapas</SelectItem>
                    {uniqueEtapas.map((e) => (
                      <SelectItem key={e} value={e}>{e}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedMarca} onValueChange={setSelectedMarca}>
                  <SelectTrigger className="w-[150px] h-9 bg-background">
                    <SelectValue placeholder="Marca" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={FILTER_ALL}>Todas las marcas</SelectItem>
                    {uniqueMarcas.map((m) => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="h-8 w-[1px] bg-border mx-1 hidden sm:block" />

                <DatePickerWithRange 
                    date={dateRange} 
                    setDate={setDateRange} 
                    minDate={availableDateRange.min}
                    maxDate={availableDateRange.max}
                    className="h-9"
                />
              </div>

              <div className="text-xs text-muted-foreground ml-auto bg-background px-2 py-1 rounded border border-border/50">
                Muestra: <span className="font-bold text-foreground">{filteredValues.length}</span> registros
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="h-[400px] w-full">
            {filteredValues.length === 0 ? (
               <div className="flex h-full items-center justify-center flex-col gap-2 text-muted-foreground">
                 <Activity className="h-10 w-10 opacity-20" />
                 <p>No hay datos disponibles para los filtros seleccionados.</p>
               </div>
            ) : !stats ? (
              <div className="flex h-full items-center justify-center flex-col gap-2 text-muted-foreground">
                <Loader2 className="h-10 w-10 opacity-20 animate-spin" />
                <p>Procesando estadísticas...</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartDataBase} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <defs>
                    <linearGradient id="colorExcel" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#d946ef" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#d946ef" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} vertical={false} />
                  <XAxis 
                    dataKey="x" 
                    type="number" 
                    domain={['dataMin', 'dataMax']} 
                    tick={{ fontSize: 10 }}
                    tickFormatter={(val) => val.toFixed(2)}
                  />
                  <YAxis hide />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="y"
                    stroke="#d946ef"
                    fill="#d946ef1a"
                    strokeWidth={2}
                    animationDuration={1000}
                  />
                  
                  {/* Media Line */}
                  <ReferenceLine x={stats.mean} stroke="#d946ef" strokeDasharray="3 3">
                    <Label value="Media" position="top" fill="#d946ef" fontSize={10} />
                  </ReferenceLine>

                  {/* LEI Line */}
                  <ReferenceLine x={stats.lei} stroke="#ef4444" strokeWidth={2}>
                    <Label value={`LEI: ${stats.lei}`} position="insideTopLeft" fill="#ef4444" fontSize={10} fontWeight="bold" />
                  </ReferenceLine>

                  {/* Target Line */}
                  <ReferenceLine x={stats.target} stroke="#10b981" strokeWidth={2} strokeDasharray="5 5">
                    <Label value={`Target: ${stats.target.toFixed(2)}`} position="top" fill="#10b981" fontSize={10} fontWeight="bold" />
                  </ReferenceLine>

                  {/* LES Line */}
                  <ReferenceLine x={stats.les} stroke="#ef4444" strokeWidth={2}>
                    <Label value={`LES: ${stats.les}`} position="insideTopRight" fill="#ef4444" fontSize={10} fontWeight="bold" />
                  </ReferenceLine>
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm border-border bg-card/50 backdrop-blur-sm h-full">
        <CardHeader>
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <Activity className="h-5 w-5 text-fuchsia-500" />
            Métricas Excel
          </CardTitle>
          <CardDescription>Resumen estadístico de BPI 2026</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableBody>
              <TableRow>
                <TableCell className="font-semibold text-muted-foreground uppercase text-[10px]">n</TableCell>
                <TableCell className="text-right font-mono">{stats?.n || 0}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-semibold text-muted-foreground uppercase text-[10px]">Media</TableCell>
                <TableCell className="text-right font-mono font-bold text-fuchsia-500">{stats?.mean.toFixed(3) || "---"}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-semibold text-muted-foreground uppercase text-[10px]">Min</TableCell>
                <TableCell className="text-right font-mono">{stats?.min.toFixed(3) || "---"}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-semibold text-muted-foreground uppercase text-[10px]">Máx.</TableCell>
                <TableCell className="text-right font-mono">{stats?.max.toFixed(3) || "---"}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-semibold text-muted-foreground uppercase text-[10px]">Desv. Est. σ</TableCell>
                <TableCell className="text-right font-mono">{stats?.stdDev.toFixed(4) || "---"}</TableCell>
              </TableRow>
              <TableRow className="bg-fuchsia-500/5">
                <TableCell className="font-bold text-fuchsia-600 uppercase text-[10px]">Cp</TableCell>
                <TableCell className="text-right font-mono font-bold text-fuchsia-600">
                    {stats?.cp !== undefined && isFinite(stats.cp) ? stats.cp.toFixed(3) : "---"}
                </TableCell>
              </TableRow>
              <TableRow className="bg-fuchsia-500/10">
                <TableCell className="font-bold text-fuchsia-600 uppercase text-[10px]">Cpk</TableCell>
                <TableCell className="text-right font-mono font-bold text-fuchsia-600">
                    {stats?.cpk !== undefined && isFinite(stats.cpk) ? stats.cpk.toFixed(3) : "---"}
                </TableCell>
              </TableRow>
              <TableRow className="bg-green-500/5">
                <TableCell className="font-semibold text-green-600 uppercase text-[10px]">Target</TableCell>
                <TableCell className="text-right font-mono font-bold text-green-600">{stats?.target.toFixed(3) || "---"}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-semibold text-muted-foreground uppercase text-[10px]">LES</TableCell>
                <TableCell className="text-right font-mono text-destructive">{stats?.les.toFixed(3) || "---"}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-semibold text-muted-foreground uppercase text-[10px]">LEI</TableCell>
                <TableCell className="text-right font-mono text-destructive">{stats?.lei.toFixed(3) || "---"}</TableCell>
              </TableRow>
            </TableBody>
          </Table>

          {stats && (stats.cpk < 1) && (
             <div className="mt-6 p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-start gap-3">
               <Activity className="h-5 w-5 mt-0.5 shrink-0" />
               <p><strong>Baja Capacidad:</strong> El Cpk es menor a 1.0.</p>
             </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
