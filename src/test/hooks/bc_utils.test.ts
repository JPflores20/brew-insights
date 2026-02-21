import { describe, it, expect } from 'vitest';
import { isTemperatureParam, computeOptions, calculateTrendData } from '@/hooks/use_batch_comparison/bc_utils';
import { BatchRecord } from '@/types';
import { FILTER_ALL } from '@/lib/constants';
const mockData = [
  {
    CHARG_NR: '1001',
    productName: 'Cerveza Clara',
    TEILANL_GRUPO: 'Olla de Coccion',
    timestamp: '2023-10-01T10:00:00Z',
    real_total_min: 120,
    esperado_total_min: 100,
    delta_total_min: 20,
    alerts: [],
    steps: [
      { stepName: 'Calentamiento', durationMin: 60, expectedDurationMin: 50, stepNr: '1', startTime: '', endTime: '', status: '' }
    ],
    materials: [],
    parameters: [
      { name: 'Temp Mosto', value: 95, unit: '°C', target: 92, stepName: 'Calentamiento' },
      { name: 'pH', value: 5.2, unit: '', target: 5.1, stepName: 'Reposo' },
    ]
  },
  {
    CHARG_NR: '1002',
    productName: 'Cerveza Oscura',
    TEILANL_GRUPO: 'Olla de Coccion',
    timestamp: '2023-10-01T14:00:00Z',
    real_total_min: 110,
    esperado_total_min: 110,
    delta_total_min: 0,
    alerts: [],
    steps: [],
    materials: [],
    parameters: [
      { name: 'Temp Mosto', value: 98, unit: '°C', target: 92, stepName: 'Calentamiento' },
    ]
  },
  {
    CHARG_NR: '2001',
    productName: 'Cerveza Clara',
    TEILANL_GRUPO: 'Fermentador',
    timestamp: '2023-10-02T08:00:00Z',
    real_total_min: 500,
    esperado_total_min: 450,
    delta_total_min: 50,
    alerts: [],
    steps: [],
    materials: [],
    parameters: [
      { name: 'Presion', value: 1.2, unit: 'bar', target: 1.1, stepName: 'Fermentacion' },
    ]
  }
] as unknown as BatchRecord[];
describe('bc_utils.ts Pure Logic Tests', () => {
  describe('isTemperatureParam', () => {
    it('detects temperature by unit in celsius', () => {
      expect(isTemperatureParam('CualquierCosa', '°C')).toBe(true);
      expect(isTemperatureParam('CualquierCosa', '°c')).toBe(true);
    });
    it('detects temperature by explicit name', () => {
      expect(isTemperatureParam('Temp Fermentador', 'grados')).toBe(true);
      expect(isTemperatureParam('Temperature 1', '')).toBe(true);
      expect(isTemperatureParam('T Empe', 'bar')).toBe(false); 
    });
    it('rejects non temperature parameters', () => {
      expect(isTemperatureParam('pH', '')).toBe(false);
      expect(isTemperatureParam('Presion', 'bar')).toBe(false);
      expect(isTemperatureParam('Volumen', 'hl')).toBe(false);
    });
  });
  describe('computeOptions (Filters mapping)', () => {
    it('groups properties ignoring empty/invalid entries without filters', () => {
      const { availableRecipes, availableMachines, availableBatches } = computeOptions(mockData, FILTER_ALL, FILTER_ALL);
      expect(availableRecipes).toEqual(['Cerveza Clara', 'Cerveza Oscura']);
      expect(availableMachines).toEqual(['Olla de Coccion']); 
      expect(availableBatches).toEqual(['1001', '1002']);
    });
    it('narrows batches and machines when a recipe is strictly selected', () => {
      const { availableMachines, availableBatches } = computeOptions(mockData, 'Cerveza Oscura', FILTER_ALL);
      expect(availableMachines).toEqual(['Olla de Coccion']);
      expect(availableBatches).toEqual(['1002']);
    });
    it('narrows recipes when machine is strictly selected', () => {
      const { availableRecipes } = computeOptions(mockData, FILTER_ALL, 'Fermentador');
      expect(availableRecipes).toEqual(['Cerveza Clara']);
    });
  });
  describe('calculateTrendData (Orchestration mapping)', () => {
    it('maps batch trend accurately for a specific targeted batch', () => {
      const result = calculateTrendData(mockData, 'Olla de Coccion', FILTER_ALL, '1001', 'Temp Mosto');
      expect(result).toHaveLength(1);
      expect(result[0].value).toBe(95);
      expect(result[0].stepName).toBe('Calentamiento');
    });
    it('resolves historical trend when batch is set to FILTER_ALL', () => {
      const result = calculateTrendData(mockData, 'Olla de Coccion', FILTER_ALL, FILTER_ALL, 'Temp Mosto');
      expect(result).toHaveLength(2);
      expect((result as any)[0].batchId).toBe('1001');
      expect(result[0].value).toBe(95);
      expect((result as any)[1].batchId).toBe('1002');
      expect(result[1].value).toBe(98);
    });
    it('filters historical trend combining machine AND recipe strictness', () => {
      const result = calculateTrendData(mockData, 'Olla de Coccion', 'Cerveza Clara', FILTER_ALL, 'Temp Mosto');
      expect(result).toHaveLength(1);
      expect((result as any)[0].batchId).toBe('1001');
    });
    it('ignores null records silently based on missing target parameters', () => {
      const result = calculateTrendData(mockData, 'Fermentador', FILTER_ALL, FILTER_ALL, 'Fantasma');
      expect(result).toHaveLength(0);
    });
  });
});
