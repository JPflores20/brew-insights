import { memo, useMemo } from "react";
import { format, differenceInMinutes, isValid } from "date-fns";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface StepData {
    stepName: string;
    durationMin: number;
    expectedDurationMin: number;
    startTime: string | Date;
    endTime: string | Date;
}

interface GanttStepChartProps {
    stepsData: StepData[];
}

export const GanttStepChart = memo(function GanttStepChart({ stepsData }: GanttStepChartProps) {
    const { chartData, minTime, totalMinutes } = useMemo(() => {
        if (!stepsData || stepsData.length === 0) return { chartData: [], minTime: 0, totalMinutes: 0 };

        const parsedSteps = stepsData.map(step => ({
            ...step,
            parsedStart: new Date(step.startTime),
            parsedEnd: new Date(step.endTime)
        })).filter(s => isValid(s.parsedStart) && isValid(s.parsedEnd));

        if (parsedSteps.length === 0) return { chartData: [], minTime: 0, totalMinutes: 0 };

        // Sort by start time just to be safe
        parsedSteps.sort((a, b) => a.parsedStart.getTime() - b.parsedStart.getTime());

        const min = Math.min(...parsedSteps.map(s => s.parsedStart.getTime()));
        const max = Math.max(...parsedSteps.map(s => s.parsedEnd.getTime()));
        
        const chartData = parsedSteps.map((step, index) => {
            const startOffsetMin = differenceInMinutes(step.parsedStart, min);
            const duration = differenceInMinutes(step.parsedEnd, step.parsedStart);
            
            let gapBefore = null;
            if (index > 0) {
                const prevStep = parsedSteps[index - 1];
                const gapDurationMin = differenceInMinutes(step.parsedStart, prevStep.parsedEnd);
                if (gapDurationMin >= 1) {
                    gapBefore = {
                        durationMin: gapDurationMin,
                        startOffsetMin: differenceInMinutes(prevStep.parsedEnd, min),
                        startTime: prevStep.parsedEnd,
                        endTime: step.parsedStart
                    };
                }
            }

            return {
                ...step,
                startOffsetMin,
                duration,
                gapBefore
            };
        });

        return {
            chartData,
            minTime: min,
            totalMinutes: Math.max(differenceInMinutes(max, min), 1) * 1.1 // 10% padding for right labels
        };
    }, [stepsData]);

    if (!chartData || chartData.length === 0) {
        return <div className="flex h-full items-center justify-center p-4 text-center text-muted-foreground">Esperando datos de tiempo válidos...</div>;
    }

    return (
        <div className="w-full h-full overflow-auto p-4 bg-background rounded-md">
            <div className="relative min-w-[1000px] min-h-full py-6">
                <TooltipProvider>
                    {chartData.map((step, idx) => {
                        const isRed = step.stepName.toLowerCase().includes("espera") || step.stepName.toLowerCase().includes("pausa");
                        const leftPercent = (step.startOffsetMin / totalMinutes) * 100;
                        const widthPercent = Math.max((step.duration / totalMinutes) * 100, 0.3); // minimum visual width
                        const stepColor = isRed ? "#ef4444" : "#2563eb"; 

                        return (
                            <div key={`step-${idx}`} className="relative h-24 mb-6">
                                {step.gapBefore && (
                                    <div 
                                        className="absolute h-1.5 bg-red-500 z-10 opacity-80"
                                        style={{ 
                                            left: `${(step.gapBefore.startOffsetMin / totalMinutes) * 100}%`,
                                            width: `${(step.gapBefore.durationMin / totalMinutes) * 100}%`,
                                            top: '28px' 
                                        }}
                                    >
                                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs text-red-500 font-semibold whitespace-nowrap bg-background px-1 z-20">
                                            Tiempo perdido
                                        </div>
                                        <div className="absolute top-3 left-1/2 -translate-x-1/2 text-[10px] text-red-500 font-medium whitespace-nowrap bg-background px-1 z-20">
                                            {format(step.gapBefore.startTime, "HH:mm")} - {format(step.gapBefore.endTime, "HH:mm")} ({step.gapBefore.durationMin} min)
                                        </div>
                                    </div>
                                )}
                                
                                {/* Label Start */}
                                <div 
                                    className="absolute -top-1 text-xs font-semibold whitespace-nowrap z-20"
                                    style={{ left: `${leftPercent}%`, color: stepColor }}
                                >
                                    Inicio {step.stepName}
                                </div>
                                {/* Label End */}
                                <div 
                                    className="absolute -top-1 text-xs font-semibold whitespace-nowrap z-20"
                                    style={{ left: `${leftPercent + widthPercent}%`, transform: 'translateX(-100%)', color: stepColor }}
                                >
                                    Fin {step.stepName}
                                </div>
                                
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div 
                                            className="absolute h-1.5 cursor-pointer transition-all hover:h-2 hover:-translate-y-0.5"
                                            style={{ 
                                                left: `${leftPercent}%`, 
                                                width: `${widthPercent}%`,
                                                backgroundColor: stepColor,
                                                top: '28px',
                                                zIndex: 15
                                            }}
                                        >
                                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-current" style={{ backgroundColor: stepColor }} />
                                            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-current" style={{ backgroundColor: stepColor }} />
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent className="z-50">
                                        <div className="text-sm">
                                            <p className="font-semibold">{step.stepName}</p>
                                            <p>Inicio: {format(step.parsedStart, "HH:mm:ss")}</p>
                                            <p>Fin: {format(step.parsedEnd, "HH:mm:ss")}</p>
                                            <p>Duración R: {step.durationMin} min</p>
                                            <p>Duración T: {step.expectedDurationMin} min</p>
                                        </div>
                                    </TooltipContent>
                                </Tooltip>
                                
                                {/* Times beneath */}
                                <div 
                                    className="absolute text-xs text-muted-foreground font-mono mt-2 z-20"
                                    style={{ left: `${leftPercent}%`, top: '40px' }}
                                >
                                    {format(step.parsedStart, "HH:mm")}
                                </div>
                                <div 
                                    className="absolute text-xs text-muted-foreground font-mono mt-2 z-20"
                                    style={{ left: `${leftPercent + widthPercent}%`, top: '40px', transform: 'translateX(-100%)' }}
                                >
                                    {format(step.parsedEnd, "HH:mm")}
                                </div>
                            </div>
                        );
                    })}
                </TooltipProvider>
            </div>
        </div>
    );
});
