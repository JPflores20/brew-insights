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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MultiSelect } from "@/components/ui/multi_select";
import { DatePickerWithRange } from "@/components/ui/date_range_picker";
import { DateRange } from "date-fns";
import { 
  FileSpreadsheet, 
  UploadCloud, 
  Loader2, 
  Activity, 
  BarChart3, 
  LineChart as LineChartIcon,
  Trash2,
  Clock,
  Droplets,
  Layers,
  Database
} from "lucide-react";
import { parse, startOfDay, endOfDay, isWithinInterval } from "date-fns";
import { SicChart } from "./SicChart";
import { GaussChart } from "./GaussChart";
import { calculateCapabilityStats, CapabilityStats } from "@/utils/stats_utils";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

type AnalysisMode = 'TIEMPOS' | 'EMO' | 'VOLUMEN' | 'CONTEO';

interface ExcelDataRow {
  date: Date | null;
  marca: string;
  tankType?: string;
  filtroNum?: string;
  value: number;
  lei?: number;
  les?: number;
  dynamicValues?: Record<string, number>;
}

const MODES: Record<AnalysisMode, { label: string; icon: React.ReactNode; color: string }> = {
  TIEMPOS: { 
    label: 'Tiempos de llenado', 
    icon: <Clock className="h-5 w-5" />,
    color: 'text-blue-500'
  },
  EMO: { 
    label: 'EMO en filtración', 
    icon: <Droplets className="h-5 w-5" />,
    color: 'text-emerald-500'
  },
  VOLUMEN: { 
    label: 'Volumen de inóculo', 
    icon: <Layers className="h-5 w-5" />,
    color: 'text-amber-500'
  },
  CONTEO: { 
    label: 'Conteo', 
    icon: <Database className="h-5 w-5" />,
    color: 'text-purple-500'
  },
};

export function CapabilityAnalysisManager() {
  return (
    <div className="space-y-8 pb-12">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
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

  // Dynamic metrics for CONTEO
  const [availableMetrics, setAvailableMetrics] = useState<string[]>([]);
  const [selectedMetric, setSelectedMetric] = useState<string>("");

  // Filters
  const [dateRange, setDateRange] = useState<any>(undefined);
  const [selectedMarcas, setSelectedMarcas] = useState<string[]>([]);
  const [selectedTankTypes, setSelectedTankTypes] = useState<string[]>([]);
  const [selectedFiltros, setSelectedFiltros] = useState<string[]>([]);
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
    if (typeof val === 'number') {
      // Excel numeric date
      return new Date((val - 25569) * 86400 * 1000);
    }
    const str = String(val).trim();
    if (!str) return null;

    // Try common formats
    const formats = ['dd/MM/yyyy', 'dd.MM.yyyy', 'yyyy-MM-dd', 'MM/dd/yyyy', 'd/M/yyyy', 'd.M.yyyy', 'dd/MM/yyyy HH:mm', 'dd.MM.yyyy HH:mm'];
    for (const f of formats) {
      const d = parse(str, f, new Date());
      if (!isNaN(d.getTime())) return d;
    }
    
    // Fallback: try raw Date constructor
    const fallback = new Date(str);
    if (!isNaN(fallback.getTime())) return fallback;

    return null;
  };

  const processWorkbook = (workbook: XLSX.WorkBook) => {
    try {
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" }) as any[][];
      
      if (jsonData.length <= 1) throw new Error("Archivo vacío o inválido.");

      // For TIEMPOS, skip first 5 rows (data starts at row 6)
      // Adjustment: The library reads columns with a -1 shift relative to Excel labels provided by the user
      const rows = mode === 'TIEMPOS' ? jsonData.slice(5) : jsonData.slice(1);
      const headers = mode === 'TIEMPOS' ? jsonData[4] : jsonData[0];
      
      let processed: ExcelDataRow[] = [];

      const timeToHours = (val: any) => {
        if (typeof val === 'number') return val * 24;
        if (typeof val === 'string' && val.includes(':')) {
          const parts = val.split(':').map(Number);
          return (parts[0] || 0) + (parts[1] || 0) / 60 + (parts[2] || 0) / 3600;
        }
        return parseFloat(val) || 0;
      };

      if (mode === 'TIEMPOS') {
        processed = rows.map(row => ({
          date: parseDate(row[colLetterToIndex('H')]), // Real date in H (Shifted from User I)
          marca: String(row[colLetterToIndex('F')] || ''), // Real Brand in F (Shifted from User G)
          tankType: String(row[colLetterToIndex('I')] || ''), // Real Tank in I (Shifted from User J)
          value: timeToHours(row[colLetterToIndex('J')]), // Real Time in J (Shifted from User K)
          lei: timeToHours(row[colLetterToIndex('L')]), // Real LI in L (Shifted from User M)
          les: timeToHours(row[colLetterToIndex('M')]), // Real LS in M (Shifted from User N)
        }));
      } else if (mode === 'EMO') {
        processed = rows.map(row => ({
          date: parseDate(row[0]),
          filtroNum: String(row[colLetterToIndex('D')] || ''),
          marca: String(row[colLetterToIndex('F')] || ''),
          value: parseFloat(row[colLetterToIndex('G')]) || 0,
        }));
      } else if (mode === 'VOLUMEN') {
        processed = rows.map(row => ({
          date: parseDate(row[1]),
          marca: String(row[colLetterToIndex('A')] || ''),
          tankType: String(row[colLetterToIndex('D')] || ''),
          value: parseFloat(row[colLetterToIndex('N')]) || 0,
        }));
      } else if (mode === 'CONTEO') {
        const metrics = headers.slice(colLetterToIndex('G'), colLetterToIndex('V') + 1).map(h => String(h));
        setAvailableMetrics(metrics);
        if (metrics.length > 0) setSelectedMetric(metrics[0]);

        processed = rows.map(row => {
          const dynamicValues: Record<string, number> = {};
          metrics.forEach((m, i) => {
            dynamicValues[m] = parseFloat(row[colLetterToIndex('G') + i]) || 0;
          });
          return {
            date: parseDate(row[colLetterToIndex('D')]),
            marca: String(row[colLetterToIndex('B')] || ''),
            value: 0,
            dynamicValues
          };
        });
      }

      const finalRows = processed.filter(r => r.date !== null);
      if (finalRows.length === 0 && processed.length > 0) {
        throw new Error(`Error: No se detectaron fechas en la columna ${mode === 'TIEMPOS' ? 'H' : 'correspondiente'}. Verifica el formato.`);
      }
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
    reader.onerror = () => {
      setError("Error de lectura del archivo");
      setLoading(false);
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
      return true;
    }).map(row => {
      if (mode === 'CONTEO' && selectedMetric) {
        return { ...row, value: row.dynamicValues?.[selectedMetric] || 0 };
      }
      return row;
    });
  }, [rawRows, dateRange, selectedMarcas, selectedTankTypes, selectedFiltros, mode, selectedMetric]);

  const stats = useMemo(() => {
    const values = filteredData.map(d => d.value);
    const lei = manualLei !== "" ? manualLei : (filteredData[0]?.lei || 0);
    const les = manualLes !== "" ? manualLes : (filteredData[0]?.les || 100);
    return calculateCapabilityStats(values, Number(lei), Number(les));
  }, [filteredData, manualLei, manualLes]);

  const uniqueMarcas = useMemo(() => Array.from(new Set(rawRows.map(r => r.marca).filter(Boolean))).sort(), [rawRows]);
  const uniqueTankTypes = useMemo(() => Array.from(new Set(rawRows.map(r => r.tankType).filter(Boolean))).sort(), [rawRows]);
  const uniqueFiltros = useMemo(() => Array.from(new Set(rawRows.map(r => r.filtroNum).filter(Boolean))).sort(), [rawRows]);

  return (
    <Card className="bg-slate-900/40 border-slate-800/50 backdrop-blur-md overflow-hidden flex flex-col h-full ring-1 ring-white/5 transition-all hover:ring-white/10">
      <CardHeader className="pb-4 border-b border-slate-800/50 bg-slate-900/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn("p-2 rounded-lg bg-slate-800/50", MODES[mode].color)}>
              {MODES[mode].icon}
            </div>
            <div>
              <CardTitle className="text-base font-bold">{MODES[mode].label}</CardTitle>
              <CardDescription className="text-[10px] uppercase font-semibold tracking-wider opacity-60">Reporte de Capacidad</CardDescription>
            </div>
          </div>
          {rawRows.length > 0 && (
            <Button variant="ghost" size="icon" className="text-slate-500 hover:text-red-400" onClick={() => setRawRows([])}>
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 p-0 flex flex-col">
        {rawRows.length === 0 ? (
          <div 
            className={cn(
              "flex-1 flex flex-col items-center justify-center p-12 m-4 border-2 border-dashed rounded-xl transition-all duration-300",
              isDragOver ? "border-blue-500 bg-blue-500/10" : "border-slate-800 hover:border-slate-700 bg-slate-900/20"
            )}
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setIsDragOver(false); if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]); }}
          >
            {loading ? (
              <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
            ) : (
              <>
                <div className="bg-slate-800/50 p-4 rounded-full mb-4">
                  <UploadCloud className="h-8 w-8 text-slate-400" />
                </div>
                <div className="text-center space-y-2">
                  <p className="text-sm font-semibold">Cargar {MODES[mode].label}</p>
                  <p className="text-xs text-slate-500">Arrastra tu archivo .xlsx o haz clic para subir</p>
                </div>
                <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx,.xls" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
                <Button variant="outline" size="sm" className="mt-6 border-slate-700" onClick={() => fileInputRef.current?.click()}>
                  Seleccionar Archivo
                </Button>
                {error && <p className="mt-4 text-[10px] text-red-500 font-medium">{error}</p>}
              </>
            )}
          </div>
        ) : (
          <div className="p-4 space-y-6 animate-in fade-in zoom-in-95 duration-300">
            {/* Filters Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-950/40 rounded-lg border border-slate-800">
              <div className="space-y-1">
                <Label className="text-[10px] uppercase font-bold text-slate-500">Rango de Fechas</Label>
                <DatePickerWithRange date={dateRange} setDate={setDateRange} className="h-8 w-full" />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] uppercase font-bold text-slate-500">Marcas</Label>
                <MultiSelect options={uniqueMarcas} selected={selectedMarcas} onChange={setSelectedMarcas} placeholder="Marcas" className="h-8 py-0" />
              </div>
              
              {uniqueTankTypes.length > 0 && (
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase font-bold text-slate-500">Tanque</Label>
                  <MultiSelect options={uniqueTankTypes} selected={selectedTankTypes} onChange={setSelectedTankTypes} placeholder="Tanques" className="h-8 py-0" />
                </div>
              )}
              
              {uniqueFiltros.length > 0 && (
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase font-bold text-slate-500">Filtro</Label>
                  <MultiSelect options={uniqueFiltros} selected={selectedFiltros} onChange={setSelectedFiltros} placeholder="Filtros" className="h-8 py-0" />
                </div>
              )}
              
              {mode === 'CONTEO' && (
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase font-bold text-slate-500">Métrica</Label>
                  <Select value={selectedMetric} onValueChange={setSelectedMetric}>
                    <SelectTrigger className="h-8 bg-slate-900/50 border-slate-700 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-700">
                      {availableMetrics.map(m => <SelectItem key={m} value={m} className="text-xs">{m}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              <div className="space-y-1">
                <Label className="text-[10px] uppercase font-bold text-slate-500">Límites (LI - LS)</Label>
                <div className="flex gap-2">
                  <Input 
                    type="number" 
                    placeholder="LI" 
                    value={manualLei} 
                    onChange={e => setManualLei(e.target.value === '' ? '' : Number(e.target.value))} 
                    className="h-8 font-mono text-xs bg-slate-900/50 border-slate-700"
                  />
                  <Input 
                    type="number" 
                    placeholder="LS" 
                    value={manualLes} 
                    onChange={e => setManualLes(e.target.value === '' ? '' : Number(e.target.value))} 
                    className="h-8 font-mono text-xs bg-slate-900/50 border-slate-700 transition-all focus:ring-1"
                  />
                </div>
              </div>
            </div>

            {/* Charts Section */}
            <Tabs defaultValue="gauss" className="w-full">
              <div className="flex items-center justify-between mb-2 px-1">
                <TabsList className="h-7 bg-slate-950 border border-slate-800 p-0.5">
                  <TabsTrigger value="gauss" className="h-6 text-[10px] gap-1.5 px-3">
                    <BarChart3 className="h-3 w-3" /> Gauss
                  </TabsTrigger>
                  <TabsTrigger value="sic" className="h-6 text-[10px] gap-1.5 px-3">
                    <LineChartIcon className="h-3 w-3" /> SIC
                  </TabsTrigger>
                </TabsList>
                <div className="text-[10px] font-mono text-slate-500 uppercase">
                  n = <span className="text-slate-200">{stats?.n || 0}</span>
                </div>
              </div>
              
              <TabsContent value="gauss" className="mt-2 space-y-4">
                <div className="h-[250px] bg-slate-950/20 rounded-lg p-2 border border-slate-800/30">
                  <GaussChart stats={stats} />
                </div>
                
                <div className="grid grid-cols-2 shadow-inner bg-slate-950/30 rounded-lg border border-slate-800/50 divide-x divide-slate-800 overflow-hidden">
                  <div className="p-3 text-center space-y-0.5">
                    <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Cp</p>
                    <p className={cn("text-lg font-mono font-bold", (stats?.cp || 0) < 1 ? "text-red-400" : "text-blue-400")}>
                      {stats?.cp.toFixed(3) || '---'}
                    </p>
                  </div>
                  <div className="p-3 text-center space-y-0.5">
                    <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Cpk</p>
                    <p className={cn("text-lg font-mono font-bold", (stats?.cpk || 0) < 1 ? "text-red-400" : "text-emerald-400")}>
                      {stats?.cpk.toFixed(3) || '---'}
                    </p>
                  </div>
                </div>

                <div className="bg-slate-950/20 rounded-lg border border-slate-800/30 p-2">
                  <Table>
                    <TableBody>
                      <TableRow className="border-slate-800 hover:bg-transparent">
                        <TableCell className="p-1 px-2 text-[10px] text-slate-500 uppercase font-medium">Media</TableCell>
                        <TableCell className="p-1 px-2 text-right font-mono text-xs">{stats?.mean.toFixed(3)}</TableCell>
                      </TableRow>
                      <TableRow className="border-transparent hover:bg-transparent">
                        <TableCell className="p-1 px-2 text-[10px] text-slate-500 uppercase font-medium">Std Dev</TableCell>
                        <TableCell className="p-1 px-2 text-right font-mono text-xs">{stats?.stdDev.toFixed(4)}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
              
              <TabsContent value="sic" className="mt-2">
                <div className="h-[380px] bg-slate-950/20 rounded-lg p-2 border border-slate-800/30">
                  <SicChart 
                    data={filteredData.sort((a,b) => (a.date?.getTime() || 0) - (b.date?.getTime() || 0))} 
                    xKey="date" 
                    yKey="value" 
                    lei={stats?.lei}
                    les={stats?.les}
                    yLabel={selectedMetric || MODES[mode].label}
                  />
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
