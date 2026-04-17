
export interface CapabilityStats {
  n: number;
  mean: number;
  min: number;
  max: number;
  stdDev: number;
  cp: number;
  cpk: number;
  lei: number;
  les: number;
  target: number;
}

export function calculateCapabilityStats(values: number[], lei: number, les: number): CapabilityStats | null {
  const n = values.length;
  if (n < 2) return null;

  const mean = values.reduce((a, b) => a + b, 0) / n;
  const min = Math.min(...values);
  const max = Math.max(...values);
  
  const sumSqDiff = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0);
  const variance = sumSqDiff / (n - 1);
  const stdDev = Math.sqrt(variance);

  // Target is usually the middle of spec limits
  const target = (lei + les) / 2;

  // Cp = (LES - LEI) / (6 * deviation)
  const cp = stdDev !== 0 ? (les - lei) / (6 * stdDev) : 0;

  // Cpk = MIN((LES - media) / (3 * deviation), (media - LEI) / (3 * deviation))
  const cpkUpper = stdDev !== 0 ? (les - mean) / (3 * stdDev) : 0;
  const cpkLower = stdDev !== 0 ? (mean - lei) / (3 * stdDev) : 0;
  const cpk = Math.min(cpkUpper, cpkLower);

  return { n, mean, min, max, stdDev, cp, cpk, lei, les, target };
}

export function generateGaussianPoints(stats: CapabilityStats, pointsCount: number = 100) {
  const { mean, stdDev, lei, les } = stats;
  if (stdDev === 0) return [];
  
  const points = [];
  const sigmaCount = 4;
  
  const dataStart = mean - sigmaCount * stdDev;
  const dataEnd = mean + sigmaCount * stdDev;
  
  const start = Math.min(dataStart, lei - stdDev);
  const end = Math.max(dataEnd, les + stdDev);
  
  const step = (end - start) / pointsCount;

  for (let x = start; x <= end; x += step) {
    const y = (1 / (stdDev * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * Math.pow((x - mean) / stdDev, 2));
    points.push({ 
      x: parseFloat(x.toFixed(3)), 
      y: parseFloat(y.toFixed(5)) 
    });
  }
  return points;
}
