import { useMemo } from "react";
import { BatchRecord } from "@/types";
import { SeriesConfig } from "../types";
import { getMachineData } from "@/data/mock_data";
import { FILTER_ALL } from "@/lib/constants";

export function useTimeSeries(
    data: BatchRecord[],
    isMultiSeries: boolean,
    series?: SeriesConfig[]
) {
    const unifiedData = useMemo(() => {
        if (!isMultiSeries || !series || series.length === 0) return [];
        
        // Determinar qué "llave X" unifica los datos basándose en el tipo de filtro del usuario.
        // Asume que las series superpuestas tienen el mismo tipo de consulta semánticamente.
        
        const referenceSeries = series[0];
        let xAxisKey = "interval"; // Default abstracto
        let isHistorical = false;

        // Caso 1: Máquina seleccionada y Lote seleccionado (X = steps)
        if (referenceSeries.machine !== FILTER_ALL && referenceSeries.batch !== FILTER_ALL) {
            xAxisKey = "stepName";
            
            const allSteps = new Set<string>();
            const datasets = series.map(s => {
                const record = data.find(d => 
                    d.CHARG_NR === s.batch && 
                    d.TEILANL_GRUPO === s.machine &&
                    (s.recipe === FILTER_ALL || d.productName === s.recipe)
                );
                record?.steps?.forEach(st => allSteps.add(st.stepName));
                return { id: s.id, record };
            });

            return Array.from(allSteps).map(step => {
                const datum: any = { stepName: step };
                datasets.forEach(({ id, record }) => {
                    const matchedStep = record?.steps?.find(st => st.stepName === step);
                    datum[`value_${id}`] = matchedStep ? matchedStep.durationMin : null;
                });
                return datum;
            });
        }
        
        // Caso 2: Todas las máquinas y Lote Seleccionado (X = TEILANL_GRUPO)
        if (referenceSeries.machine === FILTER_ALL && referenceSeries.batch !== FILTER_ALL) {
            xAxisKey = "TEILANL_GRUPO";
            
            const allMachines = new Set<string>();
            const datasets: { id: string, records: BatchRecord[] }[] = series.map(s => {
                const records = data.filter(d => 
                    d.CHARG_NR === s.batch && 
                    (s.recipe === FILTER_ALL || d.productName === s.recipe)
                );
                records.forEach(r => allMachines.add(r.TEILANL_GRUPO));
                return { id: s.id, records };
            });

            return Array.from(allMachines).sort().map(machine => {
                const datum: any = { TEILANL_GRUPO: machine };
                datasets.forEach(({ id, records }) => {
                    const r = records.find(rec => rec.TEILANL_GRUPO === machine);
                    datum[`value_${id}`] = r ? r.real_total_min : null;
                });
                return datum;
            });
        }

        // Caso 3: Histórico. Máquina Seleccionada (o Todas) y Lote NO Seleccionado (X = date o batchId)
        xAxisKey = "date";
        isHistorical = true;
        const allDates = new Set<string>();
        
        const datasets = series.map(s => {
            let records = data;
            if (s.machine !== FILTER_ALL) records = getMachineData(records, s.machine);
            if (s.recipe !== FILTER_ALL) records = records.filter(d => d.productName === s.recipe);
            
            records.forEach(r => allDates.add(r.timestamp));
            return { id: s.id, records };
        });

        // Ordenamos los timestamps cronológicamente
        const sortedDates = Array.from(allDates).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
        
        return sortedDates.map(timestamp => {
            const dateObj = new Date(timestamp);
            const dateStr = dateObj.toLocaleString([], { dateStyle: "short", timeStyle: "short" });
            const datum: any = { date: dateStr, rawDate: timestamp };
            
            datasets.forEach(({ id, records }) => {
                const r = records.find(rec => rec.timestamp === timestamp);
                datum[`value_${id}`] = r ? r.real_total_min : null;
            });
            return datum;
        }).filter(d => series.some(s => d[`value_${s.id}`] !== null)); // Quitar saltos de tiempo muertos
        
    }, [data, isMultiSeries, series]);

    // Retorna validación xAxisKey para configuración frontal
    const referenceSeries = series?.[0];
    let xAxisMode: "steps" | "machines" | "historical" = "historical";
    if (referenceSeries) {
        if (referenceSeries.machine !== FILTER_ALL && referenceSeries.batch !== FILTER_ALL) xAxisMode = "steps";
        else if (referenceSeries.machine === FILTER_ALL && referenceSeries.batch !== FILTER_ALL) xAxisMode = "machines";
    }

    return { unifiedData, xAxisMode };
}
