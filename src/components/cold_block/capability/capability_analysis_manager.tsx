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
  AlertTriangle,
  FileSpreadsheet
} from "lucide-react";
import { parse, startOfDay, endOfDay, isWithinInterval } from "date-fns";
import { SicChart } from "./sic_chart";
import { GaussChart } from "./gauss_chart";
import { calculateCapabilityStats, CapabilityStats } from "@/utils/stats_utils";
import { Table, TableBody, TableCell, TableRow, TableHeader, TableHead } from "@/components/ui/table";
import { cn } from "@/lib/utils";

type AnalysisMode = 'TIEMPOS' | 'EMO' | 'VOLUMEN' | 'CONTEO';

interface ExcelDataRow {
  date: Date | null;
  marca: string;
  tankType?: string;
  filtroNum?: string;
  turno?: string;
  tipoCerveza?: string;
  value: number;
  lei?: number;
  les?: number;
  dynamicValues?: Record<string, number>;
}

const MODES: Record<AnalysisMode, { label: string; icon: React.ReactNode; color: string; accent: string }> = {
  TIEMPOS: { 
    label: 'Tiempos de llenado', 
    icon: <Clock className="h-5 w-5" />,
    color: 'text-blue-500',
    accent: '#3b82f6'
  },
  EMO: { 
    label: 'EMO en filtración', 
    icon: <Droplets className="h-5 w-5" />,
    color: 'text-amber-500',
    accent: '#f59e0b'
  },
  VOLUMEN: { 
    label: 'Volumen de inóculo', 
    icon: <Layers className="h-5 w-5" />,
    color: 'text-emerald-500',
    accent: '#10b981'
  },
  CONTEO: { 
    label: 'Conteo', 
    icon: <Database className="h-5 w-5" />,
    color: 'text-purple-500',
    accent: '#8b5cf6'
  },
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

  // Dynamic metrics for CONTEO
  const [availableMetrics, setAvailableMetrics] = useState<string[]>([]);
  const [selectedMetric, setSelectedMetric] = useState<string>("");

  // Filters
  const [dateRange, setDateRange] = useState<any>(undefined);
  const [selectedMarcas, setSelectedMarcas] = useState<string[]>([]);
  const [selectedTankTypes, setSelectedTankTypes] = useState<string[]>([]);
  const [selectedFiltros, setSelectedFiltros] = useState<string[]>([]);
  const [selectedTurnos, setSelectedTurnos] = useState<string[]>([]);
  const [selectedTiposCerveza, setSelectedTiposCerveza] = useState<string[]>([]);
  const [manualLei, setManualLei] = useState<number | "">("");
  const [manualLes, setManualLes] = useState<number | "">("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const colLetterToIndex = (letter: string) => {
    let index = 0;
    for (let i = 0; i < letter.length; i++) {
        index = index * 26 + letter.charCodeAt(i) - 64;
    }
    return index - 1;
  };

  const parseDate = (val: any): Date | null => {
    if (!val) return null;
    if (val instanceof Date) return val;
    if (typeof val === 'number') return new Date((val - 25569) * 86400 * 1000);
    const str = String(val).trim();
    if (!str) return null;
    const formats = ['dd/MM/yyyy', 'dd.MM.yyyy', 'yyyy-MM-dd', 'MM/dd/yyyy', 'd/M/yyyy', 'd.M.yyyy', 'dd/MM/yyyy HH:mm', 'dd.MM.yyyy HH:mm'];
    for (const f of formats) {
      const d = parse(str, f, new Date());
      if (!isNaN(d.getTime())) return d;
    }
    const fallback = new Date(str);
    return isNaN(fallback.getTime()) ? null : fallback;
  };

  const processWorkbook = (workbook: XLSX.WorkBook) => {
    try {
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" }) as any[][];
      if (jsonData.length <= 1) throw new Error("Archivo vacío o inválido.");
      
      const rows = mode === 'TIEMPOS' ? jsonData.slice(5) : jsonData.slice(1);
      const headers = mode === 'TIEMPOS' ? jsonData[4] : jsonData[0];
      
      let processed: ExcelDataRow[] = [];

      const timeToHours = (val: any) => {
        if (val === null || val === undefined || val === "") return 0;
        if (typeof val === 'number') return val * 24;
        const str = String(val).trim();
        if (str.includes(':')) {
          const parts = str.split(':').map(Number);
          return (parts[0] || 0) + (parts[1] || 0) / 60 + (parts[2] || 0) / 3600;
        }
        return parseFloat(str.replace(',', '.')) || 0;
      };

      if (mode === 'TIEMPOS') {
        processed = rows.map((row, idx) => {
          const date = parseDate(row[colLetterToIndex('I')]); 
          const marca = String(row[colLetterToIndex('G')] || '').trim();
          
          if (idx < 5) {
            console.log(`[DEBUG_TIEMPOS] Row: ${idx + 6}, I: "${row[colLetterToIndex('I')]}", Date: ${date?.toLocaleString()}`);
          }

          return {
            date,
            marca,
            tankType: String(row[colLetterToIndex('J')] || '').trim(), // J (9) - Tipo Ferm
            value: timeToHours(row[colLetterToIndex('K')]), // K (10) - Tiempo de llenado
            lei: timeToHours(row[colLetterToIndex('M')]), // M (12) - LI
            les: timeToHours(row[colLetterToIndex('N')]), // N (13) - LS
          };
        });
      } else if (mode === 'EMO') {
        const metrics = headers.slice(colLetterToIndex('G'), colLetterToIndex('K') + 1).map(h => String(h).trim() || "N/A");
        setAvailableMetrics(metrics);
        
        // Auto-select "EMO CFR" if present
        const defaultMetric = metrics.find(m => m.toUpperCase().includes("EMO CFR")) || metrics[0];
        if (metrics.length > 0) setSelectedMetric(defaultMetric);
        
        processed = rows.map(row => {
          const dynamicValues: Record<string, number> = {};
          metrics.forEach((m, i) => {
            dynamicValues[m] = parseFloat(String(row[colLetterToIndex('G') + i]).replace(',', '.')) || 0;
          });
          
          return {
            date: parseDate(row[colLetterToIndex('C')]), // Fecha (Col C)
            filtroNum: String(row[colLetterToIndex('D')] || '').trim(), // Filtro (Col D)
            turno: String(row[colLetterToIndex('E')] || '').trim(), // Turno (Col E)
            marca: String(row[colLetterToIndex('F')] || '').trim(), // Marca (Col F)
            tipoCerveza: String(row[colLetterToIndex('L')] || '').trim(), // Tipo de Cerveza (Col L)
            value: 0, // Will be set by metric selector
            dynamicValues
          };
        });
      } else if (mode === 'VOLUMEN') {
        processed = rows.map(row => ({
          date: parseDate(row[1]),
          marca: String(row[colLetterToIndex('A')] || '').trim(),
          tankType: String(row[colLetterToIndex('D')] || '').trim(),
          value: parseFloat(String(row[colLetterToIndex('N')]).replace(',', '.')) || 0,
        }));
      } else if (mode === 'CONTEO') {
        const metrics = headers.slice(colLetterToIndex('G'), colLetterToIndex('V') + 1).map(h => String(h));
        setAvailableMetrics(metrics);
        if (metrics.length > 0) setSelectedMetric(metrics[0]);
        processed = rows.map(row => {
          const dynamicValues: Record<string, number> = {};
          metrics.forEach((m, i) => {
            dynamicValues[m] = parseFloat(String(row[colLetterToIndex('G') + i]).replace(',', '.')) || 0;
          });
          return {
            date: parseDate(row[colLetterToIndex('D')]),
            marca: String(row[colLetterToIndex('B')] || '').trim(),
            value: 0,
            dynamicValues
          };
        });
      }

      const finalRows = processed.filter(r => r.date !== null);
      if (finalRows.length === 0 && processed.length > 0) {
        throw new Error(`Error: No se detectaron fechas en el archivo. Verifica el formato.`);
      }
      
      // Reset filters when a new file is successfully loaded
      setDateRange(undefined);
      setSelectedMarcas([]);
      setSelectedTankTypes([]);
      setSelectedFiltros([]);
      setSelectedTurnos([]);
      setSelectedTiposCerveza([]);
      setManualLei("");
      setManualLes("");
      
      setRawRows(finalRows);
      setError(null);
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

  const filteredData = useMemo(() => {
    return rawRows.filter(row => {
      if (dateRange?.from && row.date) {
        const start = startOfDay(dateRange.from);
        const end = dateRange.to ? endOfDay(dateRange.to) : endOfDay(dateRange.from);
        if (!isWithinInterval(row.date, { start, end })) return false;
      }
      if (selectedMarcas.length > 0 && !selectedMarcas.includes(row.marca)) return false;
      if (selectedTankTypes.length > 0 && row.tankType && !selectedTankTypes.includes(row.tankType)) return false;
      if (selectedFiltros.length > 0 && row.filtroNum && !selectedFiltros.includes(row.filtroNum)) return false;
      if (selectedTurnos.length > 0 && row.turno && !selectedTurnos.includes(row.turno)) return false;
      if (selectedTiposCerveza.length > 0 && row.tipoCerveza && !selectedTiposCerveza.includes(row.tipoCerveza)) return false;
      return true;
    }).map(row => ((mode === 'CONTEO' || mode === 'EMO') && selectedMetric ? { ...row, value: row.dynamicValues?.[selectedMetric] || 0 } : row));
  }, [rawRows, dateRange, selectedMarcas, selectedTankTypes, selectedFiltros, mode, selectedMetric]);

  const stats = useMemo(() => {
    const values = filteredData.map(d => d.value);
    const lei = manualLei !== "" ? manualLei : (filteredData[0]?.lei || 0);
    const les = manualLes !== "" ? manualLes : (filteredData[0]?.les || 100);
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

  const uniqueMarcas = useMemo(() => {
    let filtered = rawRows;
    if (dateRange?.from) {
      const start = startOfDay(dateRange.from);
      const end = dateRange.to ? endOfDay(dateRange.to) : endOfDay(dateRange.from);
      filtered = rawRows.filter(r => r.date && isWithinInterval(r.date, { start, end }));
    }
    return Array.from(new Set(filtered.map(r => r.marca).filter(Boolean))).sort();
  }, [rawRows, dateRange]);

  const uniqueTankTypes = useMemo(() => {
    let filtered = rawRows;
    if (dateRange?.from) {
      const start = startOfDay(dateRange.from);
      const end = dateRange.to ? endOfDay(dateRange.to) : endOfDay(dateRange.from);
      filtered = rawRows.filter(r => r.date && isWithinInterval(r.date, { start, end }));
    }
    return Array.from(new Set(filtered.map(r => r.tankType).filter(Boolean))).sort();
  }, [rawRows, dateRange]);

  const uniqueFiltros = useMemo(() => {
    let filtered = rawRows;
    if (dateRange?.from) {
      const start = startOfDay(dateRange.from);
      const end = dateRange.to ? endOfDay(dateRange.to) : endOfDay(dateRange.from);
      filtered = filtered.filter(r => r.date && isWithinInterval(r.date, { start, end }));
    }
    if (selectedMarcas.length > 0) {
      filtered = filtered.filter(r => selectedMarcas.includes(r.marca));
    }
    return Array.from(new Set(filtered.map(r => r.filtroNum).filter(Boolean))).sort();
  }, [rawRows, dateRange, selectedMarcas]);

  const uniqueTurnos = useMemo(() => {
    let filtered = rawRows;
    if (dateRange?.from) {
      const start = startOfDay(dateRange.from);
      const end = dateRange.to ? endOfDay(dateRange.to) : endOfDay(dateRange.from);
      filtered = filtered.filter(r => r.date && isWithinInterval(r.date, { start, end }));
    }
    if (selectedMarcas.length > 0) {
      filtered = filtered.filter(r => selectedMarcas.includes(r.marca));
    }
    return Array.from(new Set(filtered.map(r => r.turno).filter(Boolean))).sort();
  }, [rawRows, dateRange, selectedMarcas]);

  const uniqueTiposCerveza = useMemo(() => {
    let filtered = rawRows;
    if (dateRange?.from) {
      const start = startOfDay(dateRange.from);
      const end = dateRange.to ? endOfDay(dateRange.to) : endOfDay(dateRange.from);
      filtered = filtered.filter(r => r.date && isWithinInterval(r.date, { start, end }));
    }
    if (selectedMarcas.length > 0) {
      filtered = filtered.filter(r => selectedMarcas.includes(r.marca));
    }
    return Array.from(new Set(filtered.map(r => r.tipoCerveza).filter(Boolean))).sort();
  }, [rawRows, dateRange, selectedMarcas]);

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
      {/* Main Analysis Area */}
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
                    {mode === 'EMO' 
                      ? "Distribución Gaussian y Gráfica SIC basadas en EMO CFR (Columna G) y marcas seleccionadas"
                      : `Distribución Gaussian y Gráfica SIC para ${selectedMarcas.length > 0 ? selectedMarcas.join(', ') : 'todas las marcas'}`}
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 bg-slate-800/30 p-2 rounded-lg border border-slate-700/50">
                  <div className="flex flex-col">
                    <Label className="text-[9px] uppercase font-bold text-slate-500 mb-0.5">{mode === 'EMO' ? 'LI' : 'LEI'}</Label>
                    <Input type="number" value={manualLei} onChange={e => setManualLei(e.target.value === '' ? '' : Number(e.target.value))} className="h-7 w-16 text-[10px] font-mono bg-slate-950/50 border-slate-800" />
                  </div>
                  <div className="flex flex-col">
                    <Label className="text-[9px] uppercase font-bold text-slate-500 mb-0.5">{mode === 'EMO' ? 'LS' : 'LES'}</Label>
                    <Input type="number" value={manualLes} onChange={e => setManualLes(e.target.value === '' ? '' : Number(e.target.value))} className="h-7 w-16 text-[10px] font-mono bg-slate-950/50 border-slate-800" />
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500" onClick={() => setShowPreview(!showPreview)} title="Ver datos"><Info className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-red-400" onClick={() => setRawRows([])}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>

            {/* Filters Navigation */}
            <div className="flex flex-wrap items-center gap-4 p-3 bg-slate-950/40 rounded-lg border border-slate-800">
               <DatePickerWithRange 
                 date={dateRange} 
                 setDate={setDateRange} 
                 className="h-9 w-full sm:w-auto" 
                 minDate={minDataDate}
                 maxDate={maxDataDate}
               />
               <MultiSelect options={uniqueMarcas} selected={selectedMarcas} onChange={setSelectedMarcas} placeholder="Marcas" className="h-9 bg-slate-900 border-slate-800 min-w-[150px]" />
               {uniqueTankTypes.length > 0 && <MultiSelect options={uniqueTankTypes} selected={selectedTankTypes} onChange={setSelectedTankTypes} placeholder="Tanque" className="h-9 bg-slate-900 border-slate-800 min-w-[130px]" />}
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
            <div className="bg-slate-950/60 rounded-lg border border-blue-500/20 p-3 overflow-auto max-h-[150px] animate-in slide-in-from-top-2">
              <Table><TableHeader><TableRow className="border-slate-800 hover:bg-transparent"><TableHead className="h-7 text-[10px]">Fecha</TableHead><TableHead className="h-7 text-[10px]">Marca</TableHead><TableHead className="h-7 text-[10px] text-right">Valor</TableHead></TableRow></TableHeader><TableBody>{rawRows.slice(0, 5).map((r, i) => (<TableRow key={i} className="border-slate-900 hover:bg-transparent"><TableCell className="py-1 text-[10px] font-mono">{r.date?.toLocaleDateString()}</TableCell><TableCell className="py-1 text-[10px]">{r.marca}</TableCell><TableCell className="py-1 text-[10px] text-right font-mono">{r.value.toFixed(4)}</TableCell></TableRow>))}</TableBody></Table>
            </div>
          )}

          <div className="space-y-12">
            {/* Gauss Chart (Stack 1) */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">
                <BarChart3 className="h-3 w-3" /> Distribución Gaussiana (Campana de Gauss)
              </div>
              <div className="h-[350px] w-full bg-slate-950/20 rounded-xl border border-slate-800/30 overflow-hidden p-2">
                {stats && stats.n >= 2 && stats.stdDev > 0 ? (
                  <GaussChart stats={stats} />
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-500 italic gap-2 text-xs">
                    <Activity className="h-8 w-8 opacity-20" />
                    No hay suficientes datos distintos para la curva Gaussiana
                  </div>
                )}
              </div>
            </div>

            {/* SIC Chart (Stack 2) */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">
                <LineChartIcon className="h-3 w-3" /> Control Individual (Gráfica SIC)
              </div>
              <div className="h-[350px] w-full bg-slate-950/20 rounded-xl border border-slate-800/30 overflow-hidden p-2">
                {filteredData.length > 0 ? (
                  <SicChart 
                    data={[...filteredData].sort((a,b) => (a.date?.getTime() || 0) - (b.date?.getTime() || 0))} 
                    xKey="date" 
                    yKey="value" 
                    lei={manualLei !== "" ? manualLei : (filteredData[0]?.lei || 0)}
                    les={manualLes !== "" ? manualLes : (filteredData[0]?.les || 100)}
                    yLabel={selectedMetric || MODES[mode].label}
                  />
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-500 italic text-xs">Sin información de control SIC</div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Sidebar */}
      <Card className="bg-slate-900/60 border-slate-800/50 shadow-xl self-start h-full">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Activity className={cn("h-5 w-5", MODES[mode].color)} />
            Performance estadístico {mode === 'TIEMPOS' ? 'TIEMPOS' : mode}
          </CardTitle>
          <CardDescription className="text-xs">Resumen de métricas de capacidad</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-2">
          <Table>
            <TableBody>
              {[
                { label: 'N', val: stats?.n || 0, bold: false, color: 'text-slate-200' },
                { label: 'MEDIA', val: stats?.mean.toFixed(3) || "---", bold: true, color: MODES[mode].color },
                { label: 'MIN', val: stats?.min.toFixed(3) || "---", bold: false, color: 'text-slate-200' },
                { label: 'MÁX.', val: stats?.max.toFixed(3) || "---", bold: false, color: 'text-slate-200' },
                { label: 'DESV. EST. σ', val: stats?.stdDev.toFixed(4) || "---", bold: false, color: 'text-slate-200' },
                { label: 'CP', val: stats?.cp !== undefined ? stats.cp.toFixed(3) : "---", bold: true, color: 'text-amber-500 underline decoration-amber-500/30' },
                { label: 'CPK', val: stats?.cpk !== undefined ? stats.cpk.toFixed(3) : "---", bold: true, color: 'text-amber-500 font-bold' },
                { label: 'TARGET', val: stats?.target.toFixed(3) || "---", bold: false, color: 'text-emerald-500' },
                { label: 'LES', val: stats?.les.toFixed(2) || "---", bold: false, color: 'text-red-500 opacity-60' },
                { label: 'LEI', val: stats?.lei.toFixed(2) || "---", bold: false, color: 'text-red-500 opacity-60' },
              ].map((item, id) => (
                <TableRow key={id} className="border-slate-800/50 hover:bg-transparent">
                  <TableCell className="py-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">{item.label}</TableCell>
                  <TableCell className={cn("py-2 text-right font-mono text-sm", item.color, item.bold && "font-bold font-mono")}>{item.val}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {stats && (manualLei !== "" || manualLes !== "" || (filteredData[0]?.lei && filteredData[0]?.les)) && (
            <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {stats.cpk < 1 ? (
                <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/20 text-red-400 space-y-2 shadow-inner">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Baja Capacidad</span>
                  </div>
                  <p className="text-[11px] leading-relaxed opacity-80">
                    El Cpk es menor a 1.0, lo que indica que el proceso no está centrado o tiene demasiada variabilidad para los límites establecidos.
                  </p>
                </div>
              ) : stats.cpk >= 1.33 ? (
                <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-emerald-400 space-y-2 shadow-inner">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Proceso Capaz</span>
                  </div>
                  <p className="text-[11px] leading-relaxed opacity-80">
                    El Cpk es mayor a 1.33. El proceso es altamente estable y cumple satisfactoriamente con los estándares de calidad.
                  </p>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20 text-blue-400 space-y-2 shadow-inner">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Proceso Aceptable</span>
                  </div>
                  <p className="text-[11px] leading-relaxed opacity-80">
                    Capacidad aceptable (1.0 ≤ Cpk &lt; 1.33). El proceso cumple con los límites pero requiere supervisión para evitar desviaciones.
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
