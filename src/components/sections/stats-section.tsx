'use client';

import { useState } from 'react';
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
  LineChart,
  Line,
} from 'recharts';
import type { Report } from '@/lib/db/schema';
import type { HydroEvent } from '@/lib/data/csv-loader';

// ─── Colors ─────────────────────────────────────────────────────────────────

const SEVERITY_COLORS: Record<string, string> = {
  critico: '#dc2626',
  alto: '#ef4444',
  medio: '#f59e0b',
  bajo: '#22c55e',
};

const SEVERITY_LABELS: Record<string, string> = {
  critico: 'Crítico',
  alto: 'Alto',
  medio: 'Medio',
  bajo: 'Bajo',
};

// ─── Stats Section ──────────────────────────────────────────────────────────

interface StatsSectionProps {
  reports: Report[];
  csvEvents: HydroEvent[];
}

export function StatsSection({ reports, csvEvents }: StatsSectionProps) {
  const [timePeriod, setTimePeriod] = useState('30');

  // Merge CSV events with DB reports for richer data
  const allEvents = [...csvEvents.map(csvToReport), ...reports];

  // Filter events based on timePeriod for temporal chart
  const now = new Date();
  const daysBack = parseInt(timePeriod, 10);
  const cutoff = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);
  const filteredEvents = allEvents.filter((r) => {
    const dateStr = r.fechaEvento || (r.createdAt ? new Date(r.createdAt).toISOString().split('T')[0] : null);
    if (!dateStr) return false;
    return new Date(dateStr) >= cutoff;
  });

  const totalReports = allEvents.length;
  const highRisk = allEvents.filter((r) => r.gravedad === 'alto' || r.gravedad === 'critico').length;
  const riskPercentage = totalReports > 0 ? Math.round((highRisk / totalReports) * 100) : 0;

  // Compute month-over-month change for the reports card
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const thisMonthCount = allEvents.filter((r) => {
    const d = r.fechaEvento ? new Date(r.fechaEvento) : r.createdAt ? new Date(r.createdAt) : null;
    return d && d >= thisMonth;
  }).length;
  const lastMonthCount = allEvents.filter((r) => {
    const d = r.fechaEvento ? new Date(r.fechaEvento) : r.createdAt ? new Date(r.createdAt) : null;
    return d && d >= lastMonth && d < thisMonth;
  }).length;
  const growthPct = lastMonthCount > 0 ? Math.round(((thisMonthCount - lastMonthCount) / lastMonthCount) * 100) : 0;
  const growthSign = growthPct >= 0 ? '+' : '';
  const growthClass = growthPct > 0 ? 'positive' : growthPct < 0 ? 'negative' : 'neutral';

  // Severity data
  const severityData = Object.entries(
    allEvents.reduce((acc, r) => {
      const key = r.gravedad || 'bajo';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
  ).map(([name, value]) => ({ name: SEVERITY_LABELS[name] || name, value, key: name }));

  // Colonia data
  const coloniaData = Object.entries(
    allEvents.reduce((acc, r) => {
      const key = r.colonia || 'Sin colonia';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
  )
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  // Temporal data (by month) — uses filtered events based on time period
  const temporalData = getTemporalData(filteredEvents);

  // Insights
  const mostAffectedColonia = coloniaData[0]?.name || '--';

  // Current month name
  const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const currentMonth = `${monthNames[new Date().getMonth()]} ${new Date().getFullYear()}`;

  // Download chart data as CSV
  const downloadCSV = (data: Record<string, unknown>[], filename: string) => {
    if (data.length === 0) return;
    const headers = Object.keys(data[0]);
    const rows = data.map((row) => headers.map((h) => row[h] ?? '').join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section id="estadisticas" className="py-24 bg-gradient-to-br from-slate-50 via-white to-emerald-50">
      <div className="container mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-16 slide-up">
          <h2 className="section-title">Estadísticas en Tiempo Real</h2>
          <p className="section-subtitle">
            Análisis profundo de los patrones y distribución de reportes hidrometeorológicos en Hermosillo,
            basado en datos colaborativos de la comunidad.
          </p>

          {/* Top Stats - stat-card-enhanced */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mt-12">
            <div className="stat-card-enhanced animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <div className="hero-stat-icon bg-gradient-to-br from-green-500 to-emerald-600">
                📍
              </div>
              <div className="stat-value-enhanced mb-1">{totalReports}</div>
              <div className="text-sm text-slate-600">Total de Reportes</div>
              <div className={`stat-change ${growthClass} mt-2`}>
                <span>{growthPct >= 0 ? '↑' : '↓'}</span>
                <span>{growthSign}{growthPct}%</span>
                <span className="text-xs opacity-75">vs mes anterior</span>
              </div>
            </div>
            <div className="stat-card-enhanced animate-fade-in" style={{ animationDelay: '0.4s' }}>
              <div className="hero-stat-icon bg-gradient-to-br from-orange-500 to-red-500">
                📅
              </div>
              <div className="stat-value-enhanced mb-1">{filteredEvents.length}</div>
              <div className="text-sm text-slate-600">Periodo Seleccionado</div>
              <div className="stat-change neutral mt-2">
                <span>📅</span>
                <span>{currentMonth}</span>
              </div>
            </div>
            <div className="stat-card-enhanced animate-fade-in" style={{ animationDelay: '0.6s' }}>
              <div className="hero-stat-icon bg-gradient-to-br from-red-500 to-pink-500">
                ⚠️
              </div>
              <div className="stat-value-enhanced mb-1">{highRisk}</div>
              <div className="text-sm text-slate-600">Alto Riesgo</div>
              <div className="stat-change negative mt-2">
                <span>🛡️</span>
                <span>{riskPercentage}%</span>
                <span className="text-xs opacity-75">del total</span>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
          {/* Severity Pie Chart */}
          <div className="card p-8 transition-transform duration-300 hover:scale-[1.02] animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-xl text-slate-800 flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">⚠️</div>
                Nivel de Gravedad
              </h3>
              <div className="flex items-center gap-2">
                <button onClick={() => window.location.reload()} className="text-slate-500 hover:text-slate-700 p-2 rounded-lg hover:bg-slate-100 transition-colors" title="Actualizar datos">
                  🔄
                </button>
                <button onClick={() => downloadCSV(severityData as Record<string, unknown>[], 'gravedad')} className="text-slate-500 hover:text-slate-700 p-2 rounded-lg hover:bg-slate-100 transition-colors" title="Descargar CSV">
                  ⬇️
                </button>
              </div>
            </div>
            {severityData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={severityData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    innerRadius={40}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {severityData.map((entry) => (
                      <Cell key={entry.key} fill={SEVERITY_COLORS[entry.key] || '#94a3b8'} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState />
            )}
            <div className="mt-4 text-xs text-slate-600 text-center">
              ℹ️ Datos actualizados automáticamente
            </div>
          </div>

          {/* Colonia Bar Chart */}
          <div className="card p-8 transition-transform duration-300 hover:scale-[1.02] animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-xl text-slate-800 flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">📍</div>
                Distribución por Colonia
              </h3>
              <div className="flex items-center gap-2">
                <button onClick={() => window.location.reload()} className="text-slate-500 hover:text-slate-700 p-2 rounded-lg hover:bg-slate-100 transition-colors" title="Actualizar datos">
                  🔄
                </button>
                <button onClick={() => downloadCSV(coloniaData as Record<string, unknown>[], 'colonias')} className="text-slate-500 hover:text-slate-700 p-2 rounded-lg hover:bg-slate-100 transition-colors" title="Descargar CSV">
                  ⬇️
                </button>
              </div>
            </div>
            {coloniaData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={coloniaData} layout="vertical" margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#06b6d4" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState />
            )}
            <div className="mt-4 text-xs text-slate-600 text-center">
              🗺️ Haz clic en las secciones para filtrar en el mapa
            </div>
          </div>

          {/* Temporal Line Chart - Full Width */}
          <div className="card p-8 lg:col-span-2 transition-transform duration-300 hover:scale-[1.01] animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-xl text-slate-800 flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">📈</div>
                Tendencias Temporales
              </h3>
              <div className="flex items-center gap-2">
                <select
                  value={timePeriod}
                  onChange={(e) => setTimePeriod(e.target.value)}
                  className="text-sm border border-slate-300 rounded-lg px-3 py-1 focus:border-emerald-500 focus:outline-none"
                >
                  <option value="7">Últimos 7 días</option>
                  <option value="30">Últimos 30 días</option>
                  <option value="90">Últimos 3 meses</option>
                  <option value="365">Último año</option>
                </select>
                <button onClick={() => window.location.reload()} className="text-slate-500 hover:text-slate-700 p-2 rounded-lg hover:bg-slate-100 transition-colors" title="Actualizar datos">
                  🔄
                </button>
              </div>
            </div>
            {temporalData.length > 0 ? (
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={temporalData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="reportes"
                    name="Reportes"
                    stroke="#10b981"
                    strokeWidth={3}
                    dot={{ r: 5, fill: '#10b981' }}
                    activeDot={{ r: 7 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="mmLluvia"
                    name="Precipitación (mm)"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ r: 4, fill: '#3b82f6' }}
                    strokeDasharray="5 5"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState />
            )}
            <div className="mt-4 flex justify-between items-center text-xs text-slate-600">
              <span>📅 Reportes por fecha de evento</span>
              <span>📈 Promedio móvil de 7 días</span>
            </div>
          </div>

          {/* Insights Card */}
          <div className="card p-8 lg:col-span-2 bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200 animate-fade-in">
            <h3 className="font-bold text-xl text-slate-800 mb-6 flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg">💡</div>
              Análisis Inteligente
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-white rounded-xl border border-emerald-200 shadow-sm">
                <div className="text-2xl font-bold text-emerald-600 mb-2">{totalReports}</div>
                <div className="text-sm text-slate-600">Eventos registrados</div>
              </div>
              <div className="text-center p-4 bg-white rounded-xl border border-emerald-200 shadow-sm">
                <div className="text-2xl font-bold text-emerald-600 mb-2">{mostAffectedColonia}</div>
                <div className="text-sm text-slate-600">Colonia más afectada</div>
              </div>
              <div className="text-center p-4 bg-white rounded-xl border border-emerald-200 shadow-sm">
                <div className="text-2xl font-bold text-emerald-600 mb-2">{highRisk > 3 ? 'Alerta' : 'Estable'}</div>
                <div className="text-sm text-slate-600">Tendencia general</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function csvToReport(ev: HydroEvent): Report {
  return {
    id: ev.id_evento || ev.id || `csv-${Math.random()}`,
    fechaEvento: ev.fecha_evento || ev.fecha || null,
    titulo: ev.titulo || '',
    direccion: ev.direccion_detectada || ev.direccion || null,
    colonia: ev.colonia || null,
    gravedad: ev.gravedad || 'medio',
    descripcion: ev.afectaciones_reportadas || ev.descripcion || null,
    mmLluvia: ev.mm_lluvia_reportados || ev.mm_lluvia || null,
    tipoEvento: ev.tipo_evento || 'inundacion',
    medio: ev.medio || null,
    imagen: null,
    urlNoticia: ev.url_noticia || null,
    tipoReporte: 'historico',
    detectadoAi: false,
    aiConfidence: null,
    status: 'atendido',
    lat: Number(ev.lat) || 29.07,
    lon: Number(ev.lon) || -110.96,
    createdAt: ev.fecha_evento ? new Date(ev.fecha_evento) : new Date(),
  };
}

function getTemporalData(events: Report[]) {
  const byMonth: Record<string, { reportes: number; mmLluvia: number }> = {};

  events.forEach((ev) => {
    const dateStr = ev.fechaEvento || (ev.createdAt ? new Date(ev.createdAt).toISOString().split('T')[0] : null);
    if (!dateStr) return;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (!byMonth[key]) byMonth[key] = { reportes: 0, mmLluvia: 0 };
    byMonth[key].reportes++;
    byMonth[key].mmLluvia += ev.mmLluvia || 0;
  });

  const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

  return Object.entries(byMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, val]) => {
      const [, month] = key.split('-');
      return {
        label: monthNames[parseInt(month) - 1] || key,
        reportes: val.reportes,
        mmLluvia: Math.round(val.mmLluvia),
      };
    });
}

function EmptyState() {
  return (
    <div className="flex items-center justify-center h-64 text-slate-400">
      <p className="text-sm">Sin datos disponibles</p>
    </div>
  );
}
