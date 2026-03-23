import React, { createContext, useContext, ReactNode } from "react";
import { BatchRecord } from "@/data/mock_data";
import { useIndexedDB } from "@/hooks/use_indexed_db"; 
interface DataContextType {
  data: BatchRecord[];
  setData: (data: BatchRecord[]) => void;
  isLoaded: boolean;
}
const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const [data, setData, isLoaded] = useIndexedDB<BatchRecord[]>("brew-insights-data-v2", []);

  // Automatización: Limpiar datos de prueba heredados (Semanas 6-9) si se detectan
  React.useEffect(() => {
    if (isLoaded && data.length > 0) {
      const hasFeb2026Data = data.some(d => d.timestamp && d.timestamp.startsWith('2026-02'));
      // El set de datos de prueba original tiene aproximadamente 373 registros y es de Feb 2026
      if (data.length === 373 && hasFeb2026Data) {
        console.log("Purgando datos de prueba heredados (Semanas 6, 7, 8 y 9)...");
        setData([]);
      }
    }
  }, [isLoaded, data.length, setData]);

  return (
    <DataContext.Provider value={{ data, setData, isLoaded }}>
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