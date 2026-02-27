'use client';

import { useState, useMemo, useCallback } from 'react';
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
  AreaChart,
  Area,
} from 'recharts';
import type { Incident } from '@/lib/db/schema';
import type { HydroEvent } from '@/lib/data/csv-loader';
import { StockIcon } from '@/components/ui/stock-icon';

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

const YEAR_PALETTE = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
const MONTH_LABELS_SHORT = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

// ─── Stats Section ──────────────────────────────────────────────────────────

interface StatsSectionProps {
  incidents: Incident[];
  csvEvents: HydroEvent[];
}

export function StatsSection({ incidents, csvEvents }: StatsSectionProps) {
  // Merge CSV events with DB incidents for richer data
  const allEvents = useMemo(
    () => [...csvEvents.map(csvToIncident), ...incidents],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [csvEvents.length, incidents.length],
  );

  // ─── Year & month range state ────────────────────────────────────────────
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    allEvents.forEach((ev) => {
      const ds = ev.fechaEvento || (ev.createdAt ? new Date(ev.createdAt).toISOString().split('T')[0] : null);
      if (ds) {
        const y = new Date(ds).getFullYear();
        if (!isNaN(y)) years.add(y);
      }
    });
    return [...years].sort();
  }, [allEvents]);

  const [selectedYears, setSelectedYears] = useState<number[]>([]);
  const [monthStart, setMonthStart] = useState(0);
  const [monthEnd, setMonthEnd] = useState(11);
  const activeYears = selectedYears.length > 0 ? selectedYears : availableYears;

  const toggleYear = useCallback((y: number) => {
    setSelectedYears((prev) => {
      const next = prev.includes(y) ? prev.filter((x) => x !== y) : [...prev, y];
      return next.length === 0 ? [] : next.sort();
    });
  }, []);

  // Filtered events for stats cards
  const filteredEvents = useMemo(() => {
    return allEvents.filter((ev) => {
      const ds = ev.fechaEvento || (ev.createdAt ? new Date(ev.createdAt).toISOString().split('T')[0] : null);
      if (!ds) return false;
      const d = new Date(ds);
      return activeYears.includes(d.getFullYear()) && d.getMonth() >= monthStart && d.getMonth() <= monthEnd;
    });
  }, [allEvents, activeYears, monthStart, monthEnd]);

  // Chart data per year × month
  const { incidentChartData, precipChartData } = useMemo(() => {
    const incByYM: Record<string, Record<number, number>> = {};
    const precipByYM: Record<string, Record<number, number>> = {};
    MONTH_LABELS_SHORT.forEach((m) => { incByYM[m] = {}; precipByYM[m] = {}; });

    allEvents.forEach((ev) => {
      const ds = ev.fechaEvento || (ev.createdAt ? new Date(ev.createdAt).toISOString().split('T')[0] : null);
      if (!ds) return;
      const d = new Date(ds);
      if (isNaN(d.getTime())) return;
      const y = d.getFullYear();
      if (!activeYears.includes(y)) return;
      const label = MONTH_LABELS_SHORT[d.getMonth()];
      incByYM[label][y] = (incByYM[label][y] || 0) + 1;
      precipByYM[label][y] = (precipByYM[label][y] || 0) + (ev.mmLluviaReportados || 0);
    });

    const months = MONTH_LABELS_SHORT.slice(monthStart, monthEnd + 1);
    return {
      incidentChartData: months.map((m) => ({
        month: m,
        ...Object.fromEntries(activeYears.map((y) => [y.toString(), incByYM[m]?.[y] || 0])),
      })),
      precipChartData: months.map((m) => ({
        month: m,
        ...Object.fromEntries(activeYears.map((y) => [y.toString(), Math.round(precipByYM[m]?.[y] || 0)])),
      })),
    };
  }, [allEvents, activeYears, monthStart, monthEnd]);

  const yearColor = useCallback(
    (y: number) => YEAR_PALETTE[availableYears.indexOf(y) % YEAR_PALETTE.length],
    [availableYears],
  );

  const now = new Date();
  const totalReports = allEvents.length;
  const highRisk = allEvents.filter((r) => r.gravedad === 'alto' || r.gravedad === 'critico').length;
  const riskPercentage = totalReports > 0 ? Math.round((highRisk / totalReports) * 100) : 0;

  // Compute month-over-month change
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

  // Insights
  const mostAffectedColonia = coloniaData[0]?.name || '--';

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
                <StockIcon name="pin" className="w-5 h-5" />
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
                <StockIcon name="clock" className="w-5 h-5" />
              </div>
              <div className="stat-value-enhanced mb-1">{filteredEvents.length}</div>
              <div className="text-sm text-slate-600">Periodo Seleccionado</div>
              <div className="stat-change neutral mt-2">
                <StockIcon name="clock" className="w-4 h-4" />
                <span>{activeYears.join(', ')}</span>
              </div>
            </div>
            <div className="stat-card-enhanced animate-fade-in" style={{ animationDelay: '0.6s' }}>
              <div className="hero-stat-icon bg-gradient-to-br from-red-500 to-pink-500">
                <StockIcon name="shield" className="w-5 h-5" />
              </div>
              <div className="stat-value-enhanced mb-1">{highRisk}</div>
              <div className="text-sm text-slate-600">Alto Riesgo</div>
              <div className="stat-change negative mt-2">
                <StockIcon name="shield" className="w-4 h-4" />
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
                <div className="p-2 bg-orange-100 rounded-lg">
                  <StockIcon name="shield" className="w-5 h-5" />
                </div>
                Nivel de Gravedad
              </h3>
              <div className="flex items-center gap-2">
                <button onClick={() => window.location.reload()} className="text-slate-500 hover:text-slate-700 p-2 rounded-lg hover:bg-slate-100 transition-colors" title="Actualizar datos">
                  <StockIcon name="refresh" className="w-4 h-4" />
                </button>
                <button onClick={() => downloadCSV(severityData as Record<string, unknown>[], 'gravedad')} className="text-slate-500 hover:text-slate-700 p-2 rounded-lg hover:bg-slate-100 transition-colors" title="Descargar CSV">
                  <StockIcon name="document" className="w-4 h-4" />
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
              Datos actualizados automáticamente
            </div>
          </div>

          {/* Colonia Bar Chart */}
          <div className="card p-8 transition-transform duration-300 hover:scale-[1.02] animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-xl text-slate-800 flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <StockIcon name="map" className="w-5 h-5" />
                </div>
                Distribución por Colonia
              </h3>
              <div className="flex items-center gap-2">
                <button onClick={() => window.location.reload()} className="text-slate-500 hover:text-slate-700 p-2 rounded-lg hover:bg-slate-100 transition-colors" title="Actualizar datos">
                  <StockIcon name="refresh" className="w-4 h-4" />
                </button>
                <button onClick={() => downloadCSV(coloniaData as Record<string, unknown>[], 'colonias')} className="text-slate-500 hover:text-slate-700 p-2 rounded-lg hover:bg-slate-100 transition-colors" title="Descargar CSV">
                  <StockIcon name="document" className="w-4 h-4" />
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
              Haz clic en las secciones para filtrar en el mapa
            </div>
          </div>

          {/* ── Shared Year & Month Filters ── */}
          <div className="card p-6 lg:col-span-2 animate-fade-in">
            <div className="flex flex-wrap items-center gap-4">
              {/* Year toggles */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-slate-600">Años:</span>
                {availableYears.map((y) => (
                  <button
                    key={y}
                    onClick={() => toggleYear(y)}
                    className={`px-3 py-1 rounded-full text-sm font-semibold border-2 transition-all ${
                      activeYears.includes(y)
                        ? 'text-white border-transparent shadow-sm'
                        : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'
                    }`}
                    style={
                      activeYears.includes(y)
                        ? { backgroundColor: yearColor(y), borderColor: yearColor(y) }
                        : undefined
                    }
                  >
                    {y}
                  </button>
                ))}
                {selectedYears.length > 0 && (
                  <button
                    onClick={() => setSelectedYears([])}
                    className="text-xs text-slate-400 hover:text-slate-600 underline ml-1"
                  >
                    Todos
                  </button>
                )}
              </div>

              {/* Month range */}
              <div className="flex items-center gap-2 ml-auto flex-wrap">
                <span className="text-sm font-medium text-slate-600">Meses:</span>
                <select
                  value={monthStart}
                  onChange={(e) => setMonthStart(Number(e.target.value))}
                  className="text-sm border border-slate-300 rounded-lg px-2 py-1 focus:border-emerald-500 focus:outline-none"
                >
                  {MONTH_LABELS_SHORT.map((m, i) => (
                    <option key={i} value={i}>{m}</option>
                  ))}
                </select>
                <span className="text-slate-400">–</span>
                <select
                  value={monthEnd}
                  onChange={(e) => setMonthEnd(Number(e.target.value))}
                  className="text-sm border border-slate-300 rounded-lg px-2 py-1 focus:border-emerald-500 focus:outline-none"
                >
                  {MONTH_LABELS_SHORT.map((m, i) => (
                    <option key={i} value={i}>{m}</option>
                  ))}
                </select>
                <div className="flex gap-1 ml-2">
                  <button
                    onClick={() => { setMonthStart(0); setMonthEnd(11); }}
                    className={`text-xs px-2 py-1 rounded transition-colors ${monthStart === 0 && monthEnd === 11 ? 'bg-emerald-100 text-emerald-700 font-semibold' : 'text-slate-500 hover:bg-slate-100'}`}
                  >
                    Todo
                  </button>
                  <button
                    onClick={() => { setMonthStart(5); setMonthEnd(9); }}
                    className={`text-xs px-2 py-1 rounded transition-colors ${monthStart === 5 && monthEnd === 9 ? 'bg-blue-100 text-blue-700 font-semibold' : 'text-slate-500 hover:bg-slate-100'}`}
                  >
                    Lluvias
                  </button>
                  <button
                    onClick={() => { setMonthStart(0); setMonthEnd(5); }}
                    className={`text-xs px-2 py-1 rounded transition-colors ${monthStart === 0 && monthEnd === 5 ? 'bg-amber-100 text-amber-700 font-semibold' : 'text-slate-500 hover:bg-slate-100'}`}
                  >
                    Ene–Jun
                  </button>
                  <button
                    onClick={() => { setMonthStart(6); setMonthEnd(11); }}
                    className={`text-xs px-2 py-1 rounded transition-colors ${monthStart === 6 && monthEnd === 11 ? 'bg-amber-100 text-amber-700 font-semibold' : 'text-slate-500 hover:bg-slate-100'}`}
                  >
                    Jul–Dic
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ── Incidents by Month (year comparison) ── */}
          <div className="card p-8 lg:col-span-2 transition-transform duration-300 hover:scale-[1.01] animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-xl text-slate-800 flex items-center gap-3">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <StockIcon name="chart" className="w-5 h-5" />
                </div>
                Incidentes por Mes
              </h3>
              <button
                onClick={() => downloadCSV(incidentChartData as Record<string, unknown>[], 'incidentes-mensual')}
                className="text-slate-500 hover:text-slate-700 p-2 rounded-lg hover:bg-slate-100 transition-colors"
                title="Descargar CSV"
              >
                <StockIcon name="document" className="w-4 h-4" />
              </button>
            </div>
            {incidentChartData.some((d) =>
              activeYears.some((y) => (d as unknown as Record<string, number>)[y.toString()] > 0),
            ) ? (
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={incidentChartData} margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  {activeYears.map((y) => (
                    <Bar
                      key={y}
                      dataKey={y.toString()}
                      name={y.toString()}
                      fill={yearColor(y)}
                      radius={[4, 4, 0, 0]}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState />
            )}
            <div className="mt-4 text-xs text-slate-500 text-center">
              Comparación de incidentes registrados por mes {activeYears.length > 1 ? `entre ${activeYears.join(', ')}` : activeYears[0] || ''}
            </div>
          </div>

          {/* ── Precipitation by Month (year comparison) ── */}
          <div className="card p-8 lg:col-span-2 transition-transform duration-300 hover:scale-[1.01] animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-xl text-slate-800 flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <StockIcon name="cloud" className="w-5 h-5" />
                </div>
                Precipitación Acumulada por Mes
              </h3>
              <button
                onClick={() => downloadCSV(precipChartData as Record<string, unknown>[], 'precipitacion-mensual')}
                className="text-slate-500 hover:text-slate-700 p-2 rounded-lg hover:bg-slate-100 transition-colors"
                title="Descargar CSV"
              >
                <StockIcon name="document" className="w-4 h-4" />
              </button>
            </div>
            {precipChartData.some((d) =>
              activeYears.some((y) => (d as unknown as Record<string, number>)[y.toString()] > 0),
            ) ? (
              <ResponsiveContainer width="100%" height={320}>
                <AreaChart data={precipChartData} margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                  <defs>
                    {activeYears.map((y) => (
                      <linearGradient key={y} id={`grad-${y}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={yearColor(y)} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={yearColor(y)} stopOpacity={0.02} />
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} unit=" mm" />
                  <Tooltip formatter={(val: number) => [`${val} mm`, '']} />
                  <Legend />
                  {activeYears.map((y) => (
                    <Area
                      key={y}
                      type="monotone"
                      dataKey={y.toString()}
                      name={`${y} (mm)`}
                      stroke={yearColor(y)}
                      fill={`url(#grad-${y})`}
                      strokeWidth={2.5}
                      dot={{ r: 3 }}
                    />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-slate-400">
                <p className="text-sm">Sin datos de precipitación para el periodo seleccionado</p>
              </div>
            )}
            <div className="mt-4 text-xs text-slate-500 text-center">
              mm de lluvia reportados — compara temporadas entre años
            </div>
          </div>

          {/* Insights Card */}
          <div className="card p-8 lg:col-span-2 bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200 animate-fade-in">
            <h3 className="font-bold text-xl text-slate-800 mb-6 flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <StockIcon name="lab" className="w-5 h-5" />
              </div>
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

function csvToIncident(ev: HydroEvent): Incident {
  return {
    id: ev.id_evento || ev.id || `csv-${Math.random()}`,
    fechaEvento: ev.fecha_evento || ev.fecha || new Date().toISOString().split('T')[0],
    fechaPublicacion: null,
    titulo: ev.titulo || '',
    medio: ev.medio || null,
    autora: null,
    urlNoticia: ev.url_noticia || `https://csv-event-${Math.random()}`,
    direccionDetectada: ev.direccion_detectada || ev.direccion || null,
    colonia: ev.colonia || null,
    urlMaps: null,
    lat: Number(ev.lat) || 29.07,
    lon: Number(ev.lon) || -110.96,
    mmLluviaReportados: ev.mm_lluvia_reportados || ev.mm_lluvia || null,
    afectacionesReportadas: ev.afectaciones_reportadas || ev.descripcion || null,
    gravedad: ev.gravedad || 'medio',
    notas: null,
    conaguaStationId: null,
    status: 'atendido',
    createdAt: ev.fecha_evento ? new Date(ev.fecha_evento) : new Date(),
  };
}

function EmptyState() {
  return (
    <div className="flex items-center justify-center h-64 text-slate-400">
      <p className="text-sm">Sin datos disponibles</p>
    </div>
  );
}
