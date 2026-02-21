import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import { getAveragesByMachine, BatchRecord } from "@/data/mock_data";
import { cn } from "@/lib/utils";
import { ChartTooltip } from "@/components/ui/chart_tooltip";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown_menu";
import { Button } from "@/components/ui/button";
import { Settings2, BarChart3, LineChart as LineChartIcon, Table as TableIcon } from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll_area";

interface EfficiencyChartProps {
  data: BatchRecord[];
  className?: string;
  titleClassName?: string;
}

import { calculateEfficiencyData } from "@/utils/math_utils";

export function EfficiencyChart({ data, className, titleClassName }: EfficiencyChartProps) {
  // 1. Preparamos los datos base ORDENADOS
  const allChartData = useMemo(() => {
    const rawAverages = getAveragesByMachine(data);
    return calculateEfficiencyData(rawAverages);
  }, [data]);

  // 2. Estado para el Filtro de Equipos
  const [selectedMachines, setSelectedMachines] = useState<string[]>([]);

  // 3. Datos Filtrados
  const filteredData = useMemo(() => {
      if (selectedMachines.length === 0) return allChartData;
      return allChartData.filter(d => selectedMachines.includes(d.machine));
  }, [allChartData, selectedMachines]);

  // Manejador de selección de equipos
  const toggleMachine = (machineName: string) => {
      setSelectedMachines(prev => 
          prev.includes(machineName) 
              ? prev.filter(m => m !== machineName)
              : [...prev, machineName]
      );
  };

  const clearFilter = () => setSelectedMachines([]);

  return (
    <Card className="bg-card border-border h-full flex flex-col overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className={cn("text-lg font-semibold text-foreground", titleClassName)}>
          Eficiencia Promedio por Grupo
        </CardTitle>
        
        <div className="flex items-center gap-2">
            {/* Filtro de Equipos */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8 gap-1 hidden sm:flex">
                        <Settings2 className="h-3.5 w-3.5" />
                        <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                            Filtros {selectedMachines.length > 0 ? `(${selectedMachines.length})` : ""}
                        </span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[200px]">
                    <DropdownMenuLabel>Filtrar Equipos</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <div className="max-h-[300px] overflow-y-auto overflow-x-hidden">
                        {allChartData.map((d) => (
                            <DropdownMenuCheckboxItem
                                key={d.machine}
                                checked={selectedMachines.length === 0 || selectedMachines.includes(d.machine)}
                                onCheckedChange={() => toggleMachine(d.machine)}
                            >
                                {d.machine}
                            </DropdownMenuCheckboxItem>
                        ))}
                    </div>
                    {selectedMachines.length > 0 && (
                        <>
                            <DropdownMenuSeparator />
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                className="w-full justify-center text-xs h-8"
                                onClick={clearFilter}
                            >
                                Limpiar Filtros
                            </Button>
                        </>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 min-h-0 overflow-hidden p-0">
        <Tabs defaultValue="bar" className="h-full flex flex-col">
            <div className="px-6 pb-2 border-b">
                <TabsList className="grid w-full grid-cols-3 h-8">
                    <TabsTrigger value="bar" className="text-xs"><BarChart3 className="w-3 h-3 mr-2"/> Barras</TabsTrigger>
                    <TabsTrigger value="line" className="text-xs"><LineChartIcon className="w-3 h-3 mr-2"/> Líneas</TabsTrigger>
                    <TabsTrigger value="table" className="text-xs"><TableIcon className="w-3 h-3 mr-2"/> Tabla</TabsTrigger>
                </TabsList>
            </div>

            <div className={cn("flex-1 w-full min-h-0 relative p-4", className)}>
                {/* VISTA BARRAS */}
                <TabsContent value="bar" className="h-full mt-0 data-[state=active]:flex flex-col">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={filteredData}
                      margin={{ top: 10, right: 10, left: 0, bottom: 40 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                      <XAxis
                        dataKey="displayMachine"
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                        axisLine={{ stroke: 'hsl(var(--border))' }}
                        tickLine={false}
                        interval={0}
                        angle={-45}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                        axisLine={false}
                        tickLine={false}
                        label={{ value: 'Minutos', angle: -90, position: 'insideLeft', fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                      />
                      <Tooltip content={<ChartTooltip indicator="line" valueSuffix="min" />} cursor={{ fill: 'hsl(var(--muted)/0.4)' }} />
                      <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                      <Bar dataKey="Tiempo Esperado" fill="hsl(var(--chart-expected))" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Tiempo Real" fill="hsl(var(--chart-real))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </TabsContent>

                {/* VISTA LINEAS */}
                <TabsContent value="line" className="h-full mt-0 data-[state=active]:flex flex-col">
                   <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={filteredData}
                      margin={{ top: 10, right: 10, left: 0, bottom: 40 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                      <XAxis
                        dataKey="displayMachine"
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                        axisLine={{ stroke: 'hsl(var(--border))' }}
                        tickLine={false}
                        interval={0}
                        angle={-45}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis
                         tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                         axisLine={false}
                         tickLine={false}
                      />
                      <Tooltip content={<ChartTooltip indicator="line" valueSuffix="min" />} />
                      <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                      <Line type="monotone" dataKey="Tiempo Esperado" stroke="hsl(var(--chart-expected))" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                      <Line type="monotone" dataKey="Tiempo Real" stroke="hsl(var(--chart-real))" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </TabsContent>

                {/* VISTA TABLA */}
                <TabsContent value="table" className="h-full mt-0 data-[state=active]:flex flex-col overflow-hidden">
                    <ScrollArea className="h-full w-full rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Equipo</TableHead>
                                    <TableHead className="text-right">T. Esperado (min)</TableHead>
                                    <TableHead className="text-right">T. Real (min)</TableHead>
                                    <TableHead className="text-right">Desviación</TableHead>
                                    <TableHead className="text-right">T. Muerto</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredData.map((item) => (
                                    <TableRow key={item.machine}>
                                        <TableCell className="font-medium">{item.machine}</TableCell>
                                        <TableCell className="text-right">{item["Tiempo Esperado"]}</TableCell>
                                        <TableCell className="text-right font-bold">{item["Tiempo Real"]}</TableCell>
                                        <TableCell className={cn("text-right", item["Desviación"] > 10 ? "text-destructive" : "text-green-600")}>
                                            {item["Desviación"] > 0 ? '+' : ''}{item["Desviación"]}
                                        </TableCell>
                                        <TableCell className="text-right text-muted-foreground">{item["Tiempo Muerto"]}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                </TabsContent>
            </div>
        </Tabs>
      </CardContent>
    </Card>
  );
}