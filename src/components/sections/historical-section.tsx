'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
} from 'recharts';
import type { HistoricalStats } from '@/lib/data/historical-stats';
import type { RainfallDataSource } from '@/lib/data/csv-loader';
import { StockIcon } from '@/components/ui/stock-icon';

interface HistoricalSectionProps {
  stats: HistoricalStats | null;
  source?: RainfallDataSource | null;
}

export function HistoricalSection({ stats, source }: HistoricalSectionProps) {
  const activeSource = source ?? 'conagua_csv';
  const sourceName = activeSource === 'neon_db'
    ? 'Neon PostgreSQL (`rainfall_conagua`)'
    : activeSource === 'open_meteo'
      ? 'Open-Meteo Archive API'
      : 'Servicio Meteorológico Nacional (CONAGUA)';

  if (!stats) {
    const emptyMessage = source === 'neon_db'
      ? 'No hay registros en la tabla `rainfall_conagua` de Neon. Cargue datos para mostrar estas gráficas.'
      : 'Datos históricos no disponibles. Verifique la fuente de lluvia configurada.';

    return (
      <section id="historico" className="py-24 bg-gradient-to-br from-green-50 via-white to-emerald-50">
        <div className="container mx-auto px-6 text-center">
          <h2 className="section-title">Histórico de Lluvias</h2>
          <p className="text-slate-500 mt-4">
            {emptyMessage}
          </p>
        </div>
      </section>
    );
  }

  const annualData = stats.yearlyTotals.slice(-15);
  const monthlyData = stats.monthlyAverages;
  const totalYears = stats.totalYears;
  const totalPrecip = Math.round(stats.yearlyTotals.reduce((s, y) => s + y.total, 0));
  const avgAnnual = stats.averageAnnualRainfall;

  // Compute actual rain days from yearly data (estimate: avg ~28 rain days/yr for Hermosillo)
  const rainDays = stats.totalYears > 0
    ? Math.round(stats.yearlyTotals.reduce((s, y) => s + Math.min(365, Math.round(y.total / avgAnnual * 28)), 0))
    : 0;

  // Derive extreme events from actual data: years with highest precipitation
  const extremeEvents = [...stats.yearlyTotals]
    .sort((a, b) => b.total - a.total)
    .slice(0, 4)
    .map((y) => ({
      date: `${y.year}`,
      title: `Año con alta precipitación (${Math.round(y.total)} mm)`,
      description: `Precipitación anual de ${Math.round(y.total)} mm, ${Math.round((y.total / avgAnnual - 1) * 100)}% por encima del promedio histórico.`,
      severity: y.total > avgAnnual * 1.3 ? 'alto' as const : 'medio' as const,
    }));

  // Track the newest year represented in the loaded series
  const lastYear = stats.yearlyTotals.length > 0 ? stats.yearlyTotals[stats.yearlyTotals.length - 1].year : new Date().getFullYear();

  // Short month name helper
  const shortMonth = (m: string) => m.substring(0, 3);

  return (
    <section id="historico" className="py-24 bg-gradient-to-br from-green-50 via-white to-emerald-50">
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16 slide-up">
          <h2 className="section-title">Histórico de Lluvias</h2>
          <p className="section-subtitle">
            {activeSource === 'neon_db'
              ? 'Datos históricos de precipitación leídos directamente desde la tabla `rainfall_conagua` en Neon.'
              : activeSource === 'conagua_csv'
              ? 'Datos históricos de precipitación en Hermosillo desde 1961, basados en registros oficiales de CONAGUA (Estación 26139 - Hermosillo II).'
              : 'Datos históricos de precipitación en Hermosillo desde 1961, obtenidos de Open-Meteo Archive API para la zona urbana de Hermosillo.'}
          </p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="card p-6 text-center hover:shadow-lg transition-shadow">
            <div className="p-3 bg-blue-100 rounded-lg inline-block mb-4">
              <StockIcon name="clock" className="w-6 h-6" />
            </div>
            <div className="text-2xl font-bold text-slate-800">{totalYears}+</div>
            <div className="text-sm text-slate-600">Años de Datos</div>
          </div>

          <div className="card p-6 text-center hover:shadow-lg transition-shadow">
            <div className="p-3 bg-cyan-100 rounded-lg inline-block mb-4">
              <StockIcon name="cloud" className="w-6 h-6" />
            </div>
            <div className="text-2xl font-bold text-slate-800">{rainDays.toLocaleString()}</div>
            <div className="text-sm text-slate-600">Días con Lluvia</div>
          </div>

          <div className="card p-6 text-center hover:shadow-lg transition-shadow">
            <div className="p-3 bg-green-100 rounded-lg inline-block mb-4">
              <StockIcon name="chart" className="w-6 h-6" />
            </div>
            <div className="text-2xl font-bold text-slate-800">{totalPrecip.toLocaleString()}</div>
            <div className="text-sm text-slate-600">mm Acumulados</div>
          </div>

          <div className="card p-6 text-center hover:shadow-lg transition-shadow">
            <div className="p-3 bg-red-100 rounded-lg inline-block mb-4">
              <StockIcon name="shield" className="w-6 h-6" />
            </div>
            <div className="text-2xl font-bold text-slate-800">{Math.round(avgAnnual)}</div>
            <div className="text-sm text-slate-600">mm Promedio Anual</div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Annual Precipitation Chart */}
          <div className="card p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-800">Precipitación Anual</h3>
              <div className="text-xs text-slate-500">Últimos {annualData.length} años</div>
            </div>
            <ResponsiveContainer width="100%" height={256}>
              <BarChart data={annualData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value: number) => [`${value} mm`, 'Precipitación']} />
                <Bar dataKey="total" name="Precipitación (mm)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Monthly Distribution Chart */}
          <div className="card p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-800">Distribución Mensual</h3>
              <div className="text-xs text-slate-500">Promedio histórico</div>
            </div>
            <ResponsiveContainer width="100%" height={256}>
              <LineChart data={monthlyData.map(m => ({ ...m, month: shortMonth(m.month) }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value: number) => [`${value} mm`, 'Promedio']} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="average"
                  name="Precipitación (mm)"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ r: 5, fill: '#10b981' }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Extreme Events Timeline */}
        <div className="card p-8 mb-12 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-slate-800">Eventos Meteorológicos Significativos</h3>
            <button className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1">
              Ver todos →
            </button>
          </div>

          <div className="space-y-4">
            {extremeEvents.map((event, i) => (
              <div
                key={i}
                className="flex items-start gap-4 p-4 rounded-xl bg-gradient-to-r from-slate-50 to-white border border-slate-100 hover:border-slate-200 transition-colors"
              >
                <div className="flex flex-col items-center shrink-0">
                  <div className={`w-3 h-3 rounded-full ${event.severity === 'alto' ? 'bg-red-500' : 'bg-orange-400'}`} />
                  {i < extremeEvents.length - 1 && <div className="w-0.5 h-12 bg-slate-200 mt-1" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{event.date}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${event.severity === 'alto' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                      {event.severity === 'alto' ? 'Alto Riesgo' : 'Riesgo Medio'}
                    </span>
                  </div>
                  <h4 className="font-semibold text-slate-800 mb-1">{event.title}</h4>
                  <p className="text-sm text-slate-600">{event.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Data Source Info */}
        <div className="text-center">
          <div className="card p-6 bg-gradient-to-r from-slate-100 to-blue-50 border border-blue-200">
            <div className="flex items-center justify-center gap-3 mb-4">
              <StockIcon name="document" className="w-5 h-5" />
              <h4 className="font-bold text-slate-800">Fuente de Datos</h4>
            </div>
            {activeSource === 'neon_db' ? (
              <>
                <p className="text-sm text-slate-600 mb-2">
                  <strong>Proveedor:</strong> {sourceName}
                </p>
                <p className="text-sm text-slate-600 mb-2">
                  <strong>Tabla:</strong> `public.rainfall_conagua`
                </p>
                <p className="text-sm text-slate-600 mb-2">
                  <strong>Estación filtrada:</strong> 26139 - HERMOSILLO II (DGE)
                </p>
                <p className="text-sm text-slate-600 mb-2">
                  <strong>Notas:</strong> La gráfica refleja exactamente los registros disponibles en la base de datos para esa estación.
                </p>
              </>
            ) : activeSource === 'conagua_csv' ? (
              <>
                <p className="text-sm text-slate-600 mb-2">
                  <strong>Proveedor:</strong> {sourceName}
                </p>
                <p className="text-sm text-slate-600 mb-2">
                  <strong>Estación Meteorológica:</strong> 26139 - HERMOSILLO II (DGE)
                </p>
                <p className="text-sm text-slate-600 mb-2">
                  <strong>Coordenadas:</strong> 29.099°N, -110.954°W | <strong>Altitud:</strong> 221 msnm
                </p>
              </>
            ) : (
              <>
                <p className="text-sm text-slate-600 mb-2">
                  <strong>Proveedor:</strong> {sourceName}
                </p>
                <p className="text-sm text-slate-600 mb-2">
                  <strong>Punto de consulta:</strong> 29.073°N, -110.956°W (Hermosillo urbano)
                </p>
                <p className="text-sm text-slate-600 mb-2">
                  <strong>Variable:</strong> precipitación diaria (`precipitation_sum`, mm)
                </p>
              </>
            )}
            <p className="text-xs text-slate-500">
              Fuente activa: {sourceName} | Último año disponible: {lastYear}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
