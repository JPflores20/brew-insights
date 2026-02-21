import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    icon?: LucideIcon;
    trend?: "up" | "down" | "neutral";
    trendValue?: string;
    className?: string;
    delay?: number;
}

export function MetricCard({
    title,
    value,
    subtitle,
    icon: Icon,
    trend,
    trendValue,
    className,
    delay = 0,
}: MetricCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay }}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
        >
            <Card
                className={cn(
                    "relative overflow-hidden border-border bg-card/50 backdrop-blur-sm card-hover",
                    className
                )}
            >
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    {Icon && <Icon className="h-16 w-16" />}
                </div>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                        {title}
                        {Icon && <Icon className="h-4 w-4 text-primary" />}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-foreground tracking-tight">
                        {value}
                    </div>
                    {(subtitle || trendValue) && (
                        <div className="flex items-center mt-1 text-xs text-muted-foreground">
                            {trendValue && (
                                <span
                                    className={cn(
                                        "font-medium mr-2",
                                        trend === "up" && "text-red-500", // En producción, subir el tiempo suele ser malo? O bueno si es eficiencia?
                                        trend === "down" && "text-green-500", // Depende del KPI. Asumiremos colores semánticos genéricos o pasados par la prop.
                                        trend === "neutral" && "text-muted-foreground"
                                    )}
                                >
                                    {trendValue}
                                </span>
                            )}
                            {subtitle}
                        </div>
                    )}
                </CardContent>
            </Card>
        </motion.div>
    );
}
