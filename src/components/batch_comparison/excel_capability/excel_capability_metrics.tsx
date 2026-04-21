import { Table, TableBody, TableCell, TableHead, TableRow } from "@/components/ui/table";
import { Activity } from "lucide-react";

interface ExcelCapabilityMetricsProps {
  stats: any;
}

export function ExcelCapabilityMetrics({ stats }: ExcelCapabilityMetricsProps) {
  return (
    <div className="w-full">
      <Table>
        <TableBody>
          <TableRow>
            <TableCell className="font-semibold text-muted-foreground uppercase text-[10px]">n</TableCell>
            <TableCell className="text-right font-mono">{stats?.n || 0}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-semibold text-muted-foreground uppercase text-[10px]">Media</TableCell>
            <TableCell className="text-right font-mono font-bold text-fuchsia-500">{stats?.mean?.toFixed(3) || "---"}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-semibold text-muted-foreground uppercase text-[10px]">Min</TableCell>
            <TableCell className="text-right font-mono">{stats?.min?.toFixed(3) || "---"}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-semibold text-muted-foreground uppercase text-[10px]">Máx.</TableCell>
            <TableCell className="text-right font-mono">{stats?.max?.toFixed(3) || "---"}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-semibold text-muted-foreground uppercase text-[10px]">Desv. Est. σ</TableCell>
            <TableCell className="text-right font-mono">{stats?.stdDev?.toFixed(4) || "---"}</TableCell>
          </TableRow>
          <TableRow className="bg-fuchsia-500/5">
            <TableCell className="font-bold text-fuchsia-600 uppercase text-[10px]">Cp</TableCell>
            <TableCell className="text-right font-mono font-bold text-fuchsia-600">
                {stats?.cp !== undefined && isFinite(stats.cp) ? stats.cp.toFixed(3) : "---"}
            </TableCell>
          </TableRow>
          <TableRow className="bg-fuchsia-500/10">
            <TableCell className="font-bold text-fuchsia-600 uppercase text-[10px]">Cpk</TableCell>
            <TableCell className="text-right font-mono font-bold text-fuchsia-600">
                {stats?.cpk !== undefined && isFinite(stats.cpk) ? stats.cpk.toFixed(3) : "---"}
            </TableCell>
          </TableRow>
          <TableRow className="bg-green-500/5">
            <TableCell className="font-semibold text-green-600 uppercase text-[10px]">Target</TableCell>
            <TableCell className="text-right font-mono font-bold text-green-600">{stats?.target?.toFixed(3) || "---"}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-semibold text-muted-foreground uppercase text-[10px]">LES</TableCell>
            <TableCell className="text-right font-mono text-destructive">{stats?.les?.toFixed(3) || "---"}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-semibold text-muted-foreground uppercase text-[10px]">LEI</TableCell>
            <TableCell className="text-right font-mono text-destructive">{stats?.lei?.toFixed(3) || "---"}</TableCell>
          </TableRow>
        </TableBody>
      </Table>

      {stats && (stats.cpk < 1) && (
         <div className="mt-6 p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-start gap-3">
           <Activity className="h-5 w-5 mt-0.5 shrink-0" />
           <p><strong>Baja Capacidad:</strong> El Cpk es menor a 1.0.</p>
         </div>
      )}
    </div>
  );
}
