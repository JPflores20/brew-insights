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
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from "recharts";
import { CheckCircle2, XCircle, ArrowRight } from "lucide-react";
import { getUniqueBatchIds, getBatchById, machineGroups } from "@/data/mockData";

export default function BatchComparison() {
  const batchIds = getUniqueBatchIds();
  const [batchA, setBatchA] = useState(batchIds[0]);
  const [batchB, setBatchB] = useState(batchIds[1]);

  const batchAData = getBatchById(batchA);
  const batchBData = getBatchById(batchB);

  // Prepare comparison data
  const comparisonData = machineGroups.map(machine => {
    const recordA = batchAData.find(d => d.TEILANL_GRUPO === machine.name);
    const recordB = batchBData.find(d => d.TEILANL_GRUPO === machine.name);
    
    return {
      machine: machine.name,
      [batchA]: recordA?.real_total_min || 0,
      [batchB]: recordB?.real_total_min || 0,
      delta: (recordA?.real_total_min || 0) - (recordB?.real_total_min || 0),
    };
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Batch Comparison Tool</h1>
          <p className="text-muted-foreground">
            Compare processing times between two batches
          </p>
        </div>

        {/* Selection Controls */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg">Select Batches to Compare</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="flex-1 w-full">
                <label className="text-sm text-muted-foreground mb-2 block">Batch A</label>
                <Select value={batchA} onValueChange={setBatchA}>
                  <SelectTrigger className="w-full bg-secondary">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {batchIds.map(id => (
                      <SelectItem key={id} value={id} disabled={id === batchB}>
                        {id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <ArrowRight className="h-6 w-6 text-muted-foreground hidden sm:block mt-6" />
              
              <div className="flex-1 w-full">
                <label className="text-sm text-muted-foreground mb-2 block">Batch B</label>
                <Select value={batchB} onValueChange={setBatchB}>
                  <SelectTrigger className="w-full bg-secondary">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {batchIds.map(id => (
                      <SelectItem key={id} value={id} disabled={id === batchA}>
                        {id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Comparison Chart */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg">Processing Time Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={comparisonData}
                  layout="vertical"
                  margin={{ top: 20, right: 30, left: 100, bottom: 20 }}
                >
                  <CartesianGrid 
                    strokeDasharray="3 3" 
                    stroke="hsl(var(--border))" 
                    opacity={0.5}
                    horizontal={true}
                    vertical={false}
                  />
                  <XAxis 
                    type="number"
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                    tickLine={{ stroke: 'hsl(var(--border))' }}
                    label={{ 
                      value: 'Minutes', 
                      position: 'bottom',
                      fill: 'hsl(var(--muted-foreground))'
                    }}
                  />
                  <YAxis 
                    type="category"
                    dataKey="machine"
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                    tickLine={{ stroke: 'hsl(var(--border))' }}
                    width={90}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      color: 'hsl(var(--popover-foreground))'
                    }}
                  />
                  <Legend wrapperStyle={{ paddingTop: '20px' }} />
                  <Bar 
                    dataKey={batchA} 
                    fill="hsl(var(--chart-expected))" 
                    radius={[0, 4, 4, 0]}
                    name={`Batch ${batchA}`}
                  />
                  <Bar 
                    dataKey={batchB} 
                    fill="hsl(var(--chart-real))" 
                    radius={[0, 4, 4, 0]}
                    name={`Batch ${batchB}`}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Delta Indicators */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg">Performance Delta</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {comparisonData.map(item => (
                <div 
                  key={item.machine}
                  className="p-4 rounded-lg bg-secondary border border-border flex items-center justify-between"
                >
                  <div>
                    <p className="font-medium text-foreground">{item.machine}</p>
                    <p className="text-sm text-muted-foreground">
                      {Math.abs(item.delta)} min difference
                    </p>
                  </div>
                  {item.delta < 0 ? (
                    <Badge className="bg-primary text-primary-foreground gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      A faster
                    </Badge>
                  ) : item.delta > 0 ? (
                    <Badge variant="destructive" className="gap-1">
                      <XCircle className="h-3 w-3" />
                      B faster
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Equal</Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
