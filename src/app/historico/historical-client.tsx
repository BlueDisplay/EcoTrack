'use client';

import {
  AnnualRainfallChart,
  MonthlyAverageChart,
} from '@/components/charts/historical-charts';
import type { HistoricalRainRecord, RainfallDataSource } from '@/lib/data/csv-loader';
import type { HistoricalStats } from '@/lib/data/historical-stats';
import { AnimatedCounter } from '@/components/ui/animated-counter';
import { StockIcon, type StockIconName } from '@/components/ui/stock-icon';

interface HistoricalClientProps {
  data: HistoricalRainRecord[];
  stats: HistoricalStats;
  source: RainfallDataSource | null;
}

export function HistoricalClient({ data, stats, source }: HistoricalClientProps) {
  const sourceName = source === 'open_meteo'
    ? 'Open-Meteo Archive API'
    : 'CONAGUA (Estación 26139)';

  return (
    <div className="space-y-8">
      <div className="text-center text-xs text-gray-500">
        Fuente activa: {sourceName}
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Promedio Anual"
          value={stats.averageAnnualRainfall}
          suffix=" mm"
          icon="cloud"
        />
        <StatCard
          label="Año Más Lluvioso"
          value={stats.maxAnnualRainfall.year}
          subtitle={`${stats.maxAnnualRainfall.amount.toFixed(1)} mm`}
          icon="chart"
        />
        <StatCard
          label="Año Más Seco"
          value={stats.minAnnualRainfall.year}
          subtitle={`${stats.minAnnualRainfall.amount.toFixed(1)} mm`}
          icon="clock"
        />
        <StatCard
          label="Total Registros"
          value={data.length}
          icon="document"
        />
      </div>

      {/* Annual chart */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">
          Precipitación Anual
        </h2>
        <div className="h-80">
          <AnnualRainfallChart
            data={stats.yearlyTotals}
          />
        </div>
      </div>

      {/* Monthly averages */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">
          Promedios Mensuales
        </h2>
        <div className="h-72">
          <MonthlyAverageChart data={stats.monthlyAverages} />
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  suffix,
  subtitle,
  icon,
}: {
  label: string;
  value: number;
  suffix?: string;
  subtitle?: string;
  icon: StockIconName;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-center">
      <div className="text-2xl mb-1 flex justify-center">
        <StockIcon name={icon} className="w-6 h-6" />
      </div>
      <div className="text-lg font-bold text-gray-800">
        <AnimatedCounter value={value} duration={800} />
        {suffix}
      </div>
      <div className="text-xs text-gray-500 mt-0.5">{label}</div>
      {subtitle && (
        <div className="text-xs text-emerald-600 font-medium mt-1">
          {subtitle}
        </div>
      )}
    </div>
  );
}
