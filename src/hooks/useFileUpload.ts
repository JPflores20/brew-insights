// src/hooks/useFileUpload.ts
// Lógica de carga y procesamiento de archivos Excel extraída de Overview.tsx

import { useState, useRef, useEffect } from "react";
import { useData } from "@/context/DataContext";
import { processExcelFile } from "@/utils/excelProcessor";
import { useToast } from "@/hooks/use-toast";
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

  // Limpiar el intervalo al desmontar el componente
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

    // Animación de progreso simulada
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
        const fileData = await processExcelFile(file);
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

  return { loading, uploadProgress, processFiles };
}
