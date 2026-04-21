import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CycleHeaderProps {
  onPrint: () => void;
}

export function CycleHeader({ 
  onPrint 
}: CycleHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Análisis de Tiempos</h1>
        <p className="text-muted-foreground mt-1">Comparativa: Área Verde (Setpoint) vs Área Azul (Real).</p>
      </div>
      <div className="flex items-center gap-3">
         <Button variant="outline" className="shadow-sm hover:border-primary/50 transition-colors" onClick={onPrint}>
              <Printer className="mr-2 h-4 w-4" /> Imprimir PDF
          </Button>
      </div>
    </div>
  );
}
