import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { memo } from "react";
import { AlertTriangle, Clock, Settings } from "lucide-react";
import { MetricCard } from "@/components/ui/metric_card";
import { motion } from "framer-motion";
interface MachineKPIsProps {
    selectedMachine: string;
    setSelectedMachine: (value: string) => void;
    availableMachinesForBatch: string[];
    currentGap: number;
    currentIdle: number;
}
export const MachineKPIs = memo(function MachineKPIs({
    selectedMachine,
    setSelectedMachine,
    availableMachinesForBatch,
    currentGap,
    currentIdle,
}: MachineKPIsProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <MetricCard
                title="Mayor Gap Detectado"
                value={`${currentGap} min`}
                subtitle="Tiempo perdido entre pasos"
                icon={AlertTriangle}
                className="border-l-4 border-l-chart-delay"
                delay={0.1}
                trend="down"
                trendValue={currentGap > 5 ? "Crítico" : "Normal"}
            />
            {}
            <MetricCard
                title="Tiempo Muerto Total"
                value={`${currentIdle} min`}
                subtitle="Acumulado en el proceso"
                icon={Clock}
                className="border-l-4 border-l-blue-500"
                delay={0.2}
                trend="neutral"
            />
        </div>
    );
});
