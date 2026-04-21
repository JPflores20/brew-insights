import React, { useState, useMemo, useRef } from "react";
import * as XLSX from "xlsx";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MultiSelect } from "@/components/ui/multi_select";
import { DatePickerWithRange } from "@/components/ui/date_range_picker";
import { 
  UploadCloud, 
  Loader2, 
  Activity, 
  BarChart3, 
  LineChart as LineChartIcon,
  Trash2,
  Clock,
  Droplets,
  Layers,
  Database,
  Info,
  CheckCircle2,
  AlertTriangle
} from "lucide-react";
import { parse, startOfDay, endOfDay, isWithinInterval, isValid } from "date-fns";
import { SicChart } from "./sic_chart";
import { GaussChart } from "./gauss_chart";
import { calculateCapabilityStats } from "@/utils/stats_utils";
import { Table, TableBody, TableCell, TableRow, TableHeader, TableHead } from "@/components/ui/table";
import { cn } from "@/lib/utils";

type AnalysisMode = 'TIEMPOS' | 'EMO' | 'VOLUMEN' | 'CONTEO';

interface ExcelDataRow {
  date: Date | null;
  marca: string;
  tankType?: string; // Mapeado a Tipo de Fermentador (Columna J)
  filtroNum?: string;
  turno?: string;
  tipoCerveza?: string;
  value: number; // Mapeado a Tiempo de llenado (Columna K)
  lei?: number; // Mapeado a LI (Columna M)
  les?: number; // Mapeado a LS (Columna N)
  dynamicValues?: Record<string, number>;
}

const MODES: Record<AnalysisMode, { label: string; icon: React.ReactNode; color: string; accent: string }> = {
  TIEMPOS: { label: 'Tiempos de llenado', icon: <Clock className="h-5 w-5" />, color: 'text-blue-500', accent: '#3b82f6' },
  EMO: { label: 'EMO en filtración', icon: <Droplets className="h-5 w-5" />, color: 'text-amber-500', accent: '#f59e0b' },
  VOLUMEN: { label: 'Volumen de inóculo', icon: <Layers className="h-5 w-5" />, color: 'text-emerald-500', accent: '#10b981' },
  CONTEO: { label: 'Conteo', icon: <Database className="h-5 w-5" />, color: 'text-purple-500', accent: '#8b5cf6' },
};

export function CapabilityAnalysisManager() {
  return (
    <div className="space-y-12 pb-24">
      <div className="grid grid-cols-1 gap-12">
        <CapabilitySlot mode="TIEMPOS" />
        <CapabilitySlot mode="EMO" />
        <CapabilitySlot mode="VOLUMEN" />
        <CapabilitySlot mode="CONTEO" />
      </div>
    </div>
  );
}

function CapabilitySlot({ mode }: { mode: AnalysisMode }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rawRows, setRawRows] = useState<ExcelDataRow[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const [availableMetrics, setAvailableMetrics] = useState<string[]>([]);
  const [selectedMetric, setSelectedMetric] = useState<string>("");

  const [dateRange, setDateRange] = useState<any>(undefined);
  const [selectedMarcas, setSelectedMarcas] = useState<string[]>([]);
  const [selectedTankTypes, setSelectedTankTypes] = useState<string[]>([]);
  const [selectedFiltros, setSelectedFiltros] = useState<string[]>([]);
  const [selectedTurnos, setSelectedTurnos] = useState<string[]>([]);
  const [selectedTiposCerveza, setSelectedTiposCerveza] = useState<string[]>([]);
  
  // Controles Manuales de Límites (LI y LS)
  const [manualLei, setManualLei] = useState<number | "">("");
  const [manualLes, setManualLes] = useState<number | "">("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseDate = (val: any): Date | null => {
    if (!val) return null;
    
    let resultDate: Date | null = null;

    if (val instanceof Date) {
      resultDate = val;
    } else if (typeof val === 'number') {
      if (val <= 0) return null; // Ignorar fechas nulas o cero (1899)
      resultDate = new Date((val - 25569) * 86400 * 1000);
    } else {
      const str = String(val).trim();
      if (!str || str === "0" || str.includes("1899") || str.includes("1900")) return null;
      
      const formats = [
        'dd/MM/yyyy', 'dd.MM.yyyy', 'yyyy-MM-dd', 'MM/dd/yyyy', 'd/M/yyyy', 'd.M.yyyy', 
        'dd/MM/yyyy HH:mm', 'dd.MM.yyyy HH:mm', 'yyyy-MM-dd HH:mm:ss', 'yyyy-MM-ddTHH:mm:ss.SSSZ'
      ];
      
      for (const f of formats) {
        const d = parse(str, f, new Date());
        if (!isNaN(d.getTime())) {
          resultDate = d;
          break;
        }
      }
      
      if (!resultDate) {
        const fallback = new Date(str);
        if (!isNaN(fallback.getTime())) resultDate = fallback;
      }
    }

    if (resultDate && resultDate.getFullYear() < 2000) return null;
    return resultDate;
  };

  const processWorkbook = (workbook: XLSX.WorkBook) => {
    try {
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: "A", defval: "" }) as Record<string, any>[];
      if (jsonData.length <= 1) throw new Error("Archivo vacío o inválido.");
      
      let processed: ExcelDataRow[] = [];

      const timeToHours = (val: any) => {
        if (val === null || val === undefined || val === "" || val === 0) return 0;
        if (typeof val === 'number') return val * 24;
        const str = String(val).trim();
        if (str.includes(':')) {
          const parts = str.split(':').map(Number);
          return (parts[0] || 0) + (parts[1] || 0) / 60 + (parts[2] || 0) / 3600;
        }
        return parseFloat(str.replace(',', '.')) || 0;
      };

      if (mode === 'TIEMPOS') {
        const rows = jsonData.slice(5); // Fila 6 hacia abajo
        
        processed = rows
          .filter(row => Object.values(row).some(cell => cell !== ""))
          .map((row) => {
            return {
              date: parseDate(row["I"]), // Fecha (Columna I)
              marca: String(row["G"] || '').trim(), // Marca (Columna G)
              tankType: String(row["J"] || '').trim(), // Tipo Fermentador (Columna J)
              value: timeToHours(row["K"]), // Tiempo llenado (Columna K)
              lei: timeToHours(row["M"]), // LI (Columna M)
              les: timeToHours(row["N"]), // LS (Columna N)
            };
          });
      } else if (mode === 'EMO') {
        const headers = jsonData[0]; 
        const rows = jsonData.slice(1);
        const metricCols = ['G', 'H', 'I', 'J', 'K'];
        const metrics = metricCols.map(col => String(headers[col] || '').trim() || "N/A").filter(m => m !== "N/A");
        
        setAvailableMetrics(metrics);
        const defaultMetric = metrics.find(m => m.toUpperCase().includes("EMO CFR")) || metrics[0];
        if (metrics.length > 0) setSelectedMetric(defaultMetric);
        
        processed = rows
          .filter(row => Object.values(row).some(cell => cell !== ""))
          .map(row => {
            const dynamicValues: Record<string, number> = {};
            metricCols.forEach((col, i) => {
              if (metrics[i] && metrics[i] !== "N/A") {
                dynamicValues[metrics[i]] = parseFloat(String(row[col]).replace(',', '.')) || 0;
              }
            });
            return {
              date: parseDate(row["C"]),
              filtroNum: String(row["D"] || '').trim(),
              turno: String(row["E"] || '').trim(),
              marca: String(row["F"] || '').trim(),
              tipoCerveza: String(row["L"] || '').trim(),
              value: 0,
              dynamicValues
            };
        });
      } else if (mode === 'VOLUMEN') {
        const rows = jsonData.slice(1);
        processed = rows
          .filter(row => Object.values(row).some(cell => cell !== ""))
          .map(row => ({
            date: parseDate(row["B"]),
            marca: String(row["A"] || '').trim(),
            tankType: String(row["D"] || '').trim(),
            value: parseFloat(String(row["N"] || 0).replace(',', '.')) || 0,
          }));
      } else if (mode === 'CONTEO') {
        const headers = jsonData[0];
        const rows = jsonData.slice(1);
        const metricCols = ['G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V'];
        const metrics = metricCols.map(col => String(headers[col] || '')).filter(m => m);
        
        setAvailableMetrics(metrics);
        if (metrics.length > 0) setSelectedMetric(metrics[0]);
        
        processed = rows
          .filter(row => Object.values(row).some(cell => cell !== ""))
          .map(row => {
            const dynamicValues: Record<string, number> = {};
            metricCols.forEach((col, i) => {
              if (metrics[i]) {
                dynamicValues[metrics[i]] = parseFloat(String(row[col]).replace(',', '.')) || 0;
              }
            });
            return {
              date: parseDate(row["D"]),
              marca: String(row["B"] || '').trim(),
              value: 0,
              dynamicValues
            };
        });
      }

      const finalRows = processed.filter(r => r.date !== null);
      if (finalRows.length === 0) {
        throw new Error(`No se detectaron fechas válidas. Verifica que la columna de fechas contenga datos con formato correcto.`);
      }
      
      setRawRows(finalRows);
      setError(null);
      setDateRange(undefined);
      setSelectedMarcas([]);
      setSelectedTankTypes([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al procesar el archivo");
    } finally {
      setLoading(false);
    }
  };

  const handleFile = (file: File) => {
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      setError("Solo se admiten archivos Excel (.xlsx, .xls)");
      return;
    }
    setLoading(true);
    setError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
        processWorkbook(workbook);
      } catch (err) {
        setError("Error al leer el archivo Excel");
        setLoading(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const timeFilteredRows = useMemo(() => {
    if (!dateRange?.from) return rawRows;
    const start = startOfDay(dateRange.from);
    const end = dateRange.to ? endOfDay(dateRange.to) : endOfDay(dateRange.from);
    
    return rawRows.filter(row => {
      if (!row.date || !isValid(row.date)) return false;
      try {
        return isWithinInterval(row.date, { start, end });
      } catch (e) {
        return false;
      }
    });
  }, [rawRows, dateRange]);

  const filteredData = useMemo(() => {
    return timeFilteredRows.filter(row => {
      if (selectedMarcas.length > 0 && !selectedMarcas.includes(row.marca)) return false;
      if (selectedTankTypes.length > 0 && row.tankType && !selectedTankTypes.includes(row.tankType)) return false;
      if (selectedFiltros.length > 0 && row.filtroNum && !selectedFiltros.includes(row.filtroNum)) return false;
      if (selectedTurnos.length > 0 && row.turno && !selectedTurnos.includes(row.turno)) return false;
      if (selectedTiposCerveza.length > 0 && row.tipoCerveza && !selectedTiposCerveza.includes(row.tipoCerveza)) return false;
      return true;
    }).map(row => ((mode === 'CONTEO' || mode === 'EMO') && selectedMetric ? { ...row, value: row.dynamicValues?.[selectedMetric] || 0 } : row));
  }, [timeFilteredRows, selectedMarcas, selectedTankTypes, selectedFiltros, mode, selectedMetric, selectedTurnos, selectedTiposCerveza]);
  
  const uniqueMarcas = useMemo(() => {
    return Array.from(new Set(timeFilteredRows.map(r => r.marca).filter(Boolean))).sort();
  }, [timeFilteredRows]);

  const uniqueTankTypes = useMemo(() => {
    let data = timeFilteredRows;
    if (selectedMarcas.length > 0) data = data.filter(r => selectedMarcas.includes(r.marca));
    return Array.from(new Set(data.map(r => r.tankType).filter(Boolean))).sort();
  }, [timeFilteredRows, selectedMarcas]);

  const uniqueFiltros = useMemo(() => {
    let data = timeFilteredRows;
    if (selectedMarcas.length > 0) data = data.filter(r => selectedMarcas.includes(r.marca));
    return Array.from(new Set(data.map(r => r.filtroNum).filter(Boolean))).sort();
  }, [timeFilteredRows, selectedMarcas]);

  const uniqueTurnos = useMemo(() => {
    let data = timeFilteredRows;
    if (selectedMarcas.length > 0) data = data.filter(r => selectedMarcas.includes(r.marca));
    return Array.from(new Set(data.map(r => r.turno).filter(Boolean))).sort();
  }, [timeFilteredRows, selectedMarcas]);

  const uniqueTiposCerveza = useMemo(() => {
    let data = timeFilteredRows;
    if (selectedMarcas.length > 0) data = data.filter(r => selectedMarcas.includes(r.marca));
    return Array.from(new Set(data.map(r => r.tipoCerveza).filter(Boolean))).sort();
  }, [timeFilteredRows, selectedMarcas]);

  const stats = useMemo(() => {
    const values = filteredData.map(d => d.value);
    
    // Si hay datos manuales, usarlos. Si no, tomar el de la primera fila disponible del Excel (Columnas M y N)
    const lei = manualLei !== "" ? manualLei : (filteredData.find(d => d.lei !== undefined)?.lei || 0);
    const les = manualLes !== "" ? manualLes : (filteredData.find(d => d.les !== undefined)?.les || 100);
    
    return calculateCapabilityStats(values, Number(lei), Number(les));
  }, [filteredData, manualLei, manualLes]);

  const { minDataDate, maxDataDate } = useMemo(() => {
    if (rawRows.length === 0) return { minDataDate: undefined, maxDataDate: undefined };
    const dates = rawRows.map(r => r.date?.getTime()).filter((t): t is number => !!t && !isNaN(t));
    if (dates.length === 0) return { minDataDate: undefined, maxDataDate: undefined };
    return {
      minDataDate: new Date(Math.min(...dates)),
      maxDataDate: new Date(Math.max(...dates))
    };
  }, [rawRows]);

  if (rawRows.length === 0) {
    return (
      <Card 
        className={cn(
          "bg-slate-900/40 border-slate-800/50 backdrop-blur-md border-2 border-dashed transition-all duration-300 h-64 flex items-center justify-center",
          isDragOver ? "border-blue-500 bg-blue-500/10" : "hover:border-slate-700"
        )}
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setIsDragOver(false); if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]); }}
      >
        <CardContent className="flex flex-col items-center">
          {loading ? (
            <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
          ) : (
            <>
              <div className="bg-slate-800/50 p-4 rounded-full mb-4">
                <UploadCloud className="h-8 w-8 text-slate-400" />
              </div>
              <p className="text-sm font-semibold mb-1">Cargar {MODES[mode].label}</p>
              <p className="text-xs text-slate-500 mb-4">Arrastra tu archivo o haz clic para subir</p>
              <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx,.xls" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
              <Button variant="outline" size="sm" className="border-slate-700" onClick={() => fileInputRef.current?.click()}>Seleccionar Archivo</Button>
              {error && <p className="mt-4 text-[10px] text-red-500 font-medium">{error}</p>}
            </>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
      <Card className="lg:col-span-3 bg-slate-900/40 border-slate-800/50 backdrop-blur-md shadow-2xl">
        <CardHeader className="pb-4 border-b border-slate-800/50">
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn("p-2 rounded-lg bg-slate-800/50", MODES[mode].color)}>
                  {MODES[mode].icon}
                </div>
                <div>
                  <CardTitle className="text-xl font-bold flex items-center gap-2">
                    Capacidad del Proceso - {MODES[mode].label}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Análisis de distribución y control estadístico
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 bg-slate-800/30 p-2 rounded-lg border border-slate-700/50">
                  <div className="flex flex-col">
                    <Label className="text-[9px] uppercase font-bold text-slate-500 mb-0.5">LEI</Label>
                    <Input type="number" placeholder="Auto" value={manualLei} onChange={e => setManualLei(e.target.value === '' ? '' : Number(e.target.value))} className="h-7 w-16 text-[10px] font-mono bg-slate-950/50 border-slate-800" />
                  </div>
                  <div className="flex flex-col">
                    <Label className="text-[9px] uppercase font-bold text-slate-500 mb-0.5">LES</Label>
                    <Input type="number" placeholder="Auto" value={manualLes} onChange={e => setManualLes(e.target.value === '' ? '' : Number(e.target.value))} className="h-7 w-16 text-[10px] font-mono bg-slate-950/50 border-slate-800" />
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500" onClick={() => setShowPreview(!showPreview)}><Info className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-red-400" onClick={() => setRawRows([])}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 p-3 bg-slate-950/40 rounded-lg border border-slate-800">
               <DatePickerWithRange 
                 date={dateRange} 
                 setDate={setDateRange} 
                 className="h-9 w-full sm:w-auto" 
                 minDate={minDataDate}
                 maxDate={maxDataDate}
               />
               <MultiSelect options={uniqueMarcas} selected={selectedMarcas} onChange={setSelectedMarcas} placeholder="Marcas" className="h-9 bg-slate-900 border-slate-800 min-w-[150px]" />
               {uniqueTankTypes.length > 0 && <MultiSelect options={uniqueTankTypes} selected={selectedTankTypes} onChange={setSelectedTankTypes} placeholder="Tipo Fermentador" className="h-9 bg-slate-900 border-slate-800 min-w-[160px]" />}
               {uniqueFiltros.length > 0 && <MultiSelect options={uniqueFiltros} selected={selectedFiltros} onChange={setSelectedFiltros} placeholder="Filtro #" className="h-9 bg-slate-900 border-slate-800 min-w-[120px]" />}
               {uniqueTurnos.length > 0 && <MultiSelect options={uniqueTurnos} selected={selectedTurnos} onChange={setSelectedTurnos} placeholder="Turno" className="h-9 bg-slate-900 border-slate-800 min-w-[120px]" />}
               {uniqueTiposCerveza.length > 0 && <MultiSelect options={uniqueTiposCerveza} selected={selectedTiposCerveza} onChange={setSelectedTiposCerveza} placeholder="Tipo Cerveza" className="h-9 bg-slate-900 border-slate-800 min-w-[150px]" />}
               {(mode === 'CONTEO' || mode === 'EMO') && (
                 <Select value={selectedMetric} onValueChange={setSelectedMetric}>
                   <SelectTrigger className="h-9 w-40 bg-slate-900 border-slate-800"><SelectValue /></SelectTrigger>
                   <SelectContent className="bg-slate-900 border-slate-800">{availableMetrics.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                 </Select>
               )}
               <div className="ml-auto flex items-center gap-2">
                 <span className="text-[10px] uppercase font-bold text-slate-500">Muestra:</span>
                 <span className="bg-slate-800 px-2 py-0.5 rounded text-xs font-mono font-bold">{filteredData.length}</span>
               </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-8 pt-8 px-6 pb-8">
          {showPreview && (
            <div className="bg-slate-950/60 rounded-lg border border-blue-500/20 p-3 overflow-auto max-h-[150px]">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-800">
                    <TableHead className="h-7 text-[10px]">Fecha</TableHead>
                    <TableHead className="h-7 text-[10px]">Marca</TableHead>
                    <TableHead className="h-7 text-[10px] text-right">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rawRows.slice(0, 10).map((r, i) => (
                    <TableRow key={i} className="border-slate-900">
                      <TableCell className="py-1 text-[10px] font-mono">{r.date?.toLocaleDateString()}</TableCell>
                      <TableCell className="py-1 text-[10px]">{r.marca}</TableCell>
                      <TableCell className="py-1 text-[10px] text-right font-mono">{r.value.toFixed(4)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          <div className="space-y-12">
            <div className="h-[350px] w-full bg-slate-950/20 rounded-xl border border-slate-800/30 overflow-hidden p-2">
              {stats && stats.n >= 2 && stats.stdDev > 0 ? (
                <GaussChart stats={stats} />
              ) : (
                <div className="h-full flex items-center justify-center text-slate-500 italic text-xs">Insuficientes datos para curva Gaussiana</div>
              )}
            </div>

            <div className="h-[350px] w-full bg-slate-950/20 rounded-xl border border-slate-800/30 overflow-hidden p-2">
              {filteredData.length > 0 ? (
                <SicChart 
                  data={[...filteredData].sort((a,b) => (a.date?.getTime() || 0) - (b.date?.getTime() || 0))} 
                  xKey="date" 
                  yKey="value" 
                  lei={manualLei !== "" ? manualLei : (filteredData.find(d => d.lei !== undefined)?.lei || 0)}
                  les={manualLes !== "" ? manualLes : (filteredData.find(d => d.les !== undefined)?.les || 100)}
                  yLabel={selectedMetric || MODES[mode].label}
                />
              ) : (
                <div className="h-full flex items-center justify-center text-slate-500 italic text-xs">Sin información de control SIC</div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-slate-900/60 border-slate-800/50 shadow-xl self-start">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Activity className={cn("h-5 w-5", MODES[mode].color)} />
            Estadísticas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 pt-2">
          <Table>
            <TableBody>
              {[
                { label: 'N', val: stats?.n || 0, color: 'text-slate-200' },
                { label: 'MEDIA', val: stats?.mean.toFixed(3) || "---", color: MODES[mode].color },
                { label: 'DESV. EST. σ', val: stats?.stdDev.toFixed(4) || "---", color: 'text-slate-200' },
                { label: 'CPK', val: stats?.cpk !== undefined ? stats.cpk.toFixed(3) : "---", color: 'text-amber-500 font-bold' },
                { label: 'LEI', val: stats?.lei.toFixed(2) || "---", color: 'text-red-500 opacity-60' },
                { label: 'LES', val: stats?.les.toFixed(2) || "---", color: 'text-red-500 opacity-60' },
              ].map((item, id) => (
                <TableRow key={id} className="border-slate-800/50">
                  <TableCell className="py-2 text-[10px] font-bold text-slate-500 uppercase">{item.label}</TableCell>
                  <TableCell className={cn("py-2 text-right font-mono text-sm", item.color)}>{item.val}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {stats && stats.cpk !== undefined && (
            <div className="mt-8">
              {stats.cpk < 1 ? (
                <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/20 text-red-400 space-y-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-[10px] font-bold uppercase">Baja Capacidad</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">El proceso no está centrado o tiene demasiada variabilidad.</p>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-emerald-400 space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="text-[10px] font-bold uppercase">Proceso Capaz</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">El proceso cumple satisfactoriamente con los estándares.</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}