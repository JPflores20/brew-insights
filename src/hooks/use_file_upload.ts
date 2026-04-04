import { useState, useRef, useEffect } from "react";
import { useData } from "@/context/data_context";
import { processDbfFile, mergeBatchRecords } from "@/utils/dbf_processor";
import { useToast } from "@/hooks/use_toast";
import { BatchRecord } from "@/types";
import { useMemo } from "react";

export function useFileUpload(target: 'hot' | 'cold' = 'hot') {
  const { setData, setColdBlockData } = useData();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Dynamic limit based on target - Increased to 100 for cold block as requested
  const MAX_FILES = target === 'cold' ? 100 : 4;
  const setter = target === 'cold' ? setColdBlockData : setData;

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
        title: "Exceso de archivos",
        description: `Solo puedes subir un máximo de ${MAX_FILES} archivos a la vez para esta sección.`,
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
        const uniqueData = mergeBatchRecords(combinedData);
        setter(uniqueData);
        toast({
          title: target === 'cold' ? "¡Tanque frío lleno!" : "¡Tanque lleno!",
          description: `Se han procesado ${successCount} archivo(s) resultando en ${uniqueData.length} lotes consolidados.`,
          className: "bg-primary text-primary-foreground border-none",
        });
      } else {
        throw new Error("No se encontraron datos válidos en los archivos.");
      }
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Error en el procesamiento",
        description:
          "Uno o más archivos no son válidos o no tienen el formato esperado.",
      });
    } finally {
      clearProgressInterval();
      setLoading(false);
      setUploadProgress(0);
    }
  };

  return { loading, uploadProgress, processFiles, maxFiles: MAX_FILES };
}
