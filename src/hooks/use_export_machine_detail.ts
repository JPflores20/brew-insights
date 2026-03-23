import React, { useRef } from "react";
import { exportToCSV } from "@/utils/export_utils";
import { format } from "date-fns";
import { useToast } from "@/hooks/use_toast";
import { useReactToPrint } from "react-to-print";

export function useExportMachineDetail(data: any[], selectedMachine: string | null) {
  const componentRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const handlePrint = useReactToPrint({
      contentRef: componentRef,
      documentTitle: `Detalle_Maquina_${selectedMachine || 'Global'}_${format(new Date(), 'yyyy-MM-dd_HHmm')}`,
      pageStyle: `
        @page { size: auto; margin: 15mm; }
        @media print {
          body { -webkit-print-color-adjust: exact; }
          .print:hidden { display: none !important; }
        }
      `
  });

  const handleExport = () => {
    if (!data || data.length === 0) return;
    const dataToExport = selectedMachine
      ? data.filter(d => d.TEILANL_GRUPO === selectedMachine)
      : data;
      
    if (dataToExport.length === 0) {
      toast({ title: "Sin datos", description: "No hay datos para la selección actual.", variant: "destructive" });
      return;
    }

    const exportData = dataToExport.map(d => ({
      "Lote": d.CHARG_NR,
      "Grupo Equipo": d.TEILANL_GRUPO,
      "Producto": d.productName,
      "Inicio": d.timestamp ? format(new Date(d.timestamp), 'dd/MM/yyyy HH:mm:ss') : '',
      "Duración Real (min)": d.real_total_min,
      "Setpoint (min)": d.esperado_total_min,
      "Delta (min)": d.delta_total_min,
      "Alertas": d.alerts?.length || 0
    }));

    exportToCSV(exportData, `BrewCycle_Machine_${selectedMachine || 'All'}_${format(new Date(), 'yyyyMMdd_HHmm')}`);
    toast({ title: "Exportación exitosa", description: "Datos exportados correctamente." });
  };

  return { componentRef, handlePrint, handleExport };
}
