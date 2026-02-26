// ─── Historical data statistics ─────────────────────────────────────────────
// Pure functions — no side effects, sharable between server and client

import type { HistoricalRainRecord } from './csv-loader';

export interface HistoricalStats {
  totalYears: number;
  averageAnnualRainfall: number;
  maxAnnualRainfall: { year: number; amount: number };
  minAnnualRainfall: { year: number; amount: number };
  wettestMonth: { month: string; average: number };
  driestMonth: { month: string; average: number };
  yearlyTotals: { year: number; total: number }[];
  monthlyAverages: { month: string; average: number }[];
}

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

export function computeHistoricalStats(
  records: HistoricalRainRecord[],
): HistoricalStats {
  // Group by year
  const byYear = new Map<number, number>();
  const byMonth = new Map<string, number[]>();

  for (const row of records) {
    if (!row.año || row.precipitacion == null) continue;

    // Yearly accumulation
    byYear.set(row.año, (byYear.get(row.año) || 0) + row.precipitacion);

    // Monthly grouping
    const monthKey = row.mes?.toString().trim();
    if (monthKey) {
      const arr = byMonth.get(monthKey) || [];
      arr.push(row.precipitacion);
      byMonth.set(monthKey, arr);
    }
  }

  // Yearly totals sorted
  const yearlyTotals = Array.from(byYear.entries())
    .map(([year, total]) => ({ year, total: Math.round(total * 10) / 10 }))
    .sort((a, b) => a.year - b.year);

  // Monthly averages
  const monthlyAverages = MONTH_NAMES.map((month) => {
    const values = byMonth.get(month) || [];
    const avg = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
    return { month, average: Math.round(avg * 10) / 10 };
  });

  // Extremes
  const maxYear = yearlyTotals.reduce(
    (max, curr) => (curr.total > max.total ? curr : max),
    yearlyTotals[0] || { year: 0, total: 0 },
  );

  const minYear = yearlyTotals.reduce(
    (min, curr) => (curr.total < min.total ? curr : min),
    yearlyTotals[0] || { year: 0, total: 0 },
  );

  const wettestMonth = monthlyAverages.reduce(
    (max, curr) => (curr.average > max.average ? curr : max),
    monthlyAverages[0] || { month: '', average: 0 },
  );

  const driestMonth = monthlyAverages.reduce(
    (min, curr) => (curr.average < min.average ? curr : min),
    monthlyAverages[0] || { month: '', average: 0 },
  );

  const avgAnnual =
    yearlyTotals.length > 0
      ? yearlyTotals.reduce((sum, y) => sum + y.total, 0) / yearlyTotals.length
      : 0;

  return {
    totalYears: yearlyTotals.length,
    averageAnnualRainfall: Math.round(avgAnnual * 10) / 10,
    maxAnnualRainfall: { year: maxYear.year, amount: maxYear.total },
    minAnnualRainfall: { year: minYear.year, amount: minYear.total },
    wettestMonth: { month: wettestMonth.month, average: wettestMonth.average },
    driestMonth: { month: driestMonth.month, average: driestMonth.average },
    yearlyTotals,
    monthlyAverages,
  };
}
