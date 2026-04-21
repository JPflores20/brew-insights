import { useMemo, useState } from "react";
import { useData } from "@/context/data_context";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Search, 
  Download, 
  Calendar, 
  Clock, 
  Thermometer,
  ChevronRight
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export function HistoryTab() {
  const { coldBlockData } = useData();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredHistory = useMemo(() => {
    // Unique batches in cold block
    const batchMap = new Map<string, any>();
    
    coldBlockData.forEach(d => {
      if (!batchMap.has(d.CHARG_NR)) {
        batchMap.set(d.CHARG_NR, {
          id: d.CHARG_NR,
          product: d.productName,
          tank: d.TEILANL_GRUPO,
          startTime: d.timestamp,
          duration: d.real_total_min,
          steps: d.steps.length,
          lastTemp: d.parameters.find(p => p.unit === '°c')?.value || 0
        });
      }
    });

    return Array.from(batchMap.values())
      .filter(b => 
        b.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.tank.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  }, [coldBlockData, searchTerm]);

  const handleExport = () => {
    const csv = [
      ["Lote", "Producto", "Tanque", "Fecha Inicio", "Duración (min)", "Pasos", "Ult. Temp"].join(","),
      ...filteredHistory.map(b => [
        b.id,
        b.product,
        b.tank,
        b.startTime,
        b.duration,
        b.steps,
        b.lastTemp
      ].join(","))
    ].join("\n");
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `historico_frio_${format(new Date(), 'yyyyMMdd')}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <Input 
            placeholder="Buscar por lote, producto o tanque..." 
            className="pl-10 bg-slate-900/50 border-slate-700"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button 
          variant="outline" 
          onClick={handleExport}
          className="bg-blue-500/10 border-blue-500/20 text-blue-400 hover:bg-blue-500/20"
        >
          <Download className="mr-2 h-4 w-4" />
          Exportar CSV
        </Button>
      </div>

      <Card className="bg-slate-900/40 border-slate-800/50 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-400" />
            Registro de Lotes
          </CardTitle>
          <CardDescription>Historial de cocimientos procesados en el bloque frío</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-slate-800">
            <Table>
              <TableHeader className="bg-slate-800/30">
                <TableRow className="border-slate-800 hover:bg-transparent">
                  <TableHead className="text-slate-400">Lote</TableHead>
                  <TableHead className="text-slate-400">Producto</TableHead>
                  <TableHead className="text-slate-400">Tanque</TableHead>
                  <TableHead className="text-slate-400">Inicio</TableHead>
                  <TableHead className="text-slate-400 text-right">Pasos</TableHead>
                  <TableHead className="text-slate-400 text-right">Siguiente</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredHistory.length > 0 ? filteredHistory.map((batch) => (
                  <TableRow key={batch.id} className="border-slate-800 hover:bg-slate-800/20 transition-colors group">
                    <TableCell className="font-medium text-slate-200">
                      {batch.id}
                    </TableCell>
                    <TableCell className="text-slate-400">
                      {batch.product}
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase tracking-wider">
                        {batch.tank}
                      </span>
                    </TableCell>
                    <TableCell className="text-slate-400 text-xs">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(batch.startTime), "dd MMM, HH:mm", { locale: es })}
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-slate-400">
                      {batch.steps}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-500 group-hover:text-blue-400">
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-slate-500">
                      No se encontraron lotes con los criterios de búsqueda.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
