export function exportToCSV(data: any[], filename: string) {
    if (!data || !data.length) {
        console.warn("No data to export");
        return;
    }

    // 1. Get headers from the first object
    const headers = Object.keys(data[0]);

    // 2. Convert data to CSV format
    const csvContent = [
        headers.join(','), // Header row
        ...data.map(row =>
            headers.map(header => {
                const value = row[header];
                // Handle strings with commas or quotes
                if (typeof value === 'string') {
                    return `"${value.replace(/"/g, '""')}"`;
                }
                // Format dates
                if (value instanceof Date) {
                    return value.toISOString();
                }
                return value;
            }).join(',')
        )
    ].join('\n');

    // 3. Create a Blob and trigger download
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
