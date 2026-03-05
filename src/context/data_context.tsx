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
  const [data, setData, isLoaded] = useIndexedDB<BatchRecord[]>("brew-insights-data", []);
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