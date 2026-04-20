import { MetricCard } from "@/components/ui/metric_card";
import { Activity, Clock, TrendingUp, CheckCircle } from "lucide-react";

interface CycleMetricsProps {
  stats: {
    avg: number;
    count: number;
    max: number;
    min: number;
  };
  theoreticalDuration: number;
  compliancePercentage: number;
}

export function CycleMetrics({
  stats,
  theoreticalDuration,
  compliancePercentage
}: CycleMetricsProps) {
  return (
    <div className="grid gap-6 md:grid-cols-4">
      <MetricCard
          title="Lotes Únicos"
          value={stats.count}
          icon={Activity}
          delay={0.1}
          className="border-l-4 border-l-primary"
      />
      <MetricCard
          title="Promedio Real"
          value={`${stats.avg} min`}
          subtitle={`Meta Global: ${theoreticalDuration} min`}
          icon={Clock}
          delay={0.2}
          trend={stats.avg > theoreticalDuration ? "down" : "up"}
          trendValue={stats.avg > theoreticalDuration ? "Excede Meta" : "En Meta"}
          className={stats.avg > theoreticalDuration ? "border-l-4 border-l-destructive" : "border-l-4 border-l-green-500"}
      />
      <MetricCard
          title="Desviación Máxima"
          value={`+${Math.round((stats.max - theoreticalDuration) * 100) / 100} min`}
          subtitle={`Peor caso: ${stats.max} min`}
          icon={TrendingUp}
          delay={0.3}
          className="border-l-4 border-l-chart-delay"
      />
      <MetricCard
          title="Cumplimiento"
          value={`${compliancePercentage}%`}
          subtitle="Lotes dentro de meta"
          icon={CheckCircle}
          delay={0.4}
          trend={compliancePercentage > 80 ? "up" : "down"}
          className={compliancePercentage > 80 ? "border-l-4 border-l-green-500" : "border-l-4 border-l-amber-500"}
      />
    </div>
  );
}
