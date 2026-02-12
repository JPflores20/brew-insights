export const calculateMergedDuration = (intervals: { start: number; end: number }[]): number => {
    if (intervals.length === 0) return 0;
    intervals.sort((a, b) => a.start - b.start);

    const merged = [];
    let current = intervals[0];

    for (let i = 1; i < intervals.length; i++) {
        const next = intervals[i];
        if (next.start < current.end) {
            current.end = Math.max(current.end, next.end);
        } else {
            merged.push(current);
            current = next;
        }
    }
    merged.push(current);

    return merged.reduce((acc, interval) => acc + (interval.end - interval.start), 0) / 60000;
};
