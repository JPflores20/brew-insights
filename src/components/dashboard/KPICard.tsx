import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  variant?: "default" | "success" | "warning" | "danger";
}

export function KPICard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon,
  trend,
  trendValue,
  variant = "default" 
}: KPICardProps) {
  const iconColors = {
    default: "text-muted-foreground",
    success: "text-primary",
    warning: "text-chart-real",
    danger: "text-chart-delay",
  };

  const trendColors = {
    up: "text-chart-delay",
    down: "text-primary",
    neutral: "text-muted-foreground",
  };

  return (
    <Card className="bg-card border-border">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold text-foreground">{value}</p>
            {subtitle && (
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            )}
            {trend && trendValue && (
              <p className={cn("text-sm font-medium", trendColors[trend])}>
                {trend === "up" ? "↑" : trend === "down" ? "↓" : "→"} {trendValue}
              </p>
            )}
          </div>
          <div className={cn("p-3 rounded-lg bg-secondary", iconColors[variant])}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
