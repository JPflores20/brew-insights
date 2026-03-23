import React from "react";
import { motion } from "framer-motion";
import { MachineKPIs } from "../machine_kpis";
import { SequenceChart } from "../sequence_chart";
import { MachineHistoryChart } from "../machine_history_chart";
import { TemperatureTrendChart } from "../temperature_trend_chart";

export interface MachineViewTabProps {
    fullData: any[];
    selectedMachine: string | null;
    setSelectedMachine: (val: string | null) => void;
    availableMachinesForBatch: string[];
    currentGap: number;
    currentIdle: number;
    selectedRecord: any;
    stepsData: any[];
    selectedBatchId: string | null;
    machineHistoryData: any[];
    selectedHistoryIndices: number[];
    setSelectedHistoryIndices: React.Dispatch<React.SetStateAction<number[]>>;
    trendBatch?: string;
    tempTrendData: any[];
    trendRecipe?: string;
    trendMachine?: string;
    selectedTempParam: string;
    uniqueRecipes?: string[];
    machinesWithTemps?: string[];
    availableTrendBatches?: string[];
    availableTempParams: string[];
    setTrendRecipe?: (val: string) => void;
    setTrendMachine?: (val: string) => void;
    setTrendBatch?: (val: string) => void;
    setSelectedTempParam: (val: string) => void;
    selectedTempIndices: number[];
    setSelectedTempIndices: React.Dispatch<React.SetStateAction<number[]>>;
}

export function MachineViewTab(props: MachineViewTabProps) {
    return (
        <div className="space-y-6">
            <MachineKPIs
                selectedMachine={props.selectedMachine}
                setSelectedMachine={props.setSelectedMachine}
                availableMachinesForBatch={props.availableMachinesForBatch}
                currentGap={props.currentGap}
                currentIdle={props.currentIdle}
            />
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                <motion.div
                    className="xl:col-span-12 space-y-6"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <SequenceChart
                        selectedRecord={props.selectedRecord}
                        stepsData={props.stepsData}
                        selectedBatchId={props.selectedBatchId}
                        selectedMachine={props.selectedMachine}
                    />
                </motion.div>
            </div>
            <motion.div
                className="space-y-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
            >
                <MachineHistoryChart
                    data={props.machineHistoryData}
                    fullData={props.fullData}
                    selectedHistoryIndices={props.selectedHistoryIndices}
                    setSelectedHistoryIndices={props.setSelectedHistoryIndices}
                    trendBatch={props.trendBatch}
                    selectedMachine={props.selectedMachine}
                />
                <TemperatureTrendChart
                    data={props.tempTrendData}
                    trendBatch={props.trendBatch}
                    trendRecipe={props.trendRecipe}
                    trendMachine={props.trendMachine}
                    selectedTempParam={props.selectedTempParam}
                    uniqueRecipes={props.uniqueRecipes}
                    machinesWithTemps={props.machinesWithTemps}
                    availableTrendBatches={props.availableTrendBatches}
                    availableTempParams={props.availableTempParams}
                    setTrendRecipe={props.setTrendRecipe}
                    setTrendMachine={props.setTrendMachine}
                    setTrendBatch={props.setTrendBatch}
                    setSelectedTempParam={props.setSelectedTempParam}
                    selectedTempIndices={props.selectedTempIndices}
                    setSelectedTempIndices={props.setSelectedTempIndices}
                    title="Tendencias de Temperatura"
                    hideParamSelector={true} 
                />
            </motion.div>
        </div>
    );
}
