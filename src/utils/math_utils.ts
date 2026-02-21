import { BatchRecord } from "@/types";

export interface AlertData {
  machine: string;
  stepName: string;
  slope: number;
  recentAvg: number;
  percentIncrease: number;
}

const UNKNOWN_MACHINE = "Desconocida";
const UNKNOWN_PRODUCT = "Desconocido";
const KEY_DELIMITER = ":::";

const sortChronologically = (data: BatchRecord[]) =>
  [...data].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

const buildMachineStepHistoryMap = (data: BatchRecord[]) => {
  const historyMap = new Map<string, number[]>();
  data.forEach((batch) => {
    const machine = batch.TEILANL_GRUPO || UNKNOWN_MACHINE;
    batch.steps.forEach((step) => {
      const key = `${machine}${KEY_DELIMITER}${step.stepName}`;
      if (!historyMap.has(key)) historyMap.set(key, []);
      historyMap.get(key)!.push(step.durationMin);
    });
  });
  return historyMap;
};

const calculateLinearRegressionSlope = (durations: number[]) => {
  const count = durations.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
  for (let i = 0; i < count; i++) {
    sumX += i;
    sumY += durations[i];
    sumXY += i * durations[i];
    sumXX += i * i;
  }
  return (count * sumXY - sumX * sumY) / Math.max(1, count * sumXX - sumX * sumX);
};

const calculatePeriodAverages = (durations: number[]) => {
  const count = durations.length;
  const firstThirdEnd = Math.max(1, Math.floor(count / 3));
  const lastThirdStart = count - firstThirdEnd;
  
  const sumFirst = durations.slice(0, firstThirdEnd).reduce((a, b) => a + b, 0);
  const firstAverage = sumFirst / firstThirdEnd;
  
  const sumLast = durations.slice(lastThirdStart).reduce((a, b) => a + b, 0);
  const lastAverage = sumLast / firstThirdEnd;
  
  const percentIncrease = firstAverage > 0 ? ((lastAverage - firstAverage) / firstAverage) * 100 : 0;
  
  return { lastAverage, percentIncrease };
};

export function calculateDegradationAlerts(data: BatchRecord[]): AlertData[] {
  const sortedData = sortChronologically(data);
  const historyMap = buildMachineStepHistoryMap(sortedData);
  const activeAlerts: AlertData[] = [];

  historyMap.forEach((durations, key) => {
    if (durations.length < 5) return;
    
    const slope = calculateLinearRegressionSlope(durations);
    const { lastAverage, percentIncrease } = calculatePeriodAverages(durations);

    if (percentIncrease > 5 && slope > 0) {
      const [machine, stepName] = key.split(KEY_DELIMITER);
      activeAlerts.push({ machine, stepName, slope, recentAvg: lastAverage, percentIncrease });
    }
  });

  return activeAlerts.sort((a, b) => b.percentIncrease - a.percentIncrease).slice(0, 6);
}

export const PROCESS_ORDER = [
  "molienda", "grits", "cocedor", "macerador", "filtro", 
  "olla", "whirlpool", "trub", "enfriador", "ve", "tanque", "linea"
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

const buildProductParamsSets = (data: BatchRecord[]) => {
  const productsSet = new Set<string>();
  const productParamsMap = new Map<string, Set<string>>();

  data.forEach((batch) => {
    const prod = batch.productName || UNKNOWN_PRODUCT;
    productsSet.add(prod);
    
    if (!productParamsMap.has(prod)) {
      productParamsMap.set(prod, new Set());
    }
    
    const currentParams = productParamsMap.get(prod)!;
    batch.parameters.forEach((p) => {
      currentParams.add(`${p.name} ${KEY_DELIMITER} ${p.stepName}`);
    });
  });

  return { productsSet, productParamsMap };
};

export function extractProductParams(data: BatchRecord[]) {
  const { productsSet, productParamsMap } = buildProductParamsSets(data);
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
  stats: { mean: number; sigma: number; UCL: number; LCL: number; count: number; } | null;
  outOfControlCount: number;
}

const extractParamValues = (sortedData: BatchRecord[], selectedProduct: string, paramName: string, paramStep: string) => {
  const rawItems: any[] = [];
  const values: number[] = [];

  sortedData.forEach((batch) => {
    if (batch.productName !== selectedProduct) return;
    
    const param = batch.parameters.find(p => p.name === paramName && p.stepName === paramStep);
    
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

  return { rawItems, values };
};

const calculateStatisticalBounds = (values: number[]) => {
  const count = values.length;
  if (count === 0) return null;

  const mean = values.reduce((a, b) => a + b, 0) / count;
  const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / count;
  const sigma = Math.sqrt(variance);
  
  return { mean, sigma, UCL: mean + 3 * sigma, LCL: mean - 3 * sigma, count };
};

const mapControlChartItems = (rawItems: any[], bounds: { mean: number; UCL: number; LCL: number }) => {
  let outOfControlCount = 0;
  
  const items = rawItems.map((item) => {
    const isAnomaly = item.value > bounds.UCL || item.value < bounds.LCL;
    if (isAnomaly) outOfControlCount++;
    
    return {
      ...item,
      "Valor Real": parseFloat(item.value.toFixed(2)),
      "Media": parseFloat(bounds.mean.toFixed(2)),
      "LCS (+3σ)": parseFloat(bounds.UCL.toFixed(2)),
      "LCI (-3σ)": parseFloat(bounds.LCL.toFixed(2)),
      isAnomaly
    };
  });

  return { items, outOfControlCount };
};

export function calculateControlChartData(
  data: BatchRecord[],
  selectedProduct: string,
  selectedParam: string
): ControlChartResult {
  if (!selectedProduct || !selectedParam) {
    return { items: [], stats: null, outOfControlCount: 0 };
  }

  const [paramName, paramStep] = selectedParam.split(` ${KEY_DELIMITER} `);
  const sortedData = sortChronologically(data);
  const { rawItems, values } = extractParamValues(sortedData, selectedProduct, paramName, paramStep);
  
  const stats = calculateStatisticalBounds(values);
  if (!stats) {
    return { items: [], stats: null, outOfControlCount: 0 };
  }

  const { items, outOfControlCount } = mapControlChartItems(rawItems, stats);

  return { items, stats, outOfControlCount };
}
