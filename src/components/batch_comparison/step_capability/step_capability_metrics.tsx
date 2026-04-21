import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Activity, Beaker } from "lucide-react";

interface StepCapabilityMetricsProps {
  stats: any;
  machineStats: Record<string, any>;
  selectedMachines: string[];
  lei: number | "";
  les: number | "";
}

export function StepCapabilityMetrics({
  stats,
  machineStats,
  selectedMachines,
  lei,
  les
}: StepCapabilityMetricsProps) {
  const nLei = Number(lei);
  const nLes = Number(les);

  return (
    <div className="w-full">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-[10px]">Métrica</TableHead>
            <TableHead className="text-right text-[10px]">Global</TableHead>
            {selectedMachines.length > 1 && selectedMachines.map(m => (
              <TableHead key={m} className="text-right text-[10px] truncate max-w-[60px]" title={m}>{m}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell className="font-semibold text-muted-foreground uppercase text-[10px]">n</TableCell>
            <TableCell className="text-right font-mono">{stats?.n || 0}</TableCell>
            {selectedMachines.length > 1 && selectedMachines.map(m => (
              <TableCell key={m} className="text-right font-mono text-muted-foreground">{machineStats[m]?.n || 0}</TableCell>
            ))}
          </TableRow>
          <TableRow>
            <TableCell className="font-semibold text-muted-foreground uppercase text-[10px]">Media</TableCell>
            <TableCell className="text-right font-mono font-bold text-purple-600">{stats?.mean?.toFixed(2) || "---"}</TableCell>
            {selectedMachines.length > 1 && selectedMachines.map(m => (
              <TableCell key={m} className="text-right font-mono text-muted-foreground">{machineStats[m]?.mean?.toFixed(2) || "---"}</TableCell>
            ))}
          </TableRow>
          <TableRow>
            <TableCell className="font-semibold text-muted-foreground uppercase text-[10px]">Min</TableCell>
            <TableCell className="text-right font-mono">{stats?.min?.toFixed(2) || "---"}</TableCell>
            {selectedMachines.length > 1 && selectedMachines.map(m => (
              <TableCell key={m} className="text-right font-mono text-muted-foreground">{machineStats[m]?.min?.toFixed(2) || "---"}</TableCell>
            ))}
          </TableRow>
          <TableRow>
            <TableCell className="font-semibold text-muted-foreground uppercase text-[10px]">Máx.</TableCell>
            <TableCell className="text-right font-mono">{stats?.max?.toFixed(2) || "---"}</TableCell>
            {selectedMachines.length > 1 && selectedMachines.map(m => (
              <TableCell key={m} className="text-right font-mono text-muted-foreground">{machineStats[m]?.max?.toFixed(2) || "---"}</TableCell>
            ))}
          </TableRow>
          <TableRow>
            <TableCell className="font-semibold text-muted-foreground uppercase text-[10px]">Desv. Est. σ</TableCell>
            <TableCell className="text-right font-mono">{stats?.stdDev?.toFixed(3) || "---"}</TableCell>
            {selectedMachines.length > 1 && selectedMachines.map(m => (
              <TableCell key={m} className="text-right font-mono text-muted-foreground">{machineStats[m]?.stdDev?.toFixed(3) || "---"}</TableCell>
            ))}
          </TableRow>
          <TableRow className="bg-purple-500/5">
            <TableCell className="font-bold text-purple-600 uppercase text-[10px]">Cp</TableCell>
            <TableCell className="text-right font-mono font-bold text-purple-600">
                {stats?.cp !== undefined && isFinite(stats.cp) ? stats.cp.toFixed(3) : "---"}
            </TableCell>
            {selectedMachines.length > 1 && selectedMachines.map(m => {
              const s = machineStats[m];
              return (
                <TableCell key={m} className="text-right font-mono font-bold text-purple-600">
                  {s?.cp !== undefined && isFinite(s.cp) ? s.cp.toFixed(3) : "---"}
                </TableCell>
              );
            })}
          </TableRow>
          <TableRow className="bg-purple-500/10">
            <TableCell className="font-bold text-purple-600 uppercase text-[10px]">Cpk</TableCell>
            <TableCell className="text-right font-mono font-bold text-purple-600">
                {stats?.cpk !== undefined && isFinite(stats.cpk) ? stats.cpk.toFixed(3) : "---"}
            </TableCell>
            {selectedMachines.length > 1 && selectedMachines.map(m => {
              const s = machineStats[m];
              return (
                <TableCell key={m} className="text-right font-mono font-bold text-purple-600">
                  {s?.cpk !== undefined && isFinite(s.cpk) ? s.cpk.toFixed(3) : "---"}
                </TableCell>
              );
            })}
          </TableRow>
          <TableRow className="bg-green-500/5">
            <TableCell className="font-semibold text-green-600 uppercase text-[10px]">Target</TableCell>
            <TableCell className="text-right font-mono font-bold text-green-600">{stats?.target?.toFixed(3) || "---"}</TableCell>
            {selectedMachines.length > 1 && selectedMachines.map(m => (
                <TableCell key={m} className="text-right font-mono text-muted-foreground">---</TableCell>
            ))}
          </TableRow>
          <TableRow>
            <TableCell className="font-semibold text-muted-foreground uppercase text-[10px]">LES</TableCell>
            <TableCell className="text-right font-mono text-destructive">{stats?.les?.toFixed(2) || "---"}</TableCell>
            {selectedMachines.length > 1 && selectedMachines.map(m => (
                <TableCell key={m} className="text-right font-mono text-muted-foreground">---</TableCell>
            ))}
          </TableRow>
          <TableRow>
            <TableCell className="font-semibold text-muted-foreground uppercase text-[10px]">LEI</TableCell>
            <TableCell className="text-right font-mono text-destructive">{stats?.lei?.toFixed(2) || "---"}</TableCell>
            {selectedMachines.length > 1 && selectedMachines.map(m => (
                <TableCell key={m} className="text-right font-mono text-muted-foreground">---</TableCell>
            ))}
          </TableRow>
        </TableBody>
      </Table>

      {stats && (nLei !== 0 || nLes !== 0) && (
         <div className="mt-6 space-y-3">
           {stats.cpk < 1 ? (
             <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-start gap-2">
               <Activity className="h-4 w-4 shrink-0 mt-0.5" />
               <p><strong>Baja Capacidad:</strong> Cpk &lt; 1.0. Proceso fuera de control o límites muy estrictos.</p>
             </div>
           ) : stats.cpk >= 1.33 ? (
             <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-600 text-xs flex items-start gap-2">
               <Beaker className="h-4 w-4 shrink-0 mt-0.5" />
               <p><strong>Proceso Capaz:</strong> Cpk &ge; 1.33. Nivel de calidad excelente.</p>
             </div>
           ) : (
             <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-600 text-xs flex items-start gap-2">
               <Activity className="h-4 w-4 shrink-0 mt-0.5" />
               <p><strong>Proceso Aceptable:</strong> 1.0 &le; Cpk &lt; 1.33. Control adecuado.</p>
             </div>
           )}
         </div>
      )}
    </div>
  );
}
