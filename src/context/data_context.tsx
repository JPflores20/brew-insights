import React, { createContext, useContext, ReactNode, useState, useEffect, useRef } from "react";
import { BatchRecord } from "@/data/mock_data";
import { useIndexedDB } from "@/hooks/use_indexed_db"; 
import { processDbfBuffer } from "@/utils/dbf_processor";

interface DataContextType {
  data: BatchRecord[];
  setData: (data: BatchRecord[]) => void;
  isLoaded: boolean;
}
const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const [data, setData, isLoaded] = useIndexedDB<BatchRecord[]>("brew-insights-data-v3", []);
  const [isInitializing, setIsInitializing] = useState(false);
  const [loadingText, setLoadingText] = useState("Cargando...");
  const hasStartedAutoLoad = useRef(false);

  useEffect(() => {
    if (isLoaded && data.length === 0 && !hasStartedAutoLoad.current) {
      hasStartedAutoLoad.current = true;

      const loadDefaultData = async () => {
        setIsInitializing(true);
        try {
          const filesToLoad = [
            "/Datos semanales/S2600008.DBF",
            "/Datos semanales/S2600009.DBF",
            "/Datos semanales/S2600010.DBF",
            "/Datos semanales/S2600011.DBF"
          ];
          
          let combinedData: BatchRecord[] = [];
          
          for (let i = 0; i < filesToLoad.length; i++) {
            setLoadingText(`Descargando semana ${i + 8} de 11...`);
            const url = filesToLoad[i];
            const response = await fetch(url);
            if (!response.ok) {
                console.error(`Failed to fetch ${url}`);
                continue;
            }
            const buffer = await response.arrayBuffer();
            
            setLoadingText(`Procesando DBF semana ${i + 8} de 11...`);
            // Yield to main thread briefly so UI can update
            await new Promise(resolve => setTimeout(resolve, 50));
            
            const fileData = await processDbfBuffer(buffer);
            if (fileData && fileData.length > 0) {
              combinedData = [...combinedData, ...fileData];
            }
          }
          
          if (combinedData.length > 0) {
              setLoadingText(`Guardando ${combinedData.length} registros (Semanas 8 a 11)...`);
              await new Promise(resolve => setTimeout(resolve, 50));
              setData(combinedData);
          }
        } catch (error) {
           console.error("Error autoloading test data: ", error);
        } finally {
           setIsInitializing(false);
        }
      };

      loadDefaultData();
    }
  }, [isLoaded, data.length, setData]);

  // Automatización: Limpiar datos de prueba heredados (Semanas 6-9) si se detectan
  useEffect(() => {
    if (isLoaded && data.length > 0 && !isInitializing) {
      const hasFeb2026Data = data.some(d => d.timestamp && d.timestamp.startsWith('2026-02'));
      // El set de datos de prueba original tiene aproximadamente 373 registros y es de Feb 2026
      if (data.length === 373 && hasFeb2026Data) {
        console.log("Purgando datos de prueba heredados (Semanas 6, 7, 8 y 9)...");
        hasStartedAutoLoad.current = false;
        setData([]);
      }
    }
  }, [isLoaded, data.length, setData, isInitializing]);

  return (
    <DataContext.Provider value={{ data, setData, isLoaded }}>
      {isInitializing && (
        <div className="fixed inset-0 z-[9999] bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-6"></div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Inicializando DBF de Pruebas</h2>
            <p className="text-muted-foreground">{loadingText}</p>
            <p className="text-sm text-muted-foreground mt-4 text-center max-w-sm bg-muted/50 p-4 rounded-lg">
               Descargando e indexando semanas 8, 9, 10 y 11. <br/>
               <span className="font-semibold text-primary">Esto tomará alrededor de 10 - 20 segundos para medio Gigabyte de DBFs.</span>
            </p>
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