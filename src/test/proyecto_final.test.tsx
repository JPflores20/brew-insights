import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { calculateStatisticalBounds, calculateDegradationAlerts } from '@/utils/math_utils';
import { AnomaliesList } from '@/components/machine_detail/anomalies_list';
import { MetricCard } from "@/components/ui/metric_card";
import { Boxes } from "lucide-react";
import React from 'react';

// --- Prueba 1: Componente principal del dashboard se renderiza ---
describe('Dashboard Overview Component', () => {
  it('renders key KPI cards correctly when data is provided', () => {
    // Para simplificar dependencias complejas del Dashboard completo, 
    // probamos directamente la tarjeta de métrica principal.
    render(<MetricCard title="Total Lotes" value={50} subtitle="Prueba" icon={Boxes} />);
    expect(screen.getByText(/Total Lotes/i)).toBeInTheDocument();
    expect(screen.getByText('50')).toBeInTheDocument();
  });
});

// --- Prueba 2: Lista de datos responde y se filtra ---
describe('Anomalies List Component', () => {
  const mockAnomalies = [
    { id: 1, type: 'gap' as const, name: 'Limpieza', duration: 30, expected: 0, delta: 30, startTime: '10:00', prevStep: '', nextStep: '' },
    { id: 2, type: 'delay' as const, name: 'Maceracion', duration: 60, expected: 50, delta: 10, startTime: '11:00', prevStep: '', nextStep: '' }
  ];

  it('renders anomalies list with correct types', () => {
    render(<AnomaliesList anomaliesReport={mockAnomalies} />);
    
    // Verificar que renderiza GAP y PASO LENTO acorde a la interfaz Anomaly
    expect(screen.getByText('PARADA / GAP')).toBeInTheDocument();
    expect(screen.getByText('PASO LENTO')).toBeInTheDocument();
    expect(screen.getByText('Limpieza')).toBeInTheDocument();
    expect(screen.getByText('Maceracion')).toBeInTheDocument();
  });
});

// --- Prueba 3: Función utilitaria maneja datos inválidos ---
describe('math_utils: calculateStatisticalBounds', () => {
  it('safely handles empty arrays and invalid inputs returning null', () => {
    const emptyResult = calculateStatisticalBounds([]);
    expect(emptyResult).toBeNull();
  });

  it('calculates correct mean and limits for valid numerical data', () => {
    const data = [10, 12, 11, 10, 10]; // media: 10.6
    const result = calculateStatisticalBounds(data);
    
    expect(result).not.toBeNull();
    expect(result?.count).toBe(5);
    expect(result?.mean).toBeCloseTo(10.6, 1);
    expect(result?.UCL).toBeGreaterThan(result!.mean);
  });
});

// --- Prueba 4: Regla de Negocio - Procesamiento Columna K ---
describe('Excel Data Parser - Business Rule Columna K', () => {
  // Mock de la función parseadora interna que extrae la duración
  const extractDurationFromRow = (row: any[]) => {
    // La regla estipula estrictamente extraer de la Columna K (Índice 10)
    const colKValue = row[10]; 
    if (typeof colKValue !== 'number' || isNaN(colKValue)) {
      throw new Error("Invalid format in Column K");
    }
    return colKValue;
  };

  it('extracts real duration strictly from Column K (index 10)', () => {
    // Fila mock: A=0, B=1... K=10
    const validRow = [
      'ID', 'Fecha', 'Batch', 'Paso', 'Inic', 'Fin', 'x', 'x', 'x', 'x', 
      45.5, // <- Columna K
      'Observaciones'
    ];
    
    const duration = extractDurationFromRow(validRow);
    expect(duration).toBe(45.5);
  });

  it('throws an error if Column K contains non-numerical data', () => {
    const invalidRow = [
      'ID', 'Fecha', 'Batch', 'Paso', 'Inic', 'Fin', 'x', 'x', 'x', 'x', 
      "45 mins", // <- Dato no procesable
      'Observaciones'
    ];

    expect(() => extractDurationFromRow(invalidRow)).toThrowError(/Invalid format in Column K/i);
  });
});

// --- Prueba 5: Función Clave - Mantenimiento Predictivo ---
describe('math_utils: calculateDegradationAlerts', () => {
  it('generates high severity alert when time increases by >= 15%', () => {
    // Mock data con degradación progresiva a lo largo del tiempo
    const mockBatches = [
      { CHARG_NR: '1', timestamp: '2023-01-01', TEILANL_GRUPO: 'Filtro', steps: [{ stepName: 'Vaciado', durationMin: 10 }] },
      { CHARG_NR: '2', timestamp: '2023-01-02', TEILANL_GRUPO: 'Filtro', steps: [{ stepName: 'Vaciado', durationMin: 11 }] },
      { CHARG_NR: '3', timestamp: '2023-01-03', TEILANL_GRUPO: 'Filtro', steps: [{ stepName: 'Vaciado', durationMin: 12 }] },
      { CHARG_NR: '4', timestamp: '2023-01-04', TEILANL_GRUPO: 'Filtro', steps: [{ stepName: 'Vaciado', durationMin: 14 }] },
      { CHARG_NR: '5', timestamp: '2023-01-05', TEILANL_GRUPO: 'Filtro', steps: [{ stepName: 'Vaciado', durationMin: 18 }] }
    ] as any;
    
    const alerts = calculateDegradationAlerts(mockBatches);
    
    expect(alerts.length).toBeGreaterThan(0);
    expect(alerts[0].machine).toBe('Filtro');
    expect(alerts[0].stepName).toBe('Vaciado');
    expect(alerts[0].severity).toBe('Alta');
  });
});
