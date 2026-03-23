import React from "react";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LayoutDashboard, Layers, BarChart3, Cog } from "lucide-react";

export function MachineTabsList() {
    return (
        <div className="flex items-center justify-between print:hidden">
            <TabsList className="grid w-full max-w-[800px] grid-cols-4 bg-muted/50 p-1 rounded-lg">
                <TabsTrigger
                    value="machine-view"
                    className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all"
                >
                    <LayoutDashboard className="h-4 w-4" /> Detalle
                </TabsTrigger>
                <TabsTrigger
                    value="sequence-compare"
                    className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all"
                >
                    <BarChart3 className="h-4 w-4" /> Comparativa
                </TabsTrigger>
                <TabsTrigger
                    value="global-view"
                    className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all"
                >
                    <Layers className="h-4 w-4" /> Línea Tiempo
                </TabsTrigger>
                <TabsTrigger
                    value="machinery"
                    className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all"
                >
                    <Cog className="h-4 w-4" /> Equipos
                </TabsTrigger>
            </TabsList>
        </div>
    );
}
