import { ReactNode } from "react";
import { 
  ResponsiveContainer, 
  BarChart, 
  LineChart, 
  ComposedChart, 
  AreaChart 
} from "recharts";

export interface CartesianChartProps {
  data: any[];
  chartType?: "bar" | "line" | "area" | "composed";
  layout?: "horizontal" | "vertical";
  margin?: { top?: number; right?: number; bottom?: number; left?: number };
  barSize?: number;
  width?: string | number;
  height?: string | number;
  children: ReactNode;
}

export function CartesianChart({
  data,
  chartType = "composed",
  layout = "horizontal",
  margin = { top: 20, right: 30, left: 20, bottom: 5 },
  barSize,
  width = "100%",
  height = "100%",
  children,
}: CartesianChartProps) {
  
  const renderChart = () => {
    switch (chartType) {
      case "bar":
        return (
          <BarChart data={data} layout={layout} margin={margin} barSize={barSize}>
            {children}
          </BarChart>
        );
      case "line":
        return (
          <LineChart data={data} layout={layout} margin={margin}>
            {children}
          </LineChart>
        );
      case "area":
        return (
          <AreaChart data={data} layout={layout} margin={margin}>
            {children}
          </AreaChart>
        );
      case "composed":
      default:
        return (
          <ComposedChart data={data} layout={layout} margin={margin} barSize={barSize}>
            {children}
          </ComposedChart>
        );
    }
  };

  return (
    <ResponsiveContainer width={width} height={height}>
      {renderChart()}
    </ResponsiveContainer>
  );
}
