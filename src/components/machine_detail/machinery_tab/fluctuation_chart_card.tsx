import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from "recharts";

export function FluctuationChartCard({
  chartData,
  compareBatchIds,
  selectedBatchId,
  colors,
}: {
  chartData: any[];
  compareBatchIds: string[];
  selectedBatchId: string;
  colors: string[];
}) {
  return (
    <Card>
      <CardHeader className="pb-4">
         <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Análisis de Fluctuaciones entre Lotes
         </CardTitle>
         <p className="text-sm text-muted-foreground">Comparativa visual de métricas críticas</p>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
              <XAxis 
                dataKey="metric" 
                tick={{ fontSize: 10 }} 
                stroke="hsl(var(--muted-foreground))"
                interval={0}
                angle={-45}
                textAnchor="end"
              />
              <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <RechartsTooltip 
                contentStyle={{ 
                    backgroundColor: "hsl(var(--background))", 
                    borderColor: "hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px"
                }}
              />
              <Legend verticalAlign="top" height={36}/>
              {compareBatchIds.map((id, index) => (
                <Line
                  key={id}
                  type="monotone"
                  dataKey={id}
                  stroke={colors[index % colors.length]}
                  strokeWidth={id === selectedBatchId ? 3 : 1.5}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                  name={`Lote ${id}`}
                  opacity={id === selectedBatchId ? 1 : 0.7}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
