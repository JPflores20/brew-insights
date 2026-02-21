import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MetricCard } from '@/components/ui/metric_card';
describe('MetricCard Component', () => {
    it('renders title and value correctly', () => {
        render(<MetricCard title="Total Time" value="120 min" />);
        expect(screen.getByText('Total Time')).toBeInTheDocument();
        expect(screen.getByText('120 min')).toBeInTheDocument();
    });
    it('renders subtitle if provided', () => {
        render(<MetricCard title="Test" value="10" subtitle="Sub test" />);
        expect(screen.getByText('Sub test')).toBeInTheDocument();
    });
    it('applies trend colors correctly based on up/down props', () => {
        const { rerender } = render(<MetricCard title="Trend Up" value="50" trend="up" trendValue="Crítico" />);
        expect(screen.getByText('Crítico')).toHaveClass('text-red-500');
        rerender(<MetricCard title="Trend Down" value="50" trend="down" trendValue="Mejora" />);
        expect(screen.getByText('Mejora')).toHaveClass('text-green-500');
        rerender(<MetricCard title="Trend Neutral" value="50" trend="neutral" trendValue="Estable" />);
        expect(screen.getByText('Estable')).toHaveClass('text-muted-foreground');
    });
    it('renders without crashing when optional props are omitted', () => {
        const { container } = render(<MetricCard title="Minimal" value={0} />);
        expect(container).toBeInTheDocument();
        expect(screen.queryByText('Crítico')).not.toBeInTheDocument();
    });
});
