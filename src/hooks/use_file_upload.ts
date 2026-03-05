
import { useState, useRef, useEffect } from "react";
import { useData } from "@/context/data_context";
import { processDbfFile, processDbfBuffer } from "@/utils/dbf_processor";
import { useToast } from "@/hooks/use_toast";
import { BatchRecord } from "@/types";
const MAX_FILES = 4;
export function useFileUpload() {
  const { setData } = useData();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const clearProgressInterval = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  };
  useEffect(() => {
    return () => clearProgressInterval();
  }, []);
  const processFiles = async (files: File[]) => {
    if (files.length === 0) return;
    if (files.length > MAX_FILES) {
      toast({
        variant: "destructive",
        title: "Exceso de ingredientes",
        description: `Solo puedes subir un máximo de ${MAX_FILES} archivos a la vez.`,
      });
      return;
    }
    setLoading(true);
    setUploadProgress(0);
    progressIntervalRef.current = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) return 90 + Math.random() * 2;
        return Math.min(prev + Math.random() * 15, 90);
      });
    }, 300);
    try {
      let combinedData: BatchRecord[] = [];
      let successCount = 0;
      for (const file of files) {
        const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
        if (ext !== 'dbf') {
          throw new Error(`Archivo no soportado: ${file.name}. Solo se admiten archivos .dbf`);
        }
        const fileData = await processDbfFile(file);
        if (fileData && fileData.length > 0) {
          combinedData = [...combinedData, ...fileData];
          successCount++;
        }
      }
      clearProgressInterval();
      setUploadProgress(100);
      await new Promise((resolve) => setTimeout(resolve, 800));
      if (combinedData.length > 0) {
        setData(combinedData);
        toast({
          title: "¡Tanque lleno!",
          description: `Se han procesado ${successCount} archivo(s) con ${combinedData.length} registros totales.`,
          className: "bg-primary text-primary-foreground border-none",
        });
      } else {
        throw new Error("No se encontraron datos válidos en los archivos.");
      }
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Error en la mezcla",
        description:
          "Uno o más archivos no son válidos o no tienen el formato esperado.",
      });
    } finally {
      clearProgressInterval();
      setLoading(false);
      setUploadProgress(0);
    }
  };

  const loadDemoData = async () => {
    setLoading(true);
    setUploadProgress(0);
    progressIntervalRef.current = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) return 90 + Math.random() * 2;
        return Math.min(prev + Math.random() * 15, 90);
      });
    }, 300);

    try {
      const demoFiles = [
        'https://brew-insights.web.app/Semanas/S2600007.DBF',
        'https://brew-insights.web.app/Semanas/S2600008.DBF'
      ];
      
      let combinedData: BatchRecord[] = [];
      
      for (const url of demoFiles) {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`No se pudo cargar el archivo: ${url}`);
        const buffer = await response.arrayBuffer();
        const fileData = await processDbfBuffer(buffer);
        if (fileData && fileData.length > 0) {
          combinedData = [...combinedData, ...fileData];
        }
      }

      clearProgressInterval();
      setUploadProgress(100);
      await new Promise((resolve) => setTimeout(resolve, 800));

      if (combinedData.length > 0) {
        setData(combinedData);
        toast({
          title: "¡Tanque lleno (Firebase)!",
          description: `Se han cargado las Semanas 7 y 8 desde la nube (${combinedData.length} registros).`,
          className: "bg-primary text-primary-foreground border-none",
        });
      } else {
        throw new Error("No se encontraron datos válidos en los archivos demo.");
      }
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Error en la carga demo",
        description: "No se pudieron obtener los archivos demo desde Firebase Hosting.",
      });
    } finally {
      clearProgressInterval();
      setLoading(false);
      setUploadProgress(0);
    }
  };

  return { loading, uploadProgress, processFiles, loadDemoData };
}
