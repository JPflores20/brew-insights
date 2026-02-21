export interface ProcessCapabilityResult {
  sampleSize: number;
  processMean: number;
  standardDeviation: number;
  lowerSpecificationLimit: number;
  upperSpecificationLimit: number;
  processCapabilityRatio: number | null;
  processCapabilityIndex: number | null;
}
