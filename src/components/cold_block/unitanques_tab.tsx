import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Sparkles, 
  Trash2, 
  Search, 
  Database, 
  Beer, 
  TrendingUp, 
  Loader2, 
  ClipboardList,
  AlertCircle,
  Download
} from "lucide-react";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

export interface UnitanqueData {
  tanque: string;
  marca: string;
  volumenHl: number;
  ppb: number;
  hrs: number;
}

/**
 * Parses raw plain text from unitanques.
 * Safely handles variable-length blocks and extracts all columns:
 * Tanque, Marca, HL, ppb, and Hrs.
 */
export function parseUnitanquesText(text: string): UnitanqueData[] {
  if (!text || !text.trim()) return [];

  // Split text into lines, trim, and filter out empty lines
  const lines = text.split(/\r?\n/).map(line => line.trim()).filter(line => line.length > 0);
  const data: UnitanqueData[] = [];
  
  const tanqueRegex = /^(BBT|UT|Unitanque|Tanque)[-\s]*\d+/i;
  
  const isKeyword = (line: string): boolean => {
    const l = line.toLowerCase();
    return (
      l === "hl" ||
      l === "volumen" ||
      l === "vol" ||
      l === "ppb" ||
      l === "hrs" ||
      l === "horas" ||
      /^\d+$/.test(line)
    );
  };

  let currentTanque: UnitanqueData | null = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Check if this line starts a new tanque
    if (tanqueRegex.test(line)) {
      // If we had a previous tanque, push it to our collection
      if (currentTanque) {
        data.push(currentTanque);
      }
      
      // Look ahead for the next line (brand/marca)
      const nextLine = (i + 1 < lines.length) ? lines[i + 1] : "";
      let marca = "NO SELECT";
      let skipNext = false;
      
      if (nextLine && !tanqueRegex.test(nextLine) && !isKeyword(nextLine)) {
        marca = nextLine;
        skipNext = true;
      }
      
      currentTanque = {
        tanque: line,
        marca: marca,
        volumenHl: 0,
        ppb: 0,
        hrs: 0
      };
      
      if (skipNext) {
        i++; // Consume the brand line
      }
    } else if (currentTanque) {
      // We are inside a tanque block. Look for HL, ppb, or Hrs lines.
      const hlRegex = /^(HL|Volumen|Vol)[:\s]*/i;
      const ppbRegex = /^ppb[:\s]*/i;
      const hrsRegex = /^(Hrs|Horas|Time)[:\s]*/i;
      
      if (hlRegex.test(line)) {
        // Option 1: Is there a number on the same line? (e.g. "HL: 1200")
        const sameLineMatch = line.match(/\d+/);
        if (sameLineMatch) {
          currentTanque.volumenHl = parseInt(sameLineMatch[0], 10);
        } else {
          // Option 2: Is the next line a number?
          const nextLine = (i + 1 < lines.length) ? lines[i + 1] : "";
          if (nextLine && /^\d+$/.test(nextLine)) {
            currentTanque.volumenHl = parseInt(nextLine, 10);
            i++; // Consume the volume line
          }
        }
      } else if (ppbRegex.test(line)) {
        // Option 1: Number on same line
        const sameLineMatch = line.match(/\d+/);
        if (sameLineMatch) {
          currentTanque.ppb = parseInt(sameLineMatch[0], 10);
        } else {
          // Option 2: Number on next line
          const nextLine = (i + 1 < lines.length) ? lines[i + 1] : "";
          if (nextLine && /^\d+$/.test(nextLine)) {
            currentTanque.ppb = parseInt(nextLine, 10);
            i++; // Consume the ppb line
          }
        }
      } else if (hrsRegex.test(line)) {
        // Option 1: Number on same line
        const sameLineMatch = line.match(/\d+/);
        if (sameLineMatch) {
          currentTanque.hrs = parseInt(sameLineMatch[0], 10);
        } else {
          // Option 2: Number on next line
          const nextLine = (i + 1 < lines.length) ? lines[i + 1] : "";
          if (nextLine && /^\d+$/.test(nextLine)) {
            currentTanque.hrs = parseInt(nextLine, 10);
            i++; // Consume the hrs line
          }
        }
      }
    }
  }
  
  // Push the final tanque if it exists
  if (currentTanque) {
    data.push(currentTanque);
  }
  
  return data;
}

export function UnitanquesTab() {
  const [inputText, setInputText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoadingSample, setIsLoadingSample] = useState(false);

  // Parse text into data array (memoized to avoid unneeded parses)
  const parsedData = useMemo(() => {
    return parseUnitanquesText(inputText);
  }, [inputText]);

  // Filter parsed data based on search query
  const filteredData = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return parsedData;
    return parsedData.filter(
      d => d.tanque.toLowerCase().includes(query) || d.marca.toLowerCase().includes(query)
    );
  }, [parsedData, searchQuery]);

  // Compute KPIs
  const totalTanques = parsedData.length;
  const totalVolumen = useMemo(() => {
    return parsedData.reduce((acc, curr) => acc + curr.volumenHl, 0);
  }, [parsedData]);

  const totalMarcas = useMemo(() => {
    return new Set(
      parsedData
        .map(d => d.marca)
        .filter(m => m && m !== "NO SELECT" && !m.includes("---"))
    ).size;
  }, [parsedData]);

  // Fetch sample text file
  const loadSampleData = async () => {
    setIsLoadingSample(true);
    try {
      const res = await fetch("/datos%20unitanques.txt");
      if (res.ok) {
        const text = await res.text();
        setInputText(text);
        setSearchQuery(""); // Reset search on load
      } else {
        console.error("Error fetching sample file:", res.statusText);
      }
    } catch (err) {
      console.error("Error fetching sample file:", err);
    } finally {
      setIsLoadingSample(false);
    }
  };

  const exportToExcel = async () => {
    if (parsedData.length === 0) return;
    
    const rows = parsedData.map(row => ({
      "Tanque": row.tanque,
      "Marca": row.marca,
      "Volumen (hl)": row.volumenHl,
      "Oxígeno (ppb)": row.ppb,
      "Tiempo (hrs)": row.hrs
    }));
    
    rows.push({
      "Tanque": "TOTAL",
      "Marca": "",
      "Volumen (hl)": totalVolumen,
      "Oxígeno (ppb)": null as any,
      "Tiempo (hrs)": null as any
    });
    
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Datos Gobierno");
    const headers = Object.keys(rows[0]);
    worksheet.addRow(headers);
    rows.forEach(r => {
      worksheet.addRow(Object.values(r));
    });
    
    const buf = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buf], { type: "application/octet-stream" }), "datos_gobierno.xlsx");
  };

  const clearData = () => {
    setInputText("");
    setSearchQuery("");
  };

  // Classify brands by color to make a premium-looking table
  const getBrandBadgeClass = (brand: string) => {
    const b = brand.toLowerCase();
    if (b.includes("corona")) {
      return "bg-amber-500/10 text-amber-400 border-amber-500/20";
    } else if (b.includes("modelo") || b.includes("negra")) {
      return "bg-blue-500/10 text-blue-400 border-blue-500/20";
    } else if (b.includes("victoria")) {
      return "bg-red-500/10 text-red-400 border-red-500/20";
    } else if (b.includes("pacífico") || b.includes("pacifico")) {
      return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
    } else if (b.includes("bud") || b.includes("busch")) {
      return "bg-sky-500/10 text-sky-400 border-sky-500/20";
    } else if (b.includes("barrilito") || b.includes("montejo")) {
      return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    } else if (b.includes("restos")) {
      return "bg-purple-500/10 text-purple-400 border-purple-500/20";
    } else if (b.includes("no select") || b.includes("---")) {
      return "bg-slate-500/10 text-slate-500 border-slate-500/20";
    }
    return "bg-slate-500/10 text-slate-300 border-slate-700/30";
  };

  return (
    <div className="space-y-6">
      {/* Input area card */}
      <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-md">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 gap-4">
          <div>
            <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-500" />
              Procesador de Texto - Gobierno
            </CardTitle>
            <CardDescription className="text-slate-400">
              Pega la información de los tanques directamente. Se procesará automáticamente en tiempo real.
            </CardDescription>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button 
              variant="outline" 
              onClick={loadSampleData} 
              disabled={isLoadingSample} 
              className="bg-slate-950 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-900 text-xs md:text-sm gap-2"
            >
              {isLoadingSample ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4 text-blue-500 animate-pulse" />
              )}
              Cargar Ejemplo
            </Button>
            {inputText && (
              <Button 
                variant="ghost" 
                onClick={clearData} 
                className="text-slate-400 hover:text-red-400 hover:bg-red-500/10 text-xs md:text-sm gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Limpiar
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Textarea 
            className="min-h-[220px] font-mono text-sm bg-slate-950/80 border-slate-800 text-slate-300 focus-visible:ring-blue-500/50 focus-visible:border-blue-500/50 placeholder:text-slate-600 resize-y" 
            placeholder="Pega el contenido del archivo de datos aquí..." 
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          />
        </CardContent>
      </Card>

      {/* Main Analysis Section */}
      {parsedData.length === 0 ? (
        <Card className="bg-slate-900/30 border-slate-800 border-dashed py-16 flex flex-col items-center justify-center text-center">
          <div className="bg-blue-500/10 p-4 rounded-full mb-4">
            <ClipboardList className="h-10 w-10 text-blue-500 animate-pulse" />
          </div>
          <h4 className="text-lg font-medium text-white mb-2">Esperando datos de Gobierno</h4>
          <p className="text-slate-400 text-sm max-w-md px-6 mb-6">
            Pega los datos del archivo en el campo de texto superior o carga los datos de ejemplo para visualizar el análisis.
          </p>
          <Button 
            onClick={loadSampleData} 
            disabled={isLoadingSample} 
            className="bg-blue-600 hover:bg-blue-500 text-white gap-2 font-medium"
          >
            {isLoadingSample ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            Cargar Datos de Ejemplo
          </Button>
        </Card>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-slate-900/40 border-slate-800/80 backdrop-blur-md relative overflow-hidden group hover:border-blue-500/30 transition-all duration-300">
              <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                <Database className="h-20 w-20 text-blue-500" />
              </div>
              <CardContent className="p-6">
                <p className="text-sm font-medium text-slate-400">Total Tanques</p>
                <h3 className="text-3xl font-bold text-white mt-2 font-mono tracking-tight">{totalTanques}</h3>
                <p className="text-xs text-blue-400 mt-2 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                  Tanques registrados y procesados
                </p>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/40 border-slate-800/80 backdrop-blur-md relative overflow-hidden group hover:border-amber-500/30 transition-all duration-300">
              <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                <TrendingUp className="h-20 w-20 text-amber-500" />
              </div>
              <CardContent className="p-6">
                <p className="text-sm font-medium text-slate-400">Volumen Total</p>
                <h3 className="text-3xl font-bold text-white mt-2 font-mono tracking-tight">
                  {totalVolumen.toLocaleString()} <span className="text-lg font-normal text-slate-400">hl</span>
                </h3>
                <p className="text-xs text-amber-400 mt-2">
                  Volumen total almacenado en frío
                </p>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/40 border-slate-800/80 backdrop-blur-md relative overflow-hidden group hover:border-emerald-500/30 transition-all duration-300">
              <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                <Beer className="h-20 w-20 text-emerald-500" />
              </div>
              <CardContent className="p-6">
                <p className="text-sm font-medium text-slate-400">Marcas en Gobierno</p>
                <h3 className="text-3xl font-bold text-white mt-2 font-mono tracking-tight">{totalMarcas}</h3>
                <p className="text-xs text-emerald-400 mt-2">
                  Marcas distintas actualmente activas
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Results table Card */}
          <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-md">
            <CardHeader className="flex flex-col md:flex-row md:items-center justify-between pb-6 gap-4 border-b border-slate-800/50">
              <div>
                <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
                  <ClipboardList className="h-5 w-5 text-blue-500" />
                  Resultados del Procesamiento
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Visualiza y filtra los datos detectados automáticamente.
                </CardDescription>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                <Button 
                  variant="outline"
                  onClick={exportToExcel}
                  className="bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 gap-2 text-xs md:text-sm"
                >
                  <Download className="h-4 w-4 text-emerald-500" />
                  Exportar Excel
                </Button>
                <div className="relative w-full sm:w-60 md:w-72">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <Input
                    placeholder="Buscar tanque o marca..."
                    className="pl-9 bg-slate-950/80 border-slate-800 text-white placeholder-slate-500 focus-visible:ring-blue-500/50 focus-visible:border-blue-500/50"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {filteredData.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <AlertCircle className="h-8 w-8 text-slate-500 mb-2" />
                  <p className="text-slate-400 font-medium">No se encontraron coincidencias</p>
                  <p className="text-xs text-slate-600 mt-1">Intenta con otros términos de búsqueda.</p>
                </div>
              ) : (
                <div className="max-h-[550px] overflow-y-auto rounded-md border border-slate-800 bg-slate-950/40">
                  <Table className="relative border-collapse">
                    <TableHeader className="bg-slate-950/90 backdrop-blur-sm sticky top-0 z-10 border-b border-slate-800">
                      <TableRow className="border-slate-800 hover:bg-transparent">
                        <TableHead className="text-slate-300 font-semibold w-[20%]">Tanque</TableHead>
                        <TableHead className="text-slate-300 font-semibold w-[25%]">Marca</TableHead>
                        <TableHead className="text-slate-300 font-semibold text-right w-[18%]">Volumen (hl)</TableHead>
                        <TableHead className="text-slate-300 font-semibold text-right w-[18%]">Oxígeno (ppb)</TableHead>
                        <TableHead className="text-slate-300 font-semibold text-right w-[19%]">Tiempo (hrs)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredData.map((row, index) => (
                        <TableRow key={index} className="border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                          <TableCell className="font-semibold text-slate-200 font-mono">{row.tanque}</TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getBrandBadgeClass(row.marca)}`}>
                              {row.marca}
                            </span>
                          </TableCell>
                          <TableCell className="text-right font-mono text-blue-400 font-bold">
                            {row.volumenHl.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right font-mono text-slate-300">
                            {row.ppb.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right font-mono text-slate-300">
                            {row.hrs.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
