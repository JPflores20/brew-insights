import { cn } from "@/lib/utils";

interface ChartTooltipProps {
    active?: boolean;
    payload?: any[];
    label?: string;
    className?: string;
    indicator?: "line" | "dot" | "dashed";
    hideLabel?: boolean;
}

export function ChartTooltip({
    active,
    payload,
    label,
    className,
    indicator = "dot",
    hideLabel = false,
}: ChartTooltipProps) {
    if (!active || !payload || payload.length === 0) {
        return null;
    }

    return (
        <div
            className={cn(
                "bg-popover/95 backdrop-blur-sm border border-border/50 shadow-xl rounded-lg p-3 text-sm animation-in fade-in zoom-in-95 duration-200",
                className
            )}
        >
            {!hideLabel && (
                <div className="mb-2 font-semibold text-foreground border-b border-border/50 pb-1">
                    {label}
                </div>
            )}
            <div className="space-y-1.5">
                {payload.map((item: any, index: number) => (
                    <div key={index} className="flex items-center gap-2.5">
                        {indicator === "dot" && (
                            <div
                                className="h-2.5 w-2.5 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.3)]"
                                style={{
                                    backgroundColor: item.fill || item.stroke || item.color,
                                    boxShadow: `0 0 6px ${item.fill || item.stroke || item.color}40`
                                }}
                            />
                        )}
                        <div className="flex justify-between w-full gap-4">
                            <span className="text-muted-foreground font-medium">
                                {item.name}:
                            </span>
                            <span className="font-mono font-bold text-foreground">
                                {typeof item.value === 'number'
                                    ? item.value.toLocaleString(undefined, { maximumFractionDigits: 2 })
                                    : item.value}
                                {item.unit && <span className="text-xs ml-0.5 text-muted-foreground">{item.unit}</span>}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
