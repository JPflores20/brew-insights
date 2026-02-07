import React, { createContext, useContext, useState, ReactNode } from "react";
import { BatchRecord } from "@/data/mockData";

interface DataContextType {
  data: BatchRecord[];
  setData: (data: BatchRecord[]) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<BatchRecord[]>([]);

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