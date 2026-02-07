import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { KPICard } from "@/components/dashboard/KPICard";
import { EfficiencyChart } from "@/components/dashboard/EfficiencyChart";
import { AlertsWidget } from "@/components/dashboard/AlertsWidget";
import { 
  Boxes, 
  TrendingUp, 
  Clock 
} from "lucide-react";
import { 
  getTotalBatches, 
  getAverageCycleDeviation, 
  getMachineWithHighestIdleTime 
} from "@/data/mockData";

export default function Overview() {
  const totalBatches = getTotalBatches();
  const avgDeviation = getAverageCycleDeviation();
  const highestIdle = getMachineWithHighestIdleTime();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Global Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of brewing batch production efficiency
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <KPICard
            title="Total Batches Processed"
            value={totalBatches}
            subtitle="Last 30 days"
            icon={Boxes}
            variant="success"
          />
          <KPICard
            title="Average Cycle Deviation"
            value={`${avgDeviation > 0 ? '+' : ''}${avgDeviation}%`}
            subtitle="From expected time"
            icon={TrendingUp}
            variant={avgDeviation > 10 ? "danger" : avgDeviation > 5 ? "warning" : "success"}
          />
          <KPICard
            title="Highest Idle Time"
            value={`${highestIdle.idleTime} min`}
            subtitle={highestIdle.machine}
            icon={Clock}
            variant="warning"
          />
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chart takes 2 columns */}
          <div className="lg:col-span-2">
            <EfficiencyChart />
          </div>
          
          {/* Alerts sidebar */}
          <div className="lg:col-span-1">
            <AlertsWidget />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
