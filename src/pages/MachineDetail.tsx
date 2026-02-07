import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  ScatterChart, 
  Scatter, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine
} from "recharts";
import { Clock, TrendingUp, AlertTriangle, CheckCircle2 } from "lucide-react";
import { machineGroups, getMachineData } from "@/data/mockData";

export default function MachineDetail() {
  const [selectedMachine, setSelectedMachine] = useState(machineGroups[0].name);
  
  const machineData = getMachineData(selectedMachine);
  
  // Prepare scatter data with batch sequence
  const scatterData = machineData.map((record, index) => ({
    batch: index + 1,
    batchId: record.CHARG_NR,
    realTime: record.real_total_min,
    expectedTime: record.esperado_total_min,
    idle: record.idle_wall_minus_sumsteps_min,
  }));

  // Calculate statistics
  const avgExpected = machineData.length > 0 
    ? Math.round(machineData.reduce((sum, r) => sum + r.esperado_total_min, 0) / machineData.length)
    : 0;
  
  const maxGap = Math.max(...machineData.map(r => r.idle_wall_minus_sumsteps_min));
  const avgIdle = machineData.length > 0
    ? Math.round(machineData.reduce((sum, r) => sum + r.idle_wall_minus_sumsteps_min, 0) / machineData.length)
    : 0;
  
  // Detect trend (simple linear regression slope direction)
  const n = scatterData.length;
  const sumX = scatterData.reduce((sum, d) => sum + d.batch, 0);
  const sumY = scatterData.reduce((sum, d) => sum + d.realTime, 0);
  const sumXY = scatterData.reduce((sum, d) => sum + d.batch * d.realTime, 0);
  const sumX2 = scatterData.reduce((sum, d) => sum + d.batch * d.batch, 0);
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const trend = slope > 0.5 ? "increasing" : slope < -0.5 ? "decreasing" : "stable";

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Machine Detail View</h1>
          <p className="text-muted-foreground">
            Analyze individual equipment performance over time
          </p>
        </div>

        {/* Machine Selector */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg">Select Equipment</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedMachine} onValueChange={setSelectedMachine}>
              <SelectTrigger className="w-full sm:w-64 bg-secondary">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {machineGroups.map(machine => (
                  <SelectItem key={machine.name} value={machine.name}>
                    {machine.displayName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="bg-card border-border">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Max Gap Duration</p>
                  <p className="text-2xl font-bold text-foreground">{maxGap} min</p>
                  <p className="text-xs text-muted-foreground mt-1">Longest stop time</p>
                </div>
                <div className="p-3 rounded-lg bg-secondary">
                  <AlertTriangle className="h-6 w-6 text-chart-delay" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Average Idle Time</p>
                  <p className="text-2xl font-bold text-foreground">{avgIdle} min</p>
                  <p className="text-xs text-muted-foreground mt-1">Per batch cycle</p>
                </div>
                <div className="p-3 rounded-lg bg-secondary">
                  <Clock className="h-6 w-6 text-chart-idle" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Performance Trend</p>
                  <p className="text-2xl font-bold text-foreground capitalize">{trend}</p>
                  <Badge 
                    variant={trend === "stable" ? "secondary" : trend === "decreasing" ? "default" : "destructive"}
                    className="mt-1"
                  >
                    {trend === "increasing" ? "Getting slower" : trend === "decreasing" ? "Improving" : "Consistent"}
                  </Badge>
                </div>
                <div className="p-3 rounded-lg bg-secondary">
                  {trend === "stable" ? (
                    <CheckCircle2 className="h-6 w-6 text-primary" />
                  ) : (
                    <TrendingUp className="h-6 w-6 text-chart-real" />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Trend Scatter Plot */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg">Processing Time Trend - {selectedMachine}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                  <CartesianGrid 
                    strokeDasharray="3 3" 
                    stroke="hsl(var(--border))" 
                    opacity={0.5}
                  />
                  <XAxis 
                    dataKey="batch" 
                    type="number"
                    name="Batch #"
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                    tickLine={{ stroke: 'hsl(var(--border))' }}
                    label={{ 
                      value: 'Batch Sequence', 
                      position: 'bottom',
                      offset: 40,
                      fill: 'hsl(var(--muted-foreground))'
                    }}
                  />
                  <YAxis 
                    dataKey="realTime"
                    type="number"
                    name="Real Time"
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                    tickLine={{ stroke: 'hsl(var(--border))' }}
                    label={{ 
                      value: 'Real Time (min)', 
                      angle: -90, 
                      position: 'insideLeft',
                      fill: 'hsl(var(--muted-foreground))'
                    }}
                    domain={['dataMin - 10', 'dataMax + 10']}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      color: 'hsl(var(--popover-foreground))'
                    }}
                    formatter={(value: number, name: string) => {
                      if (name === 'realTime') return [`${value} min`, 'Real Time'];
                      return [value, name];
                    }}
                    labelFormatter={(label) => {
                      const point = scatterData.find(d => d.batch === label);
                      return point ? `Batch: ${point.batchId}` : `Batch #${label}`;
                    }}
                  />
                  <ReferenceLine 
                    y={avgExpected} 
                    stroke="hsl(var(--chart-expected))" 
                    strokeDasharray="5 5"
                    label={{ 
                      value: 'Expected', 
                      fill: 'hsl(var(--chart-expected))',
                      position: 'right'
                    }}
                  />
                  <Scatter 
                    data={scatterData} 
                    fill="hsl(var(--chart-real))"
                    shape="circle"
                  />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Gap Analysis Table */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg">Batch Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium">Batch ID</th>
                    <th className="text-right py-3 px-4 text-muted-foreground font-medium">Expected</th>
                    <th className="text-right py-3 px-4 text-muted-foreground font-medium">Real</th>
                    <th className="text-right py-3 px-4 text-muted-foreground font-medium">Delta</th>
                    <th className="text-right py-3 px-4 text-muted-foreground font-medium">Idle Time</th>
                  </tr>
                </thead>
                <tbody>
                  {machineData.map((record, index) => (
                    <tr key={index} className="border-b border-border hover:bg-secondary/50">
                      <td className="py-3 px-4 font-mono text-foreground">{record.CHARG_NR}</td>
                      <td className="py-3 px-4 text-right text-muted-foreground">{record.esperado_total_min} min</td>
                      <td className="py-3 px-4 text-right text-foreground">{record.real_total_min} min</td>
                      <td className="py-3 px-4 text-right">
                        <span className={record.delta_total_min > 0 ? "text-chart-delay" : "text-primary"}>
                          {record.delta_total_min > 0 ? '+' : ''}{record.delta_total_min} min
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right text-muted-foreground">{record.idle_wall_minus_sumsteps_min} min</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
