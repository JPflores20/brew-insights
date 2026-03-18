import { memo, useMemo } from "react";
import { format, differenceInMinutes, startOfDay, endOfDay, isValid } from "date-fns";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface BatchEvent {
    batchId: string;
    productName: string;
    startTime: Date;
    endTime: Date;
    durationMin: number;
}

export interface MachineRow {
    machineName: string;
    events: BatchEvent[];
}

interface EquipmentGanttChartProps {
    data: MachineRow[];
    selectedDate: Date;
}

export const EquipmentGanttChart = memo(function EquipmentGanttChart({ data, selectedDate }: EquipmentGanttChartProps) {
    const { rows, totalMinutes, hours } = useMemo(() => {
        if (!data || data.length === 0 || !isValid(selectedDate)) return { rows: [], totalMinutes: 1, hours: [] };

        const dayStart = startOfDay(selectedDate).getTime();
        const dayEnd = endOfDay(selectedDate).getTime();
        const fullDayMins = 24 * 60;
        
        const hours = Array.from({length: 25}, (_, i) => i); // 0 to 24
        
        const processedRows = data.map(row => {
            const sortedEvents = [...row.events].sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
            
            const processedEvents = sortedEvents.map((evt, idx) => {
                const sTime = Math.max(evt.startTime.getTime(), dayStart);
                const eTime = Math.max(sTime, Math.min(evt.endTime.getTime(), dayEnd));
                const durationVisible = Math.max(differenceInMinutes(eTime, sTime), 0);
                const startOffsetMin = Math.max(differenceInMinutes(sTime, dayStart), 0);
                
                let gapBefore = null;
                if (idx > 0) {
                    const prevEvt = sortedEvents[idx - 1];
                    const prevETime = Math.max(prevEvt.endTime.getTime(), dayStart);
                    const safePrevETime = Math.min(prevETime, dayEnd);
                    const gapMins = differenceInMinutes(sTime, safePrevETime);
                    // Show gap if > 1 min
                    if (gapMins >= 1) {
                        gapBefore = {
                            durationMin: gapMins,
                            startOffsetMin: Math.max(differenceInMinutes(safePrevETime, dayStart), 0),
                            startTime: new Date(safePrevETime),
                            endTime: new Date(sTime)
                        };
                    }
                }
                
                return {
                    ...evt,
                    startOffsetMin,
                    durationVisible,
                    visibleStartTime: new Date(sTime),
                    visibleEndTime: new Date(eTime),
                    gapBefore
                };
            }).filter(e => e.durationVisible > 0 || e.gapBefore);

            return {
                ...row,
                events: processedEvents
            };
        }).filter(r => r.events.length > 0);

        return {
            rows: processedRows,
            totalMinutes: fullDayMins,
            hours
        };
    }, [data, selectedDate]);

    if (!rows || rows.length === 0) {
        return (
            <div className="flex h-[400px] w-full items-center justify-center p-4 text-center text-muted-foreground border rounded-md glass">
                No hay lotes que visualizar para el día {format(selectedDate, "dd/MM/yyyy")}.
            </div>
        );
    }

    return (
        <div className="w-full h-full p-4 bg-card/50 backdrop-blur-sm border rounded-xl overflow-hidden flex flex-col">
            <h3 className="text-lg font-semibold mb-4 px-2">Cronograma de Equipos - {format(selectedDate, "dd/MM/yyyy")}</h3>
            <div className="relative flex-1 overflow-auto">
                <div className="min-w-[1400px] h-full flex">
                    {/* Y-Axis Labels - Sticky */}
                    <div className="w-52 flex-shrink-0 flex flex-col border-r sticky left-0 z-40 bg-card/95 backdrop-blur-sm">
                        <div className="h-[33px] border-b shrink-0" /> {/* Header spacer */}
                        {rows.map((row, idx) => (
                            <div key={`label-${idx}`} className="h-28 shrink-0 flex items-center px-4 font-semibold text-sm text-foreground border-b border-border/50">
                                {row.machineName}
                            </div>
                        ))}
                    </div>

                    {/* Chart Area */}
                    <div className="flex-1 relative border-b">
                        {/* Grid lines */}
                        <div className="absolute inset-0 pointer-events-none z-0">
                            {hours.map(hour => (
                                <div 
                                    key={`grid-${hour}`} 
                                    className="absolute top-0 bottom-0 border-l border-border/40"
                                    style={{ left: `${(hour * 60 / totalMinutes) * 100}%` }}
                                >
                                    <span className="absolute -top-6 -left-3 text-[10px] text-muted-foreground font-mono">
                                        {hour.toString().padStart(2, '0')}:00
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* Rows Content */}
                        <div className="relative z-10 pt-[33px]">
                            <TooltipProvider>
                                {rows.map((row, rowIdx) => (
                                    <div key={`row-${rowIdx}`} className="h-28 shrink-0 relative border-b border-border/50 group hover:bg-muted/10 transition-colors">
                                        {row.events.map((evt, evtIdx) => {
                                            const leftPercent = (evt.startOffsetMin / totalMinutes) * 100;
                                            const widthPercent = Math.max((evt.durationVisible / totalMinutes) * 100, 0.2); // minimum viable width
                                            
                                            return (
                                                <div key={`evt-${evtIdx}`} className="absolute top-0 bottom-0 w-full pointer-events-none">
                                                    
                                                    {/* Gap / Dead Time */}
                                                    {evt.gapBefore && (
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <div 
                                                                    className="absolute top-1/2 -translate-y-1/2 h-1 bg-red-500 z-10 opacity-70 flex flex-col justify-center items-center pointer-events-auto cursor-help transition-opacity hover:opacity-100"
                                                                    style={{ 
                                                                        left: `${(evt.gapBefore.startOffsetMin / totalMinutes) * 100}%`,
                                                                        width: `${(evt.gapBefore.durationMin / totalMinutes) * 100}%` 
                                                                    }}
                                                                />
                                                            </TooltipTrigger>
                                                            <TooltipContent className="z-50">
                                                                <p className="font-semibold text-red-500">Tiempo perdido</p>
                                                                <p>{format(evt.gapBefore.startTime, "HH:mm")} - {format(evt.gapBefore.endTime, "HH:mm")}</p>
                                                                <p>Total: {evt.gapBefore.durationMin} minutos sin operar</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    )}
                                                    
                                                    {/* Batch Block */}
                                                    <div 
                                                        className="absolute top-0 bottom-0 my-auto h-12 flex flex-col justify-center z-20 hover:z-30 pointer-events-auto"
                                                        style={{ left: `${leftPercent}%`, width: `${widthPercent}%` }}
                                                    >
                                                        {evt.durationMin > 0 && (
                                                            <>
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <div className="w-full h-3 bg-blue-600 rounded-full cursor-pointer hover:h-4 hover:bg-blue-500 transition-all shadow-sm border border-blue-800/20 relative">
                                                                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-blue-700" />
                                                                            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-blue-700" />
                                                                        </div>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent className="z-50">
                                                                        <div className="space-y-1">
                                                                            <p className="font-semibold text-blue-500 text-base">Lote: {evt.batchId}</p>
                                                                            <p>Producto: {evt.productName}</p>
                                                                            <p>Inicio equipo: {format(evt.startTime, "dd/MM/yyyy HH:mm:ss")}</p>
                                                                            <p>Fin equipo: {format(evt.endTime, "dd/MM/yyyy HH:mm:ss")}</p>
                                                                            <p className="text-muted-foreground">Duración en equipo: {evt.durationMin} min</p>
                                                                        </div>
                                                                    </TooltipContent>
                                                                </Tooltip>
                                                                
                                                                {/* Label above */}
                                                                <div className="absolute -top-5 w-full text-center text-[10px] font-semibold text-blue-700 truncate px-0.5">
                                                                    Lote {evt.batchId} 
                                                                </div>
                                                                {/* Time below */}
                                                                <div className="absolute -bottom-5 w-full text-center text-[10px] text-muted-foreground font-mono truncate px-0.5">
                                                                    {format(evt.visibleStartTime, "HH:mm")} - {format(evt.visibleEndTime, "HH:mm")}
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>

                                                </div>
                                            );
                                        })}
                                    </div>
                                ))}
                            </TooltipProvider>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
});
