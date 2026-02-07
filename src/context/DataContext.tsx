import React, { createContext, useContext, ReactNode } from "react";
import { BatchRecord } from "@/data/mockData";
import { useLocalStorage } from "@/hooks/use-local-storage"; // Importamos el hook

interface DataContextType {
  data: BatchRecord[];
  setData: (data: BatchRecord[]) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  // CAMBIO: Usamos useLocalStorage con la clave "brew-insights-data"
  // Esto guardará todo el dataset en el navegador.
  const [data, setData] = useLocalStorage<BatchRecord[]>("brew-insights-data", []);

  return (
    <DataContext.Provider value={{ data, setData }}>
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