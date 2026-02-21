export function exportToCSV(data: any[], filename: string) {
    if (!data || !data.length) {
        console.warn("No data to export");
        return;
    }
    const headers = Object.keys(data[0]);
    const csvContent = [
        headers.join(','), 
        ...data.map(row =>
            headers.map(header => {
                const value = row[header];
                if (typeof value === 'string') {
                    return `"${value.replace(/"/g, '""')}"`;
                }
                if (value instanceof Date) {
                    return value.toISOString();
                }
                return value;
            }).join(',')
        )
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
