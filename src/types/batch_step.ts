export interface BatchStep {
  stepName: string;
  stepNr: string;
  durationMin: number;
  time?: number;
  expectedDurationMin: number;
  startTime: string;
  endTime: string;
}
