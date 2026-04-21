import { useState, useMemo, useEffect, useRef } from "react";
import * as XLSX from "xlsx";
import { parse, startOfDay, endOfDay } from "date-fns";
import { useLocalStorage } from "@/hooks/use_local_storage";
import { DateRange } from "react-day-picker";
import { FILTER_ALL } from "@/lib/constants";

export interface ExcelRow {
  Val: number;
  Param: string;
  Etapa: string;
  Marca: string;
  LEI: number;
  LES: number;
  Date: Date | null;
}

// 1. NUEVA FUNCIÓN: Identifica si un valor es de tiempo y lo convierte correctamente a horas enteras decimales.
const parseParamValue = (rawVal: any, isTimeParam: boolean): number => {
  if (rawVal === undefined || rawVal === null || rawVal === "") return NaN;
  
  const strVal = String(rawVal).trim();
  
  // Caso A: Si el dato viene como un texto del estilo "11:30:00" (frecuente en CSV o celdas de texto)
  if (strVal.includes(':')) {
    const parts = strVal.split(':');
    if (parts.length >= 2) {
      const h = parseInt(parts[0], 10) || 0;
      const m = parseInt(parts[1], 10) || 0;
      const s = parts[2] ? parseInt(parts[2], 10) : 0;
      return h + (m / 60) + (s / 3600);
    }
  }
  
  // Caso B: Si es un número normal o fracción de día de Excel
  const floatVal = parseFloat(strVal);
  
  // Si la columna corresponde a un parámetro de "tiempo" y Excel lo leyó como una fracción de día.
  // (Ejemplo: Excel guarda 12:00 como 0.5. Al multiplicarlo por 24 obtenemos 12 horas reales)
  if (isTimeParam && !isNaN(floatVal) && floatVal > 0 && floatVal <= 10) {
    return floatVal * 24;
  }
  
  return floatVal;
};

export function useExcelCapability() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extData, setExtData] = useState<ExcelRow[]>([]);
  
  const [lei, setLei] = useLocalStorage<number | "">("excel-cpk-lei", 0);
  const [les, setLes] = useLocalStorage<number | "">("excel-cpk-les", 100);

  const [selectedEtapa, setSelectedEtapa] = useState<string>(FILTER_ALL);
  const [selectedMarca, setSelectedMarca] = useState<string>(FILTER_ALL);
  const [selectedParam, setSelectedParam] = useState<string>(FILTER_ALL);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processWorkbook = (workbook: XLSX.WorkBook) => {
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" }) as any[][];
    if (jsonData.length === 0) throw new Error("Archivo Excel vacío");

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
        if (idx === 0) return false;
        if (row.length <= Math.max(iVal, iParam, iLEI, iLES)) return false;
        
        // Detectamos dinámicamente si el parámetro es de tiempo
        const paramName = String(row[iParam] || "").toLowerCase();
        const isTimeParam = paramName.includes("tiempo");
        
        // Parseamos el valor usando nuestra nueva función
        const val = parseParamValue(row[iVal], isTimeParam);
        
        // Ignoramos si es NaN o si el tiempo es 0 (para no corromper la media)
        return !isNaN(val) && val > 0; 
    }).map(row => {
        const paramName = String(row[iParam] || "").toLowerCase();
        const isTimeParam = paramName.includes("tiempo");

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

        // Limpieza: Excel evalúa los campos vacíos en fecha como "1899"
        if (rowDate && rowDate.getFullYear() < 1900) {
           rowDate = null;
        }

        // 2. Extraemos todos los valores limpiándolos con nuestra función de ayuda.
        return {
          Val: parseParamValue(row[iVal], isTimeParam),
          Param: row[iParam] || "N/A",
          Etapa: row[iEtapa] || "N/A",
          Marca: row[iMarca] || "N/A",
          LEI: parseParamValue(row[iLEI], isTimeParam) || 0,
          LES: parseParamValue(row[iLES], isTimeParam) || 0,
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

  const uniqueEtapas = useMemo(() => Array.from(new Set(extData.map(d => d.Etapa).filter(Boolean))).sort(), [extData]);
  const uniqueMarcas = useMemo(() => Array.from(new Set(extData.map(d => d.Marca).filter(Boolean))).sort(), [extData]);
  const uniqueParams = useMemo(() => Array.from(new Set(extData.map(d => d.Param).filter(Boolean))).sort(), [extData]);

  const availableDateRange = useMemo(() => {
    const dates = extData.map(d => d.Date).filter((d): d is Date => d !== null);
    if (dates.length === 0) return { min: undefined, max: undefined };
    return {
      min: new Date(Math.min(...dates.map(d => d.getTime()))),
      max: new Date(Math.max(...dates.map(d => d.getTime())))
    };
  }, [extData]);

  useEffect(() => {
    if (selectedParam !== FILTER_ALL && extData.length > 0) {
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
  }, [selectedParam, selectedMarca, selectedEtapa, extData, setLei, setLes]);

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
    const target = (nLei + nLes) / 2;

    const cp = stdDev !== 0 ? (nLes - nLei) / (6 * stdDev) : 0;
    const cpkUpper = stdDev !== 0 ? (nLes - mean) / (3 * stdDev) : 0;
    const cpkLower = stdDev !== 0 ? (mean - nLei) / (3 * stdDev) : 0;
    const cpk = Math.min(cpkUpper, cpkLower);

    return { n, mean, min, max, stdDev, cp, cpk, lei: nLei, les: nLes, target };
  }, [filteredValues, lei, les]);

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

  return {
    loading, error,
    extData,
    lei, setLei,
    les, setLes,
    selectedEtapa, setSelectedEtapa, uniqueEtapas,
    selectedMarca, setSelectedMarca, uniqueMarcas,
    selectedParam, setSelectedParam, uniqueParams,
    dateRange, setDateRange, availableDateRange,
    fileInputRef, handleFileUpload,
    filteredValues, stats, chartDataBase
  };
}