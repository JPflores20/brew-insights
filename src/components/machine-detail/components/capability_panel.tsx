import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ActivitySquare } from "lucide-react";
import { CapabilityStats } from "../types";

interface CapabilityPanelProps {
    stats: CapabilityStats;
    availableStepsForCp: string[];
    selectedStepForCp: string;
    setSelectedStepForCp: (val: string) => void;
    tolerance: number;
    setTolerance: (val: number) => void;
}

const truncateLabel = (v: any, max = 18) => String(v ?? "").length > max ? String(v ?? "").slice(0, max - 1) + "…" : String(v ?? "");

export function CapabilityPanel({
    stats, availableStepsForCp, selectedStepForCp, setSelectedStepForCp, tolerance, setTolerance
}: CapabilityPanelProps) {
    return (
        <div className="flex flex-col gap-2 p-3 bg-muted/20 border border-border rounded-md mt-2 print:hidden">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <span className="text-sm font-semibold flex items-center gap-2 whitespace-nowrap">
                    <ActivitySquare className="w-4 h-4 text-primary" /> Capacidad (Cp/Cpk) Global
                </span>
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground whitespace-nowrap">Paso:</span>
                        <Select value={selectedStepForCp || ""} onValueChange={setSelectedStepForCp}>
                            <SelectTrigger className="w-[140px] h-7 text-xs bg-background/50">
                                <SelectValue placeholder="Seleccionar paso" />
                            </SelectTrigger>
                            <SelectContent>
                                {availableStepsForCp.map(step => (
                                    <SelectItem key={step} value={step}>{truncateLabel(step, 20)}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground whitespace-nowrap">Tolerancia (±):</span>
                        <Input 
                            type="number" step="0.1" min="0.1"
                            className="w-16 h-7 text-xs bg-background/50" 
                            value={tolerance} 
                            onChange={(e) => setTolerance(Number(e.target.value))}
                        />
                    </div>
                </div>
            </div>
            
            <div className="grid grid-cols-1 mt-1">
                <div className="flex flex-col p-3 bg-background/50 border border-border/50 rounded flex-1 shadow-sm">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium truncate">Paso: {stats.name} ({stats.valuesCount} datos)</span>
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-x-4 gap-y-2 text-sm leading-tight items-center">
                        <div className="flex flex-col"><span className="text-[10px] text-muted-foreground uppercase tracking-wider">Objetivo</span><span className="font-semibold">{stats.avgTarget.toFixed(2)}</span></div>
                        <div className="flex flex-col"><span className="text-[10px] text-muted-foreground uppercase tracking-wider">Media (μ)</span><span className="font-semibold">{stats.mean.toFixed(2)}</span></div>
                        <div className="flex flex-col"><span className="text-[10px] text-muted-foreground uppercase tracking-wider">Desv. Est. (σ)</span><span className="font-semibold">{stats.stdDev.toFixed(2)}</span></div>
                        
                        <div className="hidden sm:block col-span-1 border-l h-full mx-auto border-border/30"></div>
                        
                        <div className="flex flex-col"><span className="text-[10px] text-muted-foreground uppercase tracking-wider">Cp</span><span className={stats.cp >= 1.33 ? "text-green-500 font-bold" : (stats.cp >= 1 ? "text-amber-500 font-bold" : "text-destructive font-bold text-lg")}>{stats.cp.toFixed(2)}</span></div>
                        <div className="flex flex-col"><span className="text-[10px] text-muted-foreground uppercase tracking-wider">Cpk</span><span className={stats.cpk >= 1.33 ? "text-green-500 font-bold" : (stats.cpk >= 1 ? "text-amber-500 font-bold" : "text-destructive font-bold text-lg")}>{stats.cpk.toFixed(2)}</span></div>
                    </div>
                </div>
            </div>
        </div>
    );
}
