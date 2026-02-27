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
} from 'recharts';
import type { Incident } from '@/lib/db/schema';
import type { HydroEvent } from '@/lib/data/csv-loader';
import { StockIcon } from '@/components/ui/stock-icon';

// ─── Palette & labels ───────────────────────────────────────────────────────

const SEVERITY_COLORS: Record<string, string> = {
  critico: '#dc2626',
  alto: '#ef4444',
  medio: '#f59e0b',
  bajo: '#22c55e',
};

const SEVERITY_ORDER = ['critico', 'alto', 'medio', 'bajo'] as const;

const SEVERITY_LABELS: Record<string, string> = {
  critico: 'Crítico',
  alto: 'Alto',
  medio: 'Medio',
  bajo: 'Bajo',
};

const YEAR_PALETTE = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
const MONTH_LABELS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

// ─── Component ──────────────────────────────────────────────────────────────

interface StatsSectionProps {
  incidents: Incident[];
  csvEvents: HydroEvent[];
}

export function StatsSection({ incidents, csvEvents }: StatsSectionProps) {
  const allEvents = useMemo(
    () => [...csvEvents.map(csvToIncident), ...incidents],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [csvEvents.length, incidents.length],
  );

  // ── Year & month state ────────────────────────────────────────────────────
  const availableYears = useMemo(() => {
    const s = new Set<number>();
    allEvents.forEach((ev) => { const d = dateOf(ev); if (d) s.add(d.getFullYear()); });
    return [...s].sort();
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

  // ── Filtered events ───────────────────────────────────────────────────────
  const filtered = useMemo(() => allEvents.filter((ev) => {
    const d = dateOf(ev);
    if (!d) return false;
    return activeYears.includes(d.getFullYear()) && d.getMonth() >= monthStart && d.getMonth() <= monthEnd;
  }), [allEvents, activeYears, monthStart, monthEnd]);

  // ── KPI metrics ───────────────────────────────────────────────────────────
  const totalFiltered = filtered.length;
  const highRisk = filtered.filter((r) => r.gravedad === 'alto' || r.gravedad === 'critico').length;
  const pctHigh = totalFiltered > 0 ? Math.round((highRisk / totalFiltered) * 100) : 0;
  const uniqueColonias = useMemo(() => new Set(filtered.map((r) => r.colonia).filter(Boolean)).size, [filtered]);
  const avgPrecip = useMemo(() => {
    const vals = filtered.filter((r) => r.mmLluviaReportados && r.mmLluviaReportados > 0);
    if (vals.length === 0) return 0;
    return Math.round(vals.reduce((s, r) => s + (r.mmLluviaReportados ?? 0), 0) / vals.length);
  }, [filtered]);

  // ── Severity donut (filtered) ─────────────────────────────────────────────
  const severityData = useMemo(() => {
    const map: Record<string, number> = {};
    filtered.forEach((r) => { const k = r.gravedad || 'bajo'; map[k] = (map[k] || 0) + 1; });
    return SEVERITY_ORDER.filter((k) => map[k]).map((k) => ({ name: SEVERITY_LABELS[k], value: map[k], key: k }));
  }, [filtered]);

  // ── Colonia bar (filtered, top 8) ─────────────────────────────────────────
  const coloniaData = useMemo(() => {
    const map: Record<string, number> = {};
    filtered.forEach((r) => { const k = r.colonia || 'Sin colonia'; map[k] = (map[k] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 8);
  }, [filtered]);

  // ── Year×Month charts ─────────────────────────────────────────────────────
  const incidentChartData = useMemo(() => {
    const incM: Record<string, Record<number, number>> = {};
    MONTH_LABELS.forEach((m) => { incM[m] = {}; });

    allEvents.forEach((ev) => {
      const d = dateOf(ev);
      if (!d) return;
      const y = d.getFullYear();
      if (!activeYears.includes(y)) return;
      const mi = d.getMonth();
      if (mi < monthStart || mi > monthEnd) return;
      const label = MONTH_LABELS[mi];
      incM[label][y] = (incM[label][y] || 0) + 1;
    });

    const months = MONTH_LABELS.slice(monthStart, monthEnd + 1);
    return months.map<Record<string, string | number>>((m) => ({
      month: m,
      ...Object.fromEntries(activeYears.map((y) => [y.toString(), incM[m]?.[y] || 0])),
    }));
  }, [allEvents, activeYears, monthStart, monthEnd]);

  const yearColor = useCallback((y: number) => YEAR_PALETTE[availableYears.indexOf(y) % YEAR_PALETTE.length], [availableYears]);

  const hasInc = incidentChartData.some((d) => activeYears.some((y) => Number(d[y.toString()] ?? 0) > 0));

  // ── CSV download ──────────────────────────────────────────────────────────
  const downloadCSV = (data: Record<string, unknown>[], filename: string) => {
    if (!data.length) return;
    const h = Object.keys(data[0]);
    const csv = [h.join(','), ...data.map((r) => h.map((k) => r[k] ?? '').join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    Object.assign(document.createElement('a'), { href: url, download: `${filename}-${new Date().toISOString().slice(0, 10)}.csv` }).click();
    URL.revokeObjectURL(url);
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <section id="estadisticas" className="py-24 bg-gradient-to-br from-slate-50 via-white to-emerald-50">
      <div className="container mx-auto px-6 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-12 reveal">
          <h2 className="section-title">Estadísticas en Tiempo Real</h2>
          <p className="section-subtitle">Análisis de patrones y distribución de incidentes hidrometeorológicos en Hermosillo.</p>
        </div>

        {/* ── Filter Bar ────────────────────────────────────────────── */}
        <div className="card p-5 mb-8 animate-fade-in">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium text-slate-600">Años:</span>
              {availableYears.map((y) => (
                <button key={y} onClick={() => toggleYear(y)} className={`px-3 py-1 rounded-full text-sm font-semibold border-2 transition-all ${activeYears.includes(y) ? 'text-white border-transparent shadow-sm' : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'}`} style={activeYears.includes(y) ? { backgroundColor: yearColor(y), borderColor: yearColor(y) } : undefined}>
                  {y}
                </button>
              ))}
              {selectedYears.length > 0 && <button onClick={() => setSelectedYears([])} className="text-xs text-slate-400 hover:text-slate-600 underline ml-1">Todos</button>}
            </div>
            <div className="flex items-center gap-2 ml-auto flex-wrap">
              <span className="text-sm font-medium text-slate-600">Meses:</span>
              <select value={monthStart} onChange={(e) => setMonthStart(Number(e.target.value))} className="text-sm border border-slate-300 rounded-lg px-2 py-1 focus:border-emerald-500 focus:outline-none">
                {MONTH_LABELS.map((m, i) => <option key={i} value={i}>{m}</option>)}
              </select>
              <span className="text-slate-400">–</span>
              <select value={monthEnd} onChange={(e) => setMonthEnd(Number(e.target.value))} className="text-sm border border-slate-300 rounded-lg px-2 py-1 focus:border-emerald-500 focus:outline-none">
                {MONTH_LABELS.map((m, i) => <option key={i} value={i}>{m}</option>)}
              </select>
              <div className="flex gap-1 ml-2">
                <QuickBtn active={monthStart === 0 && monthEnd === 11} onClick={() => { setMonthStart(0); setMonthEnd(11); }}>Todo</QuickBtn>
                <QuickBtn active={monthStart === 5 && monthEnd === 9} onClick={() => { setMonthStart(5); setMonthEnd(9); }}>Lluvias</QuickBtn>
                <QuickBtn active={monthStart === 0 && monthEnd === 5} onClick={() => { setMonthStart(0); setMonthEnd(5); }}>Ene–Jun</QuickBtn>
                <QuickBtn active={monthStart === 6 && monthEnd === 11} onClick={() => { setMonthStart(6); setMonthEnd(11); }}>Jul–Dic</QuickBtn>
              </div>
            </div>
          </div>
        </div>

        {/* ── KPI Cards ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 reveal">
          <KpiCard icon="pin" label="Incidentes" value={totalFiltered} color="text-emerald-600" bg="bg-emerald-100" />
          <KpiCard icon="shield" label="Alto Riesgo" value={`${pctHigh}%`} sub={`${highRisk} de ${totalFiltered}`} color="text-red-600" bg="bg-red-100" />
          <KpiCard icon="map" label="Colonias" value={uniqueColonias} color="text-blue-600" bg="bg-blue-100" />
          <KpiCard icon="cloud" label="Precip. Prom." value={`${avgPrecip} mm`} color="text-cyan-600" bg="bg-cyan-100" />
        </div>

        {/* ── Charts ────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Incidentes por Mes — full width */}
          <div className="card p-8 lg:col-span-2 animate-fade-in">
            <ChartHeader icon="chart" bg="bg-amber-100" title="Incidentes por Mes" onDl={() => downloadCSV(incidentChartData as Record<string, unknown>[], 'incidentes-mensual')} />
            {hasInc ? (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={incidentChartData} margin={{ top: 5, right: 20, left: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  {activeYears.map((y) => <Bar key={y} dataKey={y.toString()} name={y.toString()} fill={yearColor(y)} radius={[4, 4, 0, 0]} />)}
                </BarChart>
              </ResponsiveContainer>
            ) : <Empty />}
          </div>

          {/* Gravedad donut */}
          <div className="card p-8 animate-fade-in">
            <ChartHeader icon="shield" bg="bg-orange-100" title="Nivel de Gravedad" onDl={() => downloadCSV(severityData as Record<string, unknown>[], 'gravedad')} />
            {severityData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={severityData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={95} innerRadius={45} paddingAngle={3} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {severityData.map((e) => <Cell key={e.key} fill={SEVERITY_COLORS[e.key] || '#94a3b8'} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : <Empty />}
          </div>

          {/* Colonias horizontal bar */}
          <div className="card p-8 animate-fade-in">
            <ChartHeader icon="map" bg="bg-blue-100" title="Top Colonias Afectadas" onDl={() => downloadCSV(coloniaData as Record<string, unknown>[], 'colonias')} />
            {coloniaData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={coloniaData} layout="vertical" margin={{ left: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#06b6d4" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <Empty />}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function KpiCard({ icon, label, value, sub, color, bg }: { icon: 'pin' | 'shield' | 'map' | 'cloud'; label: string; value: string | number; sub?: string; color: string; bg: string }) {
  return (
    <div className="card p-5 text-center animate-fade-in">
      <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl mb-2 ${bg}`}>
        <StockIcon name={icon} className={`w-5 h-5 ${color}`} />
      </div>
      <div className="text-2xl font-bold text-slate-800">{value}</div>
      <div className="text-sm text-slate-500">{label}</div>
      {sub && <div className="text-xs text-slate-400 mt-1">{sub}</div>}
    </div>
  );
}

function ChartHeader({ icon, bg, title, onDl }: { icon: 'chart' | 'shield' | 'map' | 'cloud'; bg: string; title: string; onDl: () => void }) {
  return (
    <div className="flex items-center justify-between mb-5">
      <h3 className="font-bold text-lg text-slate-800 flex items-center gap-3">
        <div className={`p-2 ${bg} rounded-lg`}><StockIcon name={icon} className="w-5 h-5" /></div>
        {title}
      </h3>
      <button onClick={onDl} className="text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-slate-100 transition-colors" title="Descargar CSV">
        <StockIcon name="document" className="w-4 h-4" />
      </button>
    </div>
  );
}

function QuickBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={`text-xs px-2 py-1 rounded transition-colors ${active ? 'bg-emerald-100 text-emerald-700 font-semibold' : 'text-slate-500 hover:bg-slate-100'}`}>
      {children}
    </button>
  );
}

function Empty() {
  return <div className="flex items-center justify-center h-48 text-slate-400 text-sm">Sin datos para el periodo seleccionado</div>;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function dateOf(ev: Incident): Date | null {
  const ds = ev.fechaEvento || (ev.createdAt ? new Date(ev.createdAt).toISOString().split('T')[0] : null);
  if (!ds) return null;
  const d = new Date(ds);
  return isNaN(d.getTime()) ? null : d;
}

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
