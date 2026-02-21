import { describe, it, expect } from 'vitest';
import { 
  calculateDegradationAlerts, 
  getSortIndex, 
  calculateEfficiencyData, 
  extractProductParams, 
  calculateControlChartData 
} from '../../utils/math_utils';
import { BatchRecord } from '@/types';

const mockBatches = [
  {
    CHARG_NR: '100',
    productName: 'Producto A',
    TEILANL_GRUPO: 'macerador',
    timestamp: '2023-01-01T10:00:00Z',
    steps: [{ stepName: 'Step1', durationMin: 10, expectedDurationMin: 10 }],
    parameters: [
      { name: 'Temp', value: 50, stepName: 'Step1' }
    ]
  },
  {
    CHARG_NR: '101',
    productName: 'Producto A',
    TEILANL_GRUPO: 'macerador',
    timestamp: '2023-01-02T10:00:00Z',
    steps: [{ stepName: 'Step1', durationMin: 12, expectedDurationMin: 10 }],
    parameters: [
      { name: 'Temp', value: 52, stepName: 'Step1' }
    ]
  },
  {
    CHARG_NR: '102',
    productName: 'Producto A',
    TEILANL_GRUPO: 'macerador',
    timestamp: '2023-01-03T10:00:00Z',
    steps: [{ stepName: 'Step1', durationMin: 15, expectedDurationMin: 10 }],
    parameters: [
      { name: 'Temp', value: 55, stepName: 'Step1' }
    ]
  },
  {
    CHARG_NR: '103',
    productName: 'Producto A',
    TEILANL_GRUPO: 'macerador',
    timestamp: '2023-01-04T10:00:00Z',
    steps: [{ stepName: 'Step1', durationMin: 18, expectedDurationMin: 10 }],
    parameters: [
      { name: 'Temp', value: 54, stepName: 'Step1' }
    ]
  },
  {
    CHARG_NR: '104',
    productName: 'Producto A',
    TEILANL_GRUPO: 'macerador',
    timestamp: '2023-01-05T10:00:00Z',
    steps: [{ stepName: 'Step1', durationMin: 22, expectedDurationMin: 10 }],
    parameters: [
      { name: 'Temp', value: 60, stepName: 'Step1' }
    ]
  }
] as unknown as BatchRecord[];

describe('math_utils.ts Pure Logic Tests', () => {
  describe('calculateDegradationAlerts', () => {
    it('calculates degradation accurately when 5 or more points exhibit positive slope', () => {
      const alerts = calculateDegradationAlerts(mockBatches);
      expect(alerts).toHaveLength(1);
      expect(alerts[0].machine).toBe('macerador');
      expect(alerts[0].stepName).toBe('Step1');
      expect(alerts[0].slope).toBeGreaterThan(0);
      expect(alerts[0].percentIncrease).toBeGreaterThan(5);
    });

    it('returns empty array if not enough datapoints (under 5)', () => {
      const alerts = calculateDegradationAlerts(mockBatches.slice(0, 4));
      expect(alerts).toHaveLength(0);
    });
  });

  describe('getSortIndex', () => {
    it('returns correct index for known process', () => {
      expect(getSortIndex('macerador vip')).toBe(3);
      expect(getSortIndex('olla coccion')).toBe(5);
    });

    it('returns 999 for unknown process', () => {
      expect(getSortIndex('extraterrestre')).toBe(999);
    });
  });

  describe('calculateEfficiencyData', () => {
    it('sorts and maps items correctly', () => {
      const input = [
        { machine: 'olla', avgExpected: 100, avgReal: 110, avgDelta: 10, avgIdle: 5 },
        { machine: 'molienda', avgExpected: 50, avgReal: 50, avgDelta: 0, avgIdle: 0 }
      ];
      const result = calculateEfficiencyData(input);
      expect(result).toHaveLength(2);
      expect(result[0].machine).toBe('molienda');
      expect(result[1].machine).toBe('olla');
      expect(result[0]['Tiempo Esperado']).toBe(50);
    });
  });

  describe('extractProductParams', () => {
    it('extracts unique products and mapped parameter steps', () => {
      const { products, productParamsMap } = extractProductParams(mockBatches);
      expect(products).toEqual(['Producto A']);
      expect(productParamsMap.get('Producto A')).toEqual(['Temp ::: Step1']);
    });
  });

  describe('calculateControlChartData', () => {
    it('returns empty stats if missing product or param', () => {
      const result = calculateControlChartData(mockBatches, '', '');
      expect(result.items).toHaveLength(0);
      expect(result.stats).toBeNull();
    });

    it('calculates mean, sigma, and bounds accurately', () => {
      const result = calculateControlChartData(mockBatches, 'Producto A', 'Temp ::: Step1');
      expect(result.stats).not.toBeNull();
      expect(result.stats?.count).toBe(5);
      
      const mean = (50 + 52 + 55 + 54 + 60) / 5;
      expect(result.stats?.mean).toBeCloseTo(mean, 2);
      expect(result.items).toHaveLength(5);
      expect(result.items[0]['Media']).toBeCloseTo(mean, 2);
    });
  });
});
