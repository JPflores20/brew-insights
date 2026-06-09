/**
 * Contexto de Datos (DataContext)
 * -------------------------------
 * Administra el estado global de los datos de la aplicación, guardándolos en IndexedDB
 * del navegador para que persistan entre recargas de página.
 * Maneja la carga inicial del JSON optimizado generado por Python y las lógicas de
 * purga de datos antiguos.
 */
import React, { createContext, useContext, ReactNode, useState, useEffect, useRef } from "react";
import { BatchRecord } from "@/data/mock_data";
import { useIndexedDB } from "@/hooks/use_indexed_db"; 
import { processDbfBuffer } from "@/utils/dbf_processor";
import { useToast } from "@/hooks/use_toast";

interface DataContextType {
  data: BatchRecord[];          // Hot Block Data (Cocimientos)
  setHotBlockData: (data: BatchRecord[]) => void;
  setData: (data: BatchRecord[]) => void; // Alias for setHotBlockData
  coldBlockData: BatchRecord[]; // Cold Block Data
  setColdBlockData: (data: BatchRecord[]) => void;
  isLoaded: boolean;
  triggerHotBlockLoad: () => Promise<void>;
  triggerColdBlockLoad: () => Promise<void>;
}
const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const [data, setData, isLoaded] = useIndexedDB<BatchRecord[]>("brew-insights-data-v8", []);
  const [coldData, setColdData, isColdLoaded] = useIndexedDB<BatchRecord[]>("brew-insights-cold-v1", []);
  
  const [isHotLoading, setIsHotLoading] = useState(false);
  const [isColdLoading, setIsColdLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("Cargando...");
  const hasStartedHotLoad = useRef(false);
  const hasStartedColdLoad = useRef(false);
  const { toast } = useToast();

  const triggerHotBlockLoad = async () => {
    if (data.length > 0 || hasStartedHotLoad.current) return;
    hasStartedHotLoad.current = true;
    setIsHotLoading(true);
    setLoadingText("Cargando Cocimientos (Optimizados)...");
    
    try {
      const response = await fetch("/preloaded_data.json");
      const contentType = response.headers.get("content-type");
      
      if (response.ok && contentType?.includes("application/json")) {
        const jsonData = await response.json();
        if (jsonData && Array.isArray(jsonData) && jsonData.length > 0) {
          setData(jsonData);
          toast({ title: "Datos cargados", description: "Se cargaron los datos de producción exitosamente." });
        } else {
          toast({ variant: "destructive", title: "Datos vacíos", description: "El archivo de datos optimizado está vacío." });
        }
      } else {
        toast({ variant: "destructive", title: "Error de carga", description: "No se encontró el archivo de datos optimizado. Por favor carga los archivos manualmente." });
      }
    } catch (error) {
      console.error("Error loading hot block data:", error);
      toast({ variant: "destructive", title: "Error de conexión", description: "No se pudo conectar para descargar los datos." });
    } finally {
      setIsHotLoading(false);
    }
  };

  const triggerColdBlockLoad = async () => {
    if (hasStartedColdLoad.current) return;
    hasStartedColdLoad.current = true;
    
    // Clear existing data if it was pre-loaded sample data
    // (User requested to remove pre-loaded cold block data)
    if (coldData.length > 0 && !localStorage.getItem('cold_data_cleaned')) {
      setColdData([]);
      localStorage.setItem('cold_data_cleaned', 'true');
    }
  };

  // Automatización: Limpiar datos de prueba heredados (Semanas 6-9) si se detectan
  useEffect(() => {
    if (isLoaded && !isHotLoading && !isColdLoading) {
      // Purga de Hot Block (datos viejos de Feb 2026)
      if (data.length === 373 && data.some(d => d.timestamp && d.timestamp.startsWith('2026-02'))) {
        console.log("Purgando datos de Hot Block heredados...");
        setData([]);
      }
      
      // NUEVO: Purga de Cold Block si tiene los nombres viejos (Aireacion, etc.)
      const hasLegacyColdLabels = coldData.length > 0 && coldData.some(d => 
        ['aireacion', 'mosto', 'recibir'].some(label => d.TEILANL_GRUPO.toLowerCase().includes(label))
      );
      
      const isIncorrectlyMapped = coldData.length > 0 && !hasLegacyColdLabels && !localStorage.getItem('cold_v6_recipes_last_ref');

      if ((hasLegacyColdLabels || isIncorrectlyMapped)) {
        console.log("Detectados nombres de tanques obsoletos o mapeo incorrecto. Purgando...");
        localStorage.setItem('cold_v6_recipes_last_ref', 'true');
        setColdData([]);
      }
    }
  }, [isLoaded, isColdLoaded, data, coldData, setData, setColdData, isHotLoading, isColdLoading]);

  const handleSkip = () => {
    setIsHotLoading(false);
    setIsColdLoading(false);
    hasStartedHotLoad.current = true;
    hasStartedColdLoad.current = true;
  };

  const isInitializing = isHotLoading || isColdLoading;

  return (
    <DataContext.Provider value={{ 
      data, 
      setData,
      setHotBlockData: setData, 
      coldBlockData: coldData, 
      setColdBlockData: setColdData, 
      isLoaded: isLoaded && isColdLoaded,
      triggerHotBlockLoad,
      triggerColdBlockLoad
    }}>
      {isInitializing && (
        <div className="fixed inset-0 z-[9999] bg-background/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-6"></div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Inicializando Brew Insights</h2>
            <p className="text-xl font-medium text-blue-500 animate-pulse mb-4">{loadingText}</p>
            <div className="text-sm text-muted-foreground max-w-sm bg-muted/50 p-6 rounded-lg border border-border">
               Estamos preparando los datos seleccionados para su análisis.
               <br/><br/>
               <button 
                  onClick={handleSkip}
                  className="mt-6 w-full py-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-md font-semibold transition-colors border border-border"
               >
                 Continuar sin cargar datos
               </button>
            </div>
        </div>
      )}
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error("useData must be used within a DataProvider");
  }
  return context;
}