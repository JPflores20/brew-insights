import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Activity, Beaker } from "lucide-react";

interface StepDurationMetricsProps {
  stats: any;
  machineStats: Record<string, any>;
  selectedMachines: string[];
}

export function StepDurationMetrics({
  stats,
  machineStats,
  selectedMachines
}: StepDurationMetricsProps) {
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
            <TableCell className="text-right font-mono font-bold text-blue-600">{stats?.mean?.toFixed(2) || "---"}</TableCell>
            {selectedMachines.length > 1 && selectedMachines.map(m => (
              <TableCell key={m} className="text-right font-mono text-muted-foreground">{machineStats[m]?.mean?.toFixed(2) || "---"}</TableCell>
            ))}
          </TableRow>
          <TableRow>
            <TableCell className="font-semibold text-muted-foreground uppercase text-[10px]">Min</TableCell>
            <TableCell className="text-right font-mono">{stats?.min?.toFixed(1) || "---"}</TableCell>
            {selectedMachines.length > 1 && selectedMachines.map(m => (
              <TableCell key={m} className="text-right font-mono text-muted-foreground">{machineStats[m]?.min?.toFixed(1) || "---"}</TableCell>
            ))}
          </TableRow>
          <TableRow>
            <TableCell className="font-semibold text-muted-foreground uppercase text-[10px]">Máx.</TableCell>
            <TableCell className="text-right font-mono">{stats?.max?.toFixed(1) || "---"}</TableCell>
            {selectedMachines.length > 1 && selectedMachines.map(m => (
              <TableCell key={m} className="text-right font-mono text-muted-foreground">{machineStats[m]?.max?.toFixed(1) || "---"}</TableCell>
            ))}
          </TableRow>
          <TableRow>
            <TableCell className="font-semibold text-muted-foreground uppercase text-[10px]">Desv. Est. σ</TableCell>
            <TableCell className="text-right font-mono">{stats?.stdDev?.toFixed(3) || "---"}</TableCell>
            {selectedMachines.length > 1 && selectedMachines.map(m => (
              <TableCell key={m} className="text-right font-mono text-muted-foreground">{machineStats[m]?.stdDev?.toFixed(3) || "---"}</TableCell>
            ))}
          </TableRow>
          <TableRow className="bg-blue-500/5">
            <TableCell className="font-bold text-blue-600 uppercase text-[10px]">Cp</TableCell>
            <TableCell className="text-right font-mono font-bold text-blue-600">
                {stats?.cp !== undefined && isFinite(stats.cp) && stats.cp !== 0  ? stats.cp.toFixed(3) : "---"}
            </TableCell>
            {selectedMachines.length > 1 && selectedMachines.map(m => {
              const s = machineStats[m];
              return (
                <TableCell key={m} className="text-right font-mono font-bold text-blue-600">
                  {s?.cp !== undefined && isFinite(s.cp) && s.cp !== 0 ? s.cp.toFixed(3) : "---"}
                </TableCell>
              );
            })}
          </TableRow>
          <TableRow className="bg-blue-500/10">
            <TableCell className="font-bold text-blue-600 uppercase text-[10px]">Cpk</TableCell>
            <TableCell className="text-right font-mono font-bold text-blue-600">
                {stats?.cpk !== undefined && isFinite(stats.cpk) && stats.cp !== 0  ? stats.cpk.toFixed(3) : "---"}
            </TableCell>
            {selectedMachines.length > 1 && selectedMachines.map(m => {
              const s = machineStats[m];
              return (
                <TableCell key={m} className="text-right font-mono font-bold text-blue-600">
                  {s?.cpk !== undefined && isFinite(s.cpk) && s.cp !== 0 ? s.cpk.toFixed(3) : "---"}
                </TableCell>
              );
            })}
          </TableRow>
          <TableRow className="bg-green-500/5">
            <TableCell className="font-semibold text-green-600 uppercase text-[10px]">Target</TableCell>
            <TableCell className="text-right font-mono font-bold text-green-600">{stats?.target?.toFixed(2) || "---"}</TableCell>
            {selectedMachines.length > 1 && selectedMachines.map(m => (
                <TableCell key={m} className="text-right font-mono text-muted-foreground">---</TableCell>
            ))}
          </TableRow>
          <TableRow>
            <TableCell className="font-semibold text-muted-foreground uppercase text-[10px]">LES</TableCell>
            <TableCell className="text-right font-mono text-destructive text-xs">{stats?.les || 0} </TableCell>
            {selectedMachines.length > 1 && selectedMachines.map(m => (
                <TableCell key={m} className="text-right font-mono text-muted-foreground">---</TableCell>
            ))}
          </TableRow>
          <TableRow>
            <TableCell className="font-semibold text-muted-foreground uppercase text-[10px]">LEI</TableCell>
            <TableCell className="text-right font-mono text-destructive text-xs">{stats?.lei || 0} </TableCell>
            {selectedMachines.length > 1 && selectedMachines.map(m => (
                <TableCell key={m} className="text-right font-mono text-muted-foreground">---</TableCell>
            ))}
          </TableRow>
        </TableBody>
      </Table>

      {stats && stats.hasLimits && (
         <div className="mt-6 space-y-3">
           {stats.cpk < 1 ? (
             <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-start gap-2">
               <Activity className="h-4 w-4 shrink-0 mt-0.5" />
               <p><strong>Baja Capacidad:</strong> El proceso excede los límites de tiempo establecidos frecuentemente.</p>
             </div>
           ) : stats.cpk >= 1.33 ? (
             <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-600 text-xs flex items-start gap-2">
               <Beaker className="h-4 w-4 shrink-0 mt-0.5" />
               <p><strong>Proceso Capaz:</strong> Estabilidad de tiempos excelente.</p>
             </div>
           ) : (
             <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-600 text-xs flex items-start gap-2">
               <Activity className="h-4 w-4 shrink-0 mt-0.5" />
               <p><strong>Control Adecuado:</strong> Los tiempos están mayormente dentro de los límites.</p>
             </div>
           )}
         </div>
      )}
    </div>
  );
}
