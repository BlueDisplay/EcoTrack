'use client';

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { HistoricalStats } from '@/lib/data/historical-stats';

// ─── Annual Rainfall Bar Chart ──────────────────────────────────────────────

export function AnnualRainfallChart({ data }: { data: HistoricalStats['yearlyTotals'] }) {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">
        Precipitación Anual (mm) — Hermosillo
      </h3>
      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="year"
            tick={{ fontSize: 10 }}
            interval={4}
          />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip
            formatter={(value: number) => [`${value} mm`, 'Precipitación']}
          />
          <Bar dataKey="total" fill="#3b82f6" radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Monthly Average Line Chart ─────────────────────────────────────────────

export function MonthlyAverageChart({ data }: { data: HistoricalStats['monthlyAverages'] }) {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">
        Precipitación Promedio Mensual (mm)
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip
            formatter={(value: number) => [`${value} mm`, 'Promedio']}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="average"
            stroke="#06b6d4"
            strokeWidth={2}
            dot={{ r: 4 }}
            name="Promedio mensual"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Stats Summary Cards ────────────────────────────────────────────────────

export function HistoricalStatsCards({ stats }: { stats: HistoricalStats }) {
  const cards = [
    {
      label: 'Años de Datos',
      value: stats.totalYears,
      color: 'blue',
    },
    {
      label: 'Promedio Anual',
      value: `${stats.averageAnnualRainfall} mm`,
      color: 'cyan',
    },
    {
      label: 'Año más Lluvioso',
      value: `${stats.maxAnnualRainfall.year}`,
      sub: `${stats.maxAnnualRainfall.amount} mm`,
      color: 'emerald',
    },
    {
      label: 'Año más Seco',
      value: `${stats.minAnnualRainfall.year}`,
      sub: `${stats.minAnnualRainfall.amount} mm`,
      color: 'amber',
    },
    {
      label: 'Mes más Lluvioso',
      value: stats.wettestMonth.month,
      sub: `${stats.wettestMonth.average} mm prom.`,
      color: 'blue',
    },
    {
      label: 'Mes más Seco',
      value: stats.driestMonth.month,
      sub: `${stats.driestMonth.average} mm prom.`,
      color: 'orange',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {cards.map((card) => (
        <div
          key={card.label}
          className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center"
        >
          <p className="text-xs text-gray-500 mb-1">{card.label}</p>
          <p className="text-lg font-bold text-gray-800">{card.value}</p>
          {card.sub && (
            <p className="text-xs text-gray-400">{card.sub}</p>
          )}
        </div>
      ))}
    </div>
  );
}
