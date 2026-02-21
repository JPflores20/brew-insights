import { BatchRecord } from "@/types";

export interface AlertData {
  machine: string;
  stepName: string;
  slope: number;
  recentAvg: number;
  percentIncrease: number; // vs initial avg
}

export function calculateDegradationAlerts(data: BatchRecord[]): AlertData[] {
  // Sort data chronologically to analyze trends over time
  const sortedData = [...data].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  // Map to store durations per Machine -> Step
  const historyMap = new Map<string, number[]>();

  sortedData.forEach((batch) => {
    const machine = batch.TEILANL_GRUPO || "Desconocida";
    
    batch.steps.forEach((step) => {
      const key = `${machine}:::${step.stepName}`;
      
      if (!historyMap.has(key)) {
        historyMap.set(key, []);
      }
      
      historyMap.get(key)!.push(step.durationMin);
    });
  });

  const activeAlerts: AlertData[] = [];

  historyMap.forEach((durations, key) => {
    // Need at least 5 points to determine a trend
    if (durations.length < 5) return;

    // Simple linear regression to find slope
    const dataPointsCount = durations.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;

    for (let i = 0; i < dataPointsCount; i++) {
      sumX += i;
      sumY += durations[i];
      sumXY += i * durations[i];
      sumXX += i * i;
    }

    const slope =
      (dataPointsCount * sumXY - sumX * sumY) / 
      (dataPointsCount * sumXX - sumX * sumX);

    // If slope is strongly positive, there is a degradation trend (increasing time)
    // Compare the first third vs last third of the data for a percentage increase.
    const firstThirdEnd = Math.max(1, Math.floor(dataPointsCount / 3));
    const lastThirdStart = dataPointsCount - firstThirdEnd;

    const firstAverage =
      durations.slice(0, firstThirdEnd).reduce((a, b) => a + b, 0) /
      firstThirdEnd;
      
    const lastAverage =
      durations.slice(lastThirdStart).reduce((a, b) => a + b, 0) /
      firstThirdEnd;

    const percentIncrease = firstAverage > 0 
      ? ((lastAverage - firstAverage) / firstAverage) * 100 
      : 0;

    // Flag if duration increased by more than 5% and slope is positive
    if (percentIncrease > 5 && slope > 0) {
      const [machine, stepName] = key.split(":::");
      
      activeAlerts.push({
        machine,
        stepName,
        slope,
        recentAvg: lastAverage,
        percentIncrease: percentIncrease,
      });
    }
  });

  // Sort alerts by highest percent increase
  return activeAlerts
    .sort((a, b) => b.percentIncrease - a.percentIncrease)
    .slice(0, 6); // Max 6 alerts
}

// ==========================================
// EFFICIENCY CHART LOGIC
// ==========================================

export const PROCESS_ORDER = [
  "molienda",
  "grits",
  "cocedor",
  "macerador",
  "filtro",
  "olla",
  "whirlpool",
  "trub",
  "enfriador",
  "ve",
  "tanque",
  "linea"
];

export function getSortIndex(name: string): number {
  const lowerName = name.toLowerCase();
  const index = PROCESS_ORDER.findIndex(key => lowerName.includes(key));
  return index === -1 ? 999 : index;
}

export interface EfficiencyDataPoint {
  machine: string;
  displayMachine: string;
  "Tiempo Esperado": number;
  "Tiempo Real": number;
  "Desviación": number;
  "Tiempo Muerto": number;
}

export function calculateEfficiencyData(
  averagesData: { machine: string; avgExpected: number; avgReal: number; avgDelta: number; avgIdle: number; }[]
): EfficiencyDataPoint[] {
  return averagesData
    .sort((a, b) => getSortIndex(a.machine) - getSortIndex(b.machine))
    .map((item) => ({
      machine: item.machine,
      displayMachine: item.machine.replace(/(\d)/, '\n$1'),
      "Tiempo Esperado": item.avgExpected,
      "Tiempo Real": item.avgReal,
      "Desviación": item.avgDelta,
      "Tiempo Muerto": item.avgIdle
    }));
}

// ==========================================
// QUALITY CONTROL CHART LOGIC (I-CHART)
// ==========================================

export function extractProductParams(data: BatchRecord[]) {
  const productsSet = new Set<string>();
  const productParamsMap = new Map<string, Set<string>>();

  data.forEach((batch) => {
    const prod = batch.productName || "Desconocido";
    productsSet.add(prod);
    
    if (!productParamsMap.has(prod)) {
      productParamsMap.set(prod, new Set());
    }
    
    const currentParams = productParamsMap.get(prod)!;
    batch.parameters.forEach((p) => {
      currentParams.add(`${p.name} ::: ${p.stepName}`);
    });
  });

  const processedMap = new Map<string, string[]>();
  productParamsMap.forEach((params, prod) => {
    processedMap.set(prod, Array.from(params).sort());
  });

  return {
    products: Array.from(productsSet).sort(),
    productParamsMap: processedMap
  };
}

export interface ControlChartResult {
  items: any[];
  stats: {
    mean: number;
    sigma: number;
    UCL: number;
    LCL: number;
    count: number;
  } | null;
  outOfControlCount: number;
}

export function calculateControlChartData(
  data: BatchRecord[],
  selectedProduct: string,
  selectedParam: string
): ControlChartResult {
  if (!selectedProduct || !selectedParam) {
    return { items: [], stats: null, outOfControlCount: 0 };
  }

  const [paramName, paramStep] = selectedParam.split(" ::: ");
  
  const sortedData = [...data].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  const rawItems: any[] = [];
  const values: number[] = [];

  sortedData.forEach((batch) => {
    if (batch.productName !== selectedProduct) return;
    
    const param = batch.parameters.find(
      (p) => p.name === paramName && p.stepName === paramStep
    );
    
    if (param && typeof param.value === 'number') {
      rawItems.push({
        batchId: batch.CHARG_NR,
        value: param.value,
        target: param.target || null,
        unit: param.unit || "",
      });
      values.push(param.value);
    }
  });

  if (values.length === 0) {
    return { items: [], stats: null, outOfControlCount: 0 };
  }

  // Calculate Mean and Sigma
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / values.length;
  const sigma = Math.sqrt(variance);

  // Six Sigma Limits (± 3 std dev)
  const UCL = mean + 3 * sigma;
  const LCL = mean - 3 * sigma;

  let outOfControlCount = 0;

  const items = rawItems.map((item) => {
    const isAnomaly = item.value > UCL || item.value < LCL;
    if (isAnomaly) outOfControlCount++;
    
    return {
      ...item,
      "Valor Real": parseFloat(item.value.toFixed(2)),
      "Media": parseFloat(mean.toFixed(2)),
      "LCS (+3σ)": parseFloat(UCL.toFixed(2)),
      "LCI (-3σ)": parseFloat(LCL.toFixed(2)),
      isAnomaly
    };
  });

  return { 
    items, 
    stats: { mean, sigma, UCL, LCL, count: values.length },
    outOfControlCount
  };
}
