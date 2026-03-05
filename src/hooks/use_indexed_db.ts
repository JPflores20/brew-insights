import { useState, useEffect } from "react";
import { get, set } from "idb-keyval";

export function useIndexedDB<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [isLoaded, setIsLoaded] = useState(false);

  // Cargar datos iniciales desde IndexedDB
  useEffect(() => {
    if (typeof window === "undefined") {
      setIsLoaded(true);
      return;
    }

    const loadData = async () => {
      try {
        const item = await get(key);
        if (item !== undefined) {
          setStoredValue(item);
        }
      } catch (error) {
        console.error("Error reading from IndexedDB", error);
      } finally {
        setIsLoaded(true);
      }
    };

    loadData();
  }, [key]);

  // Actualizar estado y sincronizar asíncronamente con IndexedDB
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      
      if (typeof window !== "undefined") {
        // Guardar sin bloquear el hilo principal
        set(key, valueToStore).catch(err => {
          console.error("Error writing to IndexedDB", err);
        });
      }
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue, isLoaded] as const;
}
