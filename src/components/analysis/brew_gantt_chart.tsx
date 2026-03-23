import { memo, useMemo } from "react";
import { format, differenceInMinutes, startOfDay, endOfDay, isValid, parseISO } from "date-fns";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface StepEvent {
    stepName: string;
    startTime: Date;
    endTime: Date;
    durationMin: number;
    expectedDurationMin: number;
}

export interface BrewMachineRow {
    machineName: string;
    steps: StepEvent[];
}

interface BrewGanttChartProps {
    data: BrewMachineRow[];
    selectedBrewId: string;
}

export const BrewGanttChart = memo(function BrewGanttChart({ data, selectedBrewId }: BrewGanttChartProps) {
    const { rows, totalMinutes, hours, minTime, maxTime } = useMemo(() => {
        if (!data || data.length === 0 || !selectedBrewId) {
            return { rows: [], totalMinutes: 1, hours: [], minTime: new Date(), maxTime: new Date() };
        }

        // Find overall start and end to define the X-axis range for this specific brew
        let minT = Infinity;
        let maxT = -Infinity;

        data.forEach(row => {
            row.steps.forEach(step => {
                const s = step.startTime.getTime();
                const e = step.endTime.getTime();
                if (s < minT) minT = s;
                if (e > maxT) maxT = e;
            });
        });

        if (minT === Infinity) return { rows: [], totalMinutes: 1, hours: [], minTime: new Date(), maxTime: new Date() };

        // Expand range slightly for padding (e.g., 30 mins)
        const rangeStart = new Date(minT - 30 * 60000);
        const rangeEnd = new Date(maxT + 30 * 60000);
        const totalDurationMins = differenceInMinutes(rangeEnd, rangeStart);

        // Calculate hours to show on the axis
        const startHour = rangeStart.getHours();
        const endHour = Math.ceil(totalDurationMins / 60) + startHour + 1;
        const hoursAxis = [];
        for (let h = startHour; h <= endHour; h++) {
            hoursAxis.push(h);
        }

        const processedRows = data.map(row => {
            const sortedSteps = [...row.steps].sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
            
            const processedSteps = sortedSteps.map((step) => {
                const sTime = step.startTime.getTime();
                const eTime = step.endTime.getTime();
                const durationVisible = Math.max(differenceInMinutes(eTime, sTime), 1);
                const startOffsetMin = Math.max(differenceInMinutes(new Date(sTime), rangeStart), 0);
                
                return {
                    ...step,
                    startOffsetMin,
                    durationVisible,
                };
            });

            return {
                ...row,
                steps: processedSteps
            };
        }).filter(r => r.steps.length > 0);

        return {
            rows: processedRows,
            totalMinutes: totalDurationMins,
            hours: hoursAxis,
            minTime: rangeStart,
            maxTime: rangeEnd
        };
    }, [data, selectedBrewId]);

    if (!selectedBrewId) {
        return (
            <div className="flex h-[400px] w-full items-center justify-center p-4 text-center text-muted-foreground border rounded-md glass">
                Selecciona un cocimiento para visualizar su recorrido.
            </div>
        );
    }

    if (!rows || rows.length === 0) {
        return (
            <div className="flex h-[400px] w-full items-center justify-center p-4 text-center text-muted-foreground border rounded-md glass">
                No hay pasos que visualizar para el lote {selectedBrewId}.
            </div>
        );
    }

    return (
        <div className="w-full h-full p-4 bg-card/50 backdrop-blur-sm border rounded-xl overflow-hidden flex flex-col">
            <h3 className="text-lg font-semibold mb-4 px-2">Recorrido del Lote: {selectedBrewId}</h3>
            <div className="relative flex-1 overflow-auto">
                <div className="min-w-[1400px] h-full flex pt-8">
                    {/* Y-Axis Labels - Sticky */}
                    <div className="w-52 flex-shrink-0 flex flex-col border-r sticky left-0 z-40 bg-card/95 backdrop-blur-sm">
                        {rows.map((row, idx) => (
                            <div key={`label-${idx}`} className="h-20 shrink-0 flex items-center px-4 font-semibold text-sm text-foreground border-b border-border/50">
                                {row.machineName}
                            </div>
                        ))}
                    </div>

                    {/* Chart Area */}
                    <div className="flex-1 relative border-b">
                        {/* Grid lines */}
                        <div className="absolute inset-0 pointer-events-none z-0">
                            {hours.map(hour => {
                                // Calculate offset for this hour relative to rangeStart
                                const hourDate = new Date(minTime);
                                hourDate.setHours(hour, 0, 0, 0);
                                if (hourDate.getTime() < minTime.getTime()) {
                                    hourDate.setDate(hourDate.getDate() + 1);
                                }
                                
                                const offsetMin = differenceInMinutes(hourDate, minTime);
                                if (offsetMin < 0 || offsetMin > totalMinutes) return null;

                                return (
                                    <div 
                                        key={`grid-${hour}`} 
                                        className="absolute top-0 bottom-0 border-l border-border/40"
                                        style={{ left: `${(offsetMin / totalMinutes) * 100}%` }}
                                    >
                                        <span className="absolute -top-6 -left-3 text-[10px] text-muted-foreground font-mono">
                                            {format(hourDate, "HH:mm")}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Rows Content */}
                        <div className="relative z-10">
                            <TooltipProvider>
                                {rows.map((row, rowIdx) => (
                                    <div key={`row-${rowIdx}`} className="h-20 shrink-0 relative border-b border-border/50 group hover:bg-muted/10 transition-colors">
                                        {row.steps.map((step, stepIdx) => {
                                            const leftPercent = (step.startOffsetMin / totalMinutes) * 100;
                                            const widthPercent = Math.max((step.durationVisible / totalMinutes) * 100, 0.2);
                                            
                                            const isLate = step.durationMin > step.expectedDurationMin && step.expectedDurationMin > 0;

                                            return (
                                                <div 
                                                    key={`step-${stepIdx}`} 
                                                    className="absolute top-0 bottom-0 my-auto h-8 flex flex-col justify-center z-20 hover:z-30 pointer-events-auto"
                                                    style={{ left: `${leftPercent}%`, width: `${widthPercent}%` }}
                                                >
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <div className={`w-full h-4 rounded-full cursor-pointer hover:h-5 transition-all shadow-sm border ${isLate ? 'bg-amber-500 border-amber-700/20' : 'bg-blue-600 border-blue-800/20'}`}>
                                                            </div>
                                                        </TooltipTrigger>
                                                        <TooltipContent className="z-50">
                                                            <div className="space-y-1">
                                                                <p className="font-semibold text-blue-500 text-base">{step.stepName}</p>
                                                                <p>Equipo: {row.machineName}</p>
                                                                <p>Inicio: {format(step.startTime, "dd/MM/yyyy HH:mm:ss")}</p>
                                                                <p>Fin: {format(step.endTime, "dd/MM/yyyy HH:mm:ss")}</p>
                                                                <p>Duración Real: {step.durationMin} min</p>
                                                                <p className="text-muted-foreground">Esperado: {step.expectedDurationMin} min</p>
                                                                {isLate && <p className="text-amber-500 font-bold">Desviación: {step.durationMin - step.expectedDurationMin} min</p>}
                                                            </div>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                    

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
