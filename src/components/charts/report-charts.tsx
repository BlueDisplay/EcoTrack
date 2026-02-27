'use client';

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import type { Incident } from '@/lib/db/schema';

// ─── Colors ─────────────────────────────────────────────────────────────────

const SEVERITY_COLORS: Record<string, string> = {
  critico: '#dc2626',
  alto: '#ef4444',
  medio: '#f59e0b',
  bajo: '#22c55e',
};

const STATUS_COLORS: Record<string, string> = {
  enviado: '#9ca3af',
  revision: '#fbbf24',
  atendido: '#22c55e',
};

// ─── Severity Pie Chart ─────────────────────────────────────────────────────

export function SeverityChart({ reports }: { reports: Incident[] }) {
  const data = Object.entries(
    reports.reduce(
      (acc, r) => {
        const key = r.gravedad || 'bajo';
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    ),
  ).map(([name, value]) => ({ name, value }));

  if (data.length === 0) {
    return <p className="text-center text-gray-400 text-sm py-8">Sin datos</p>;
  }

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">
        Distribución por Gravedad
      </h3>
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={80}
            label={({ name, percent }) =>
              `${name} (${(percent * 100).toFixed(0)}%)`
            }
          >
            {data.map((entry) => (
              <Cell
                key={entry.name}
                fill={SEVERITY_COLORS[entry.name] || '#94a3b8'}
              />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Status Pie Chart ───────────────────────────────────────────────────────

export function StatusChart({ reports }: { reports: Incident[] }) {
  const data = Object.entries(
    reports.reduce(
      (acc, r) => {
        const key = r.status || 'enviado';
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    ),
  ).map(([name, value]) => ({ name, value }));

  if (data.length === 0) {
    return <p className="text-center text-gray-400 text-sm py-8">Sin datos</p>;
  }

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">
        Estado de Reportes
      </h3>
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={80}
            label
          >
            {data.map((entry) => (
              <Cell
                key={entry.name}
                fill={STATUS_COLORS[entry.name] || '#94a3b8'}
              />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Colonia Bar Chart ──────────────────────────────────────────────────────

export function ColoniaChart({ reports }: { reports: Incident[] }) {
  const counts = reports.reduce(
    (acc, r) => {
      const key = r.colonia || 'Sin colonia';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const data = Object.entries(counts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10); // top 10

  if (data.length === 0) {
    return <p className="text-center text-gray-400 text-sm py-8">Sin datos</p>;
  }

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">
        Reportes por Colonia (Top 10)
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} layout="vertical" margin={{ left: 80 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" />
          <YAxis type="category" dataKey="name" width={75} tick={{ fontSize: 11 }} />
          <Tooltip />
          <Bar dataKey="value" fill="#06b6d4" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
