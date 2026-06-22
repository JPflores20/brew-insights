import { useState, useRef, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Upload, 
  Sparkles, 
  Trash2, 
  Download, 
  Settings, 
  Key, 
  Loader2, 
  AlertCircle, 
  CheckCircle2, 
  Edit3,
  FileImage,
  ChevronDown,
  ChevronUp,
  LayoutGrid
} from "lucide-react";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { toast } from "@/hooks/use_toast";

// Real transcribed data from the user's screenshot ("OCUPACION EN UNITANQUES")
const SIMULATED_OCUPACION_DATA = [
  // TIPO C
  { tipo: "Tipo C", tcc: "001", marca: "11", volumen: 281, porcentaje: 15.5 },
  { tipo: "Tipo C", tcc: "002", marca: "11", volumen: 988, porcentaje: 54.5 },
  { tipo: "Tipo C", tcc: "003", marca: "1", volumen: 1249, porcentaje: 69.0 },
  { tipo: "Tipo C", tcc: "004", marca: "17", volumen: 960, porcentaje: 53.0 },
  { tipo: "Tipo C", tcc: "005", marca: "1", volumen: 27, porcentaje: 1.4 },
  { tipo: "Tipo C", tcc: "006", marca: "11", volumen: 216, porcentaje: 11.9 },
  { tipo: "Tipo C", tcc: "007", marca: "11", volumen: 1222, porcentaje: 67.5 },
  { tipo: "Tipo C", tcc: "008", marca: "19", volumen: 963, porcentaje: 53.2 },
  { tipo: "Tipo C", tcc: "009", marca: "11", volumen: 941, porcentaje: 51.9 },
  { tipo: "Tipo C", tcc: "010", marca: "11", volumen: 1325, porcentaje: 73.2 },
  { tipo: "Tipo C", tcc: "011", marca: "11", volumen: 589, porcentaje: 32.5 },
  { tipo: "Tipo C", tcc: "012", marca: "19", volumen: 916, porcentaje: 50.6 },
  { tipo: "Tipo C", tcc: "013", marca: "19", volumen: 930, porcentaje: 51.3 },
  { tipo: "Tipo C", tcc: "014", marca: "19", volumen: 890, porcentaje: 49.1 },
  { tipo: "Tipo C", tcc: "015", marca: "1", volumen: 945, porcentaje: 52.2 },
  { tipo: "Tipo C", tcc: "016", marca: "11", volumen: 1185, porcentaje: 65.4 },
  { tipo: "Tipo C", tcc: "017", marca: "11", volumen: 797, porcentaje: 44.0 },
  { tipo: "Tipo C", tcc: "018", marca: "11", volumen: 1176, porcentaje: 64.9 },
  { tipo: "Tipo C", tcc: "019", marca: "19", volumen: 751, porcentaje: 41.4 },
  { tipo: "Tipo C", tcc: "020", marca: "11", volumen: 993, porcentaje: 54.8 },
  { tipo: "Tipo C", tcc: "021", marca: "2", volumen: 0, porcentaje: 0.0 },
  { tipo: "Tipo C", tcc: "022", marca: "19", volumen: 809, porcentaje: 44.6 },

  // TIPO B
  { tipo: "Tipo B", tcc: "023", marca: "1", volumen: 2955, porcentaje: 57.9 },
  { tipo: "Tipo B", tcc: "024", marca: "33", volumen: 0, porcentaje: 0.0 },
  { tipo: "Tipo B", tcc: "025", marca: "30", volumen: 3107, porcentaje: 60.9 },
  { tipo: "Tipo B", tcc: "026", marca: "34", volumen: 1034, porcentaje: 20.2 },
  { tipo: "Tipo B", tcc: "027", marca: "19", volumen: 2896, porcentaje: 56.7 },
  { tipo: "Tipo B", tcc: "028", marca: "34", volumen: 2016, porcentaje: 39.5 },
  { tipo: "Tipo B", tcc: "029", marca: "31", volumen: 3123, porcentaje: 61.2 },
  { tipo: "Tipo B", tcc: "030", marca: "11", volumen: 1765, porcentaje: 34.6 },
  { tipo: "Tipo B", tcc: "031", marca: "19", volumen: 2863, porcentaje: 56.1 },
  { tipo: "Tipo B", tcc: "032", marca: "19", volumen: 95, porcentaje: 1.8 },
  { tipo: "Tipo B", tcc: "033", marca: "11", volumen: 2069, porcentaje: 40.5 },
  { tipo: "Tipo B", tcc: "034", marca: "33", volumen: 2840, porcentaje: 55.6 },
  { tipo: "Tipo B", tcc: "035", marca: "33", volumen: 2879, porcentaje: 56.4 },
  { tipo: "Tipo B", tcc: "036", marca: "11", volumen: 1090, porcentaje: 21.3 },
  { tipo: "Tipo B", tcc: "037", marca: "34", volumen: 3084, porcentaje: 60.4 },
  { tipo: "Tipo B", tcc: "038", marca: "1", volumen: 2886, porcentaje: 56.5 },

  // TIPO A
  { tipo: "Tipo A", tcc: "039", marca: "1", volumen: 7149, porcentaje: 65.5 },
  { tipo: "Tipo A", tcc: "040", marca: "19", volumen: 0, porcentaje: 0.0 },
  { tipo: "Tipo A", tcc: "041", marca: "11", volumen: 10875, porcentaje: 99.7 },
  { tipo: "Tipo A", tcc: "042", marca: "1", volumen: 8356, porcentaje: 76.6 },
  { tipo: "Tipo A", tcc: "043", marca: "4", volumen: 5867, porcentaje: 53.8 },
  { tipo: "Tipo A", tcc: "044", marca: "1", volumen: 7828, porcentaje: 71.8 },
  { tipo: "Tipo A", tcc: "045", marca: "2", volumen: 9171, porcentaje: 84.1 },
  { tipo: "Tipo A", tcc: "046", marca: "19", volumen: 5422, porcentaje: 49.7 },
  { tipo: "Tipo A", tcc: "047", marca: "1", volumen: 6609, porcentaje: 60.6 },
  { tipo: "Tipo A", tcc: "048", marca: "19", volumen: 5057, porcentaje: 46.3 },
  { tipo: "Tipo A", tcc: "049", marca: "34", volumen: 5768, porcentaje: 52.9 },
  { tipo: "Tipo A", tcc: "050", marca: "2", volumen: 1117, porcentaje: 10.2 }
];

export function DigitizerTab() {
  const [isDragging, setIsDragging] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  // Selected Template Type
  const [templateType, setTemplateType] = useState<"ocupacion" | "operacion">("operacion");
  
  // Dynamic columns and rows
  const [columns, setColumns] = useState<string[]>([]);
  const [extractedData, setExtractedData] = useState<Record<string, any>[]>([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // API Key Config
  const [showConfig, setShowConfig] = useState(false);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem("gemini_ocr_api_key") || "");
  const [isApiKeySaved, setIsApiKeySaved] = useState(!!localStorage.getItem("gemini_ocr_api_key"));

  // Inline editing state
  const [editingCell, setEditingCell] = useState<{ rowIndex: number; field: string } | null>(null);
  const [editValue, setEditValue] = useState<string>("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Translate keys to friendly Spanish labels
  const getColumnLabel = (key: string): string => {
    const labels: Record<string, string> = {
      tipo: "Tipo Tanque",
      tcc: "TCC (Tanque)",
      tanque: "Tanque",
      estado_modo: "Modo",
      estado_detalle: "Detalle Edo.",
      marca: "Marca",
      volumen: "Volumen (hl)",
      oxigeno: "Oxígeno (ppb)",
      ciclos_acido_1: "Acido 1",
      ciclos_acido_2: "Acido 2",
      ciclos_sosa_1: "Sosa 1",
      ciclos_sosa_2: "Sosa 2",
      porcentaje: "Porcentaje (%)",
      estado: "Estado",
      ciclos: "Ciclos"
    };
    return labels[key.toLowerCase()] || key.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
  };

  // Translate keys to friendly Spanish labels
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    setError(null);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Por favor carga únicamente archivos de imagen (PNG, JPG, JPEG).");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64String = event.target?.result as string;
      setImagePreview(base64String);
      runOCR(base64String, file.name);
    };
    reader.onerror = () => {
      setError("Error al leer el archivo de imagen.");
    };
    reader.readAsDataURL(file);
  };

  const [rawOcrText, setRawOcrText] = useState<string | null>(null);

  // Process OCR
  const runOCR = async (base64Image: string, fileName: string) => {
    setIsLoading(true);
    setError(null);
    setExtractedData([]);
    setColumns([]);
    setRawOcrText(null);

    const base64Data = base64Image.split(",")[1];

    if (isApiKeySaved && apiKey.trim()) {
      // REAL GEMINI VISION API CALL WITH TEMPLATE GUIDANCE
      try {
        let promptText = "";
        if (templateType === "ocupacion") {
          promptText = "Analyze this image representing 'OCUPACION EN UNITANQUES' containing tables under categories TIPO C, TIPO B, TIPO A with columns TCC, M., hl, %. Extract all rows and return a JSON object with properties 'columns' (exactly: ['tipo', 'tcc', 'marca', 'volumen', 'porcentaje']) and 'rows' (an array of objects). 'tipo' should capture the category (e.g. 'Tipo C', 'Tipo B', 'Tipo A'). 'tcc' is the tank code. 'marca' is the brand ID. 'volumen' is the volume in hl (number). 'porcentaje' is the percentage (number). Return ONLY the raw JSON object. Do not wrap it in markdown blocks.";
        } else {
          promptText = "Extract the operation table in this image (e.g. TANQUE, ESTADO, MARCA, VOL, OXY, CICLOS ACIDO, CICLOS SOSA). Return a JSON object with properties 'columns' (exactly: ['tanque', 'estado_modo', 'estado_detalle', 'marca', 'volumen', 'oxigeno', 'ciclos_acido_1', 'ciclos_acido_2', 'ciclos_sosa_1', 'ciclos_sosa_2']) and 'rows' (an array of objects). For 'estado_modo' capture the single letter inside the color box (A, M, etc). For 'estado_detalle' capture the text next to it (e.g., '........', 'Mo. vac'). Extract ONLY the numbers for 'volumen' and 'oxigeno' without units (e.g., 266 instead of '266 hl'). Under 'CICLOS ACIDO', split into two columns: 'ciclos_acido_1' (first box, e.g. cyan) and 'ciclos_acido_2' (second box, e.g. yellow). Do the same for 'CICLOS SOSA' -> 'ciclos_sosa_1' and 'ciclos_sosa_2'. Return ONLY the raw JSON object. Do not wrap it in markdown blocks.";
        }

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey.trim()}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    { text: promptText },
                    {
                      inlineData: {
                        mimeType: "image/jpeg",
                        data: base64Data,
                      }
                    }
                  ]
                }
              ],
              generationConfig: {
                responseMimeType: "application/json"
              }
            })
          }
        );

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData?.error?.message || `Error del servidor API (${response.status})`);
        }

        const resData = await response.json();
        const jsonText = resData?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!jsonText) {
          throw new Error("La API de Gemini no devolvió ningún texto estructurado.");
        }

        const parsed = JSON.parse(jsonText.trim());
        if (parsed && Array.isArray(parsed.columns) && Array.isArray(parsed.rows)) {
          setColumns(parsed.columns);
          setExtractedData(parsed.rows);
        } else if (Array.isArray(parsed)) {
          // If it returned flat array of rows, try to deduce columns
          const keys = Object.keys(parsed[0] || {});
          setColumns(keys);
          setExtractedData(parsed);
        } else {
          throw new Error("El formato de respuesta de la API no coincide con la estructura esperada.");
        }
      } catch (err: any) {
        console.error("OCR API Error:", err);
        setError(`Error en extracción OCR Real: ${err.message || err}. Cambiando a simulación local...`);
        setTimeout(() => {
          generateSimulatedData();
        }, 1500);
      } finally {
        setIsLoading(false);
      }
    } else {
      // SIMULATED OCR MODE
      setTimeout(() => {
        generateSimulatedData();
        setIsLoading(false);
      }, 1800);
    }
  };

  // Generate Simulation Data based on selected template
  const generateSimulatedData = () => {
    if (templateType === "ocupacion") {
      setColumns(["tipo", "tcc", "marca", "volumen", "porcentaje"]);
      setExtractedData(SIMULATED_OCUPACION_DATA);
    } else {
      setColumns(["tanque", "estado_modo", "estado_detalle", "marca", "volumen", "oxigeno", "ciclos_acido_1", "ciclos_acido_2", "ciclos_sosa_1", "ciclos_sosa_2"]);
      
      const brands = ["CORONA", "NEGRA M. E", "VICTORIA", "PACIFICO", "MICHELOB", "COR EUROP", "--------"];
      const modos = ["A", "M"];
      const detalles = ["........", "Mo. vac", "Ce.1 fill", "Ce.2 fill"];
      const simData = [];
      
      for (let i = 1; i <= 10; i++) {
        const isSelect = Math.random() > 0.15;
        const brand = isSelect ? brands[Math.floor(Math.random() * (brands.length - 1))] : "--------";
        const modo = modos[Math.floor(Math.random() * modos.length)];
        const detalle = detalles[Math.floor(Math.random() * detalles.length)];
        const volume = brand === "--------" ? 0 : Math.floor(Math.random() * 2000) + 100;
        const oxygen = brand === "--------" ? 0 : Math.floor(Math.random() * 30);
        
        simData.push({
          tanque: `TQ ${i.toString().padStart(2, '0')}`,
          estado_modo: modo,
          estado_detalle: detalle,
          marca: brand,
          volumen: volume,
          oxigeno: oxygen,
          ciclos_acido_1: Math.floor(Math.random() * 60) + 1,
          ciclos_acido_2: Math.floor(Math.random() * 4),
          ciclos_sosa_1: 60,
          ciclos_sosa_2: Math.floor(Math.random() * 60)
        });
      }
      setExtractedData(simData);
    }
  };

  // Start Cell Edit
  const startEdit = (rowIndex: number, field: string, value: any) => {
    setEditingCell({ rowIndex, field });
    setEditValue(String(value));
  };

  // Save Cell Edit
  const saveCell = () => {
    if (!editingCell) return;
    const { rowIndex, field } = editingCell;
    const updated = [...extractedData];
    
    // Parse values depending on template and cell type
    if (
      field === "volumen" || 
      field === "oxigeno" || 
      field === "ciclos" || 
      field === "porcentaje" ||
      field === "ciclos_acido_1" || field === "ciclos_acido_2" ||
      field === "ciclos_sosa_1" || field === "ciclos_sosa_2"
    ) {
      const parsedNum = Number(editValue);
      updated[rowIndex][field] = isNaN(parsedNum) ? 0 : parsedNum;
    } else {
      updated[rowIndex][field] = editValue;
    }
    
    setExtractedData(updated);
    setEditingCell(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      saveCell();
    } else if (e.key === "Escape") {
      setEditingCell(null);
    }
  };

  // Export Excel
  const exportToExcel = async () => {
    if (extractedData.length === 0) return;

    const exportRows = extractedData.map(row => {
      const formattedRow: Record<string, any> = {};
      columns.forEach(col => {
        formattedRow[getColumnLabel(col)] = row[col];
      });
      return formattedRow;
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Datos Digitalizados");
    const headers = Object.keys(exportRows[0]);
    worksheet.addRow(headers);
    exportRows.forEach(r => {
      worksheet.addRow(Object.values(r));
    });

    const today = new Date().toISOString().split("T")[0];
    const fileName = `bloque_frio_datos_${today}.xlsx`;

    const buf = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buf], { type: "application/octet-stream" }), fileName);
  };

  const handleSaveApiKey = () => {
    localStorage.setItem("gemini_ocr_api_key", apiKey);
    setIsApiKeySaved(true);
    toast({
      title: "API Key guardada",
      description: "Tu clave se ha guardado de forma segura en tu navegador.",
    });
  };

  const clearAll = () => {
    setImagePreview(null);
    setExtractedData([]);
    setColumns([]);
    setError(null);
    setEditingCell(null);
  };

  // Badges styles
  const getBrandBadgeClass = (brand: string) => {
    const b = String(brand).toLowerCase();
    if (b.includes("cor europ")) return "bg-orange-500/10 text-orange-400 border-orange-500/20";
    if (b.includes("corona")) return "bg-amber-500/10 text-amber-400 border-amber-500/20";
    if (b.includes("modelo") || b.includes("negra")) return "bg-blue-500/10 text-blue-400 border-blue-500/20";
    if (b.includes("victoria")) return "bg-red-500/10 text-red-400 border-red-500/20";
    if (b.includes("pacífico") || b.includes("pacifico")) return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
    if (b.includes("michelob")) return "bg-indigo-500/10 text-indigo-400 border-indigo-500/20";
    if (b.includes("barrilito")) return "bg-orange-600/10 text-orange-500 border-orange-600/20";
    if (b.includes("no select") || b === "vacío" || b.includes("---")) return "bg-slate-500/10 text-slate-500 border-slate-500/20";
    return "bg-slate-500/10 text-slate-300 border-slate-700/30";
  };

  const getStatusBadgeClass = (status: string) => {
    const s = String(status).toLowerCase();
    if (s.includes("lleno")) return "bg-green-500/10 text-green-400 border-green-500/20";
    if (s.includes("vacío") || s.includes("vacio")) return "bg-slate-500/10 text-slate-400 border-slate-500/20";
    if (s.includes("lavando")) return "bg-sky-500/10 text-sky-400 border-sky-500/20";
    if (s.includes("filtrando")) return "bg-purple-500/10 text-purple-400 border-purple-500/20";
    return "bg-amber-500/10 text-amber-400 border-amber-500/20";
  };

  return (
    <div className="space-y-6">
      
      {/* Configuration & Template Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Template selector */}
        <div className="flex items-center gap-3 bg-slate-900/30 border border-slate-800 rounded-xl p-4">
          <div className="bg-blue-500/10 p-2 rounded-lg shrink-0">
            <LayoutGrid className="h-5 w-5 text-blue-500" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-white">Plantilla del Tablero</h4>
            <div className="mt-1 flex gap-2">
              <button
                onClick={() => setTemplateType("ocupacion")}
                className={`px-3 py-1 rounded text-xs font-medium border transition-colors ${
                  templateType === "ocupacion" 
                    ? "bg-blue-600 text-white border-blue-500 shadow-md" 
                    : "bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200"
                }`}
              >
                Ocupación en Unitanques (TCC, M., hl, %)
              </button>
              <button
                onClick={() => setTemplateType("operacion")}
                className={`px-3 py-1 rounded text-xs font-medium border transition-colors ${
                  templateType === "operacion" 
                    ? "bg-blue-600 text-white border-blue-500 shadow-md" 
                    : "bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200"
                }`}
              >
                Operación Detallada (Edo, Oxy, Ciclos)
              </button>
            </div>
          </div>
        </div>

        {/* API Key configuration status */}
        <div className="flex justify-between items-center bg-slate-900/30 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-500/10 p-2 rounded-lg shrink-0">
              <Settings className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">Configuración del OCR</h4>
              <p className="text-xs text-slate-400">
                {isApiKeySaved 
                  ? "Conectado a la API Vision Real (Gemini)" 
                  : "Modo Simulación Activo (Sin clave de API)"}
              </p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            onClick={() => setShowConfig(!showConfig)}
            className="text-slate-400 hover:text-white flex items-center gap-1 text-xs shrink-0"
          >
            {isApiKeySaved ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Key className="h-4 w-4 text-slate-500" />}
            Clave API
            {showConfig ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </Button>
        </div>

      </div>

      {showConfig && (
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-white">Configurar Gemini API Key</CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Ingresa tu clave de API de Gemini para procesar capturas reales. La clave se almacena localmente en tu navegador.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                type="password"
                placeholder="Ingresa tu API Key (AIzaSy...)"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="bg-slate-950 border-slate-800 text-white placeholder-slate-600 focus-visible:ring-blue-500/50"
              />
              <Button onClick={handleSaveApiKey} className="bg-blue-600 hover:bg-blue-500 text-white">
                Guardar
              </Button>
            </div>
            {isApiKeySaved && (
              <p className="text-xs text-green-500 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> Clave configurada. Las imágenes que cargues se procesarán con OCR Real de Gemini.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* DISABLED STATE */}
      <Card className="bg-slate-900/30 border-amber-500/20 p-12 flex flex-col items-center justify-center text-center">
        <AlertCircle className="h-12 w-12 text-amber-500 mb-4 opacity-80" />
        <h3 className="text-lg font-medium text-white mb-2">Módulo Deshabilitado</h3>
        <p className="text-slate-400 max-w-md text-sm">
          El digitalizador se encuentra temporalmente deshabilitado por razones de seguridad. 
          Por favor, genera una nueva clave de API antes de reactivarlo.
        </p>
      </Card>

      {/* Main Drag & Drop Zone (Oculto) */}
      <div className="hidden">
        
        {/* Left Side: Upload zone */}
        <div className="lg:col-span-1 space-y-4">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="image/*" 
            className="hidden" 
          />
          
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={triggerFileSelect}
            className={`min-h-[260px] border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-all duration-300 ${
              isDragging 
                ? "border-blue-500 bg-blue-500/5 scale-[1.02]" 
                : "border-slate-800 bg-slate-900/30 hover:border-slate-700 hover:bg-slate-900/20"
            }`}
          >
            {imagePreview ? (
              <div className="space-y-4 w-full h-full relative group">
                <div className="max-h-[180px] w-full rounded-lg overflow-hidden border border-slate-800/80 bg-slate-950 flex items-center justify-center">
                  <img src={imagePreview} alt="Preview" className="max-h-[180px] object-contain" />
                </div>
                <p className="text-xs text-slate-400 font-mono truncate px-4">Imagen cargada correctamente</p>
                <div className="absolute inset-0 bg-slate-950/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                  <p className="text-xs text-white font-medium flex items-center gap-1 bg-slate-900 px-3 py-1.5 rounded-md border border-slate-800 shadow-md">
                    <Upload className="h-3 w-3 text-blue-500" />
                    Cambiar Imagen
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-slate-950/40 rounded-full border border-slate-800 w-fit mx-auto text-slate-400 transition-transform group-hover:scale-110">
                  <Upload className="h-8 w-8 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Arrastra y suelta tu captura de pantalla</p>
                  <p className="text-xs text-slate-500 mt-1">Soporta formatos PNG, JPG, JPEG</p>
                </div>
                <Button variant="outline" className="bg-slate-950 border-slate-800 text-slate-300 text-xs gap-1">
                  Buscar Archivo
                </Button>
              </div>
            )}
          </div>

          {imagePreview && (
            <Button 
              variant="ghost" 
              onClick={clearAll} 
              className="w-full text-slate-400 hover:text-red-400 hover:bg-red-500/10 gap-2 border border-slate-800/40"
            >
              <Trash2 className="h-4 w-4" />
              Limpiar Captura
            </Button>
          )}
        </div>

        {/* Right Side: Instructions & Preview Status */}
        <div className="lg:col-span-2 flex flex-col justify-between">
          <Card className="bg-slate-900/50 border-slate-800 h-full flex flex-col justify-between">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
                <FileImage className="h-5 w-5 text-blue-500" />
                Flujo de Digitalización
              </CardTitle>
              <CardDescription className="text-slate-400">
                Instrucciones para extraer datos de forma estructurada según la plantilla seleccionada.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 flex-1 flex flex-col justify-between pt-2">
              <div className="space-y-3">
                <div className="flex gap-3 text-xs md:text-sm">
                  <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-mono font-bold shrink-0">1</span>
                  <p className="text-slate-300">Selecciona arriba el tipo de plantilla correspondiente a tu captura.</p>
                </div>
                <div className="flex gap-3 text-xs md:text-sm">
                  <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-mono font-bold shrink-0">2</span>
                  <p className="text-slate-300">Arrastra la captura del tablero de control. El OCR mapeará automáticamente las columnas detectadas.</p>
                </div>
                <div className="flex gap-3 text-xs md:text-sm">
                  <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-mono font-bold shrink-0">3</span>
                  <p className="text-slate-300">Haz clic en cualquier celda de la tabla inferior para corregir lecturas y presiona "Exportar a Excel" cuando termines.</p>
                </div>
              </div>

              {/* Status or Actions */}
              <div className="pt-6 border-t border-slate-800/50 mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="text-xs text-slate-400">
                  {isLoading && (
                    <span className="flex items-center gap-2 text-blue-400">
                      <Loader2 className="h-4 w-4 animate-spin" /> Procesando imagen mediante OCR inteligente...
                    </span>
                  )}
                  {extractedData.length > 0 && !isLoading && (
                    <div className="flex flex-col gap-1">
                      <span className="flex items-center gap-1.5 text-green-500 font-semibold">
                        <CheckCircle2 className="h-4 w-4" /> Extracción completada ({extractedData.length} tanques detectados).
                      </span>
                      {!isApiKeySaved && (
                        <span className="flex items-center gap-1.5 text-amber-500 font-semibold bg-amber-500/10 p-1.5 rounded-md border border-amber-500/20">
                          <AlertCircle className="h-4 w-4" /> ATENCIÓN: Estás en Modo Simulación. Los datos mostrados son aleatorios porque no has configurado una Clave API.
                        </span>
                      )}
                    </div>
                  )}
                  {error && (
                    <div className="flex flex-col gap-2 w-full mt-2">
                      <span className="flex items-center gap-1.5 text-red-500 font-semibold bg-red-500/10 p-2 rounded-md border border-red-500/20">
                        <AlertCircle className="h-4 w-4 shrink-0" /> 
                        {error}
                      </span>
                      {rawOcrText && (
                        <div className="text-left mt-2 border border-slate-700 bg-slate-900 rounded p-2 overflow-auto max-h-40">
                          <p className="text-[10px] text-slate-400 font-bold mb-1 uppercase tracking-wider">Texto Crudo Extraído (Cópialo para enviarlo):</p>
                          <pre className="text-[10px] font-mono text-slate-300 whitespace-pre-wrap">{rawOcrText}</pre>
                        </div>
                      )}
                    </div>
                  )}
                  {!isLoading && extractedData.length === 0 && !error && (
                    <span>Carga una captura para iniciar el procesamiento automático.</span>
                  )}
                </div>
                <Button
                  onClick={exportToExcel}
                  disabled={extractedData.length === 0 || isLoading}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium gap-2 shadow-lg shadow-emerald-950/20 shrink-0 self-end sm:self-auto"
                >
                  <Download className="h-4 w-4" />
                  Exportar a Excel (.xlsx)
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

      </div>

      {/* Preview Table Data Grid (Dynamic columns) */}
      {extractedData.length > 0 && (
        <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-md">
          <CardHeader className="pb-4 border-b border-slate-800/50">
            <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-blue-500" />
              Vista Previa y Edición del Reconocimiento OCR
            </CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Haz clic en cualquier celda para editar el valor en tiempo real. Presiona Enter para guardar o Esc para cancelar.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="max-h-[500px] overflow-y-auto rounded-md border border-slate-800 bg-slate-950/40">
              <Table className="relative border-collapse">
                <TableHeader className="bg-slate-950/90 backdrop-blur-sm sticky top-0 z-10 border-b border-slate-800">
                  <TableRow className="border-slate-800 hover:bg-transparent">
                    {columns.map((colKey) => (
                      <TableHead 
                        key={colKey} 
                        className={`text-slate-300 font-semibold ${
                          colKey === "volumen" || colKey === "oxigeno" || colKey === "ciclos" || colKey === "porcentaje" || colKey.startsWith("ciclos_")
                            ? "text-right" 
                            : "text-left"
                        }`}
                      >
                        {getColumnLabel(colKey)}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {extractedData.map((row, rowIndex) => (
                    <TableRow key={rowIndex} className="border-slate-800/50 hover:bg-slate-800/20 transition-colors">
                      {columns.map((colKey) => {
                        const isEditing = editingCell?.rowIndex === rowIndex && editingCell?.field === colKey;
                        const val = row[colKey];
                        const isNumericCol = colKey === "volumen" || colKey === "oxigeno" || colKey === "ciclos" || colKey === "porcentaje" || colKey.startsWith("ciclos_");
                        
                        return (
                          <TableCell 
                            key={colKey} 
                            className={
                              isNumericCol
                                ? "text-right font-mono" 
                                : colKey === "tcc" || colKey === "tanque" 
                                ? "font-semibold font-mono text-slate-200" 
                                : ""
                            }
                          >
                            {isEditing ? (
                              // Render drop-down or input depending on column type
                              colKey === "estado" ? (
                                <select
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  onBlur={saveCell}
                                  onKeyDown={handleKeyDown}
                                  autoFocus
                                  className="h-8 bg-slate-900 border-slate-700 text-white rounded text-xs w-full px-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                >
                                  <option value="Lleno">Lleno</option>
                                  <option value="Vacío">Vacío</option>
                                  <option value="Lavando">Lavando</option>
                                  <option value="En Transición">En Transición</option>
                                  <option value="Filtrando">Filtrando</option>
                                </select>
                              ) : colKey === "tipo" ? (
                                <select
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  onBlur={saveCell}
                                  onKeyDown={handleKeyDown}
                                  autoFocus
                                  className="h-8 bg-slate-900 border-slate-700 text-white rounded text-xs w-full px-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                >
                                  <option value="Tipo C">Tipo C</option>
                                  <option value="Tipo B">Tipo B</option>
                                  <option value="Tipo A">Tipo A</option>
                                </select>
                              ) : colKey === "marca" && templateType === "operacion" ? (
                                <select
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  onBlur={saveCell}
                                  onKeyDown={handleKeyDown}
                                  autoFocus
                                  className="h-8 bg-slate-900 border-slate-700 text-white rounded text-xs w-full px-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                >
                                  <option value="Corona Nal">Corona Nal</option>
                                  <option value="Corona-L Exp">Corona-L Exp</option>
                                  <option value="Modelo Exp">Modelo Exp</option>
                                  <option value="Victoria Nal">Victoria Nal</option>
                                  <option value="Pacífico">Pacífico</option>
                                  <option value="Negra Modelo">Negra Modelo</option>
                                  <option value="NO SELECT">NO SELECT</option>
                                </select>
                              ) : (
                                <Input
                                  value={editValue}
                                  type={isNumericCol ? "number" : "text"}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  onBlur={saveCell}
                                  onKeyDown={handleKeyDown}
                                  autoFocus
                                  className={`h-8 bg-slate-900 border-slate-700 text-white text-xs w-full py-0.5 px-2 focus-visible:ring-blue-500/50 ${
                                    isNumericCol ? "text-right font-mono" : ""
                                  }`}
                                />
                              )
                            ) : (
                              <div 
                                onClick={() => startEdit(rowIndex, colKey, val)}
                                className="cursor-pointer hover:bg-slate-800/40 rounded px-2 py-1 flex items-center justify-between group min-h-[28px]"
                              >
                                <span>
                                  {colKey === "marca" && templateType === "operacion" ? (
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getBrandBadgeClass(val)}`}>
                                      {val}
                                    </span>
                                  ) : colKey === "estado_modo" ? (
                                    <span className={`inline-flex items-center w-6 h-6 justify-center rounded text-xs font-bold ${
                                      val === 'A' ? 'bg-green-500 text-slate-900' : 
                                      val === 'M' ? 'bg-yellow-400 text-slate-900' : 'bg-slate-700 text-slate-300'
                                    }`}>
                                      {val}
                                    </span>
                                  ) : colKey === "estado" ? (
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusBadgeClass(val)}`}>
                                      {val}
                                    </span>
                                  ) : colKey === "volumen" ? (
                                    <span className="text-blue-400 font-bold">{Number(val).toLocaleString()}</span>
                                  ) : colKey === "porcentaje" ? (
                                    <span>{Number(val).toLocaleString()}%</span>
                                  ) : colKey === "ciclos_acido_1" || colKey === "ciclos_sosa_1" ? (
                                    <span className="inline-block bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 px-1.5 py-0.5 rounded min-w-[28px] text-center font-bold">
                                      {val}
                                    </span>
                                  ) : colKey === "ciclos_acido_2" || colKey === "ciclos_sosa_2" ? (
                                    <span className="inline-block bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-1.5 py-0.5 rounded min-w-[28px] text-center font-bold">
                                      {val}
                                    </span>
                                  ) : (
                                    String(val ?? "")
                                  )}
                                </span>
                                <Edit3 className="h-3 w-3 opacity-0 group-hover:opacity-40 text-slate-400" />
                              </div>
                            )}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

    </div>
  );
}
