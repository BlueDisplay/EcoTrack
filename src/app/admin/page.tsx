'use client';

import { useState, useEffect, useCallback } from 'react';
import { fetchReports, updateReportStatus } from '@/lib/api/reports';
import { REPORT_STATUS, type Report } from '@/lib/db/schema';
import { timeAgo, SEVERITY_CONFIG, STATUS_CONFIG, type SeverityKey, type StatusKey } from '@/lib/utils';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { toast } from 'sonner';

export default function AdminPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  const load = useCallback(async () => {
    try {
      const data = await fetchReports(500);
      setReports(data);
    } catch {
      toast.error('Error al cargar reportes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleStatusChange = async (reportId: string, newStatus: string) => {
    try {
      await updateReportStatus(reportId, newStatus);
      setReports((prev) =>
        prev.map((r) => (r.id === reportId ? { ...r, status: newStatus } : r)),
      );
      toast.success(`Reporte #${reportId} → ${newStatus}`);
    } catch {
      toast.error('Error al actualizar estado');
    }
  };

  const filtered =
    filter === 'all' ? reports : reports.filter((r) => (r.status ?? 'enviado') === filter);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Panel de Administración
          </h1>
          <p className="text-sm text-gray-500">
            {reports.length} reportes totales · {filtered.length} mostrados
          </p>
        </div>

        {/* Status filter */}
        <div className="flex gap-2 flex-wrap">
          {['all', ...Object.values(REPORT_STATUS)].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                filter === s
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {s === 'all' ? 'Todos' : s}
            </button>
          ))}
        </div>
      </div>

      {/* Report table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 text-left">ID</th>
                <th className="px-4 py-3 text-left">Tipo</th>
                <th className="px-4 py-3 text-left">Colonia</th>
                <th className="px-4 py-3 text-left">Gravedad</th>
                <th className="px-4 py-3 text-left">Estado</th>
                <th className="px-4 py-3 text-left">Fecha</th>
                <th className="px-4 py-3 text-left">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((report) => {
                const sevKey = (report.gravedad?.toLowerCase() || 'bajo') as SeverityKey;
                const sev = SEVERITY_CONFIG[sevKey] ?? SEVERITY_CONFIG.bajo;
                const stKey = (report.status?.toLowerCase() || 'enviado') as StatusKey;
                const st = STATUS_CONFIG[stKey] ?? STATUS_CONFIG.enviado;

                return (
                  <tr
                    key={report.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3 font-mono text-xs text-gray-400">
                      #{report.id}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-800">
                      {report.tipoEvento ?? report.tipoReporte ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {report.colonia}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${sev.bg} ${sev.text}`}
                      >
                        {sev.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${st.bg} ${st.text}`}
                      >
                        {st.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {report.createdAt ? timeAgo(report.createdAt) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={report.status ?? 'enviado'}
                        onChange={(e) =>
                          handleStatusChange(report.id, e.target.value)
                        }
                        className="text-xs border border-gray-200 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      >
                        {Object.values(REPORT_STATUS).map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="text-center py-12 text-gray-400 text-sm">
              No hay reportes para mostrar
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
