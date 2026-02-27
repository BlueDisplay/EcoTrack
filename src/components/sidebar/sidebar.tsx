'use client';

import type { Incident } from '@/lib/db/schema';
import { getSeverityConfig, getStatusConfig, formatDate, timeAgo } from '@/lib/utils';
import { StockIcon } from '@/components/ui/stock-icon';

interface SidebarProps {
  selectedIncident: Incident | null;
  totalReports: number;
  onClose: () => void;
}

// ─── Welcome Panel ──────────────────────────────────────────────────────────

function WelcomePanel({ totalReports }: { totalReports: number }) {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 shadow-lg shadow-emerald-500/20 mb-4">
          <StockIcon name="globe" className="w-7 h-7 text-white" />
        </div>
        <h2 className="text-xl font-bold text-gray-800 mb-1">EcoTrack</h2>
        <p className="text-sm text-gray-500">
          Cartografía Participativa de Riesgos
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 text-center border border-blue-100">
          <p className="text-2xl font-bold text-blue-600">{totalReports}</p>
          <p className="text-xs text-blue-500 font-medium">Reportes</p>
        </div>
        <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl p-4 text-center border border-emerald-100">
          <div className="flex items-center justify-center gap-1">
            <StockIcon name="lab" className="w-5 h-5 text-emerald-600" />
            <p className="text-2xl font-bold text-emerald-600">IA</p>
          </div>
          <p className="text-xs text-emerald-500 font-medium">Detección</p>
        </div>
      </div>

      {/* Quick actions hint */}
      <div className="space-y-3">
        <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
          <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
            <StockIcon name="pin" className="w-4 h-4 text-amber-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700">Ver detalles</p>
            <p className="text-xs text-gray-400">Haz clic en un marcador del mapa</p>
          </div>
        </div>
        <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
            <StockIcon name="target" className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700">Nuevo reporte</p>
            <p className="text-xs text-gray-400">Haz clic en cualquier punto del mapa</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Incident Details Panel ─────────────────────────────────────────────────

function IncidentDetails({
  incident,
  onClose,
}: {
  incident: Incident;
  onClose: () => void;
}) {
  const severity = getSeverityConfig(incident.gravedad);
  const status = getStatusConfig(incident.status);

  return (
    <div className="p-5 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-lg font-bold text-gray-800 leading-snug flex-1">
          {incident.titulo}
        </h3>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0"
          aria-label="Cerrar"
        >
          <StockIcon name="close" className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      {/* Status badges */}
      <div className="flex flex-wrap gap-2">
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${severity.bg} ${severity.text}`}>
          {severity.label}
        </span>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${status.bg} ${status.text}`}>
          {status.label}
        </span>
        {incident.medio && (
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            {incident.medio}
          </span>
        )}
      </div>

      {/* Details grid */}
      <div className="space-y-3 text-sm">
        {incident.afectacionesReportadas && (
          <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl">
            <p className="text-amber-800 text-xs font-semibold mb-1 flex items-center gap-1.5">
              <StockIcon name="shield" className="w-3.5 h-3.5" />
              Afectaciones
            </p>
            <p className="text-gray-700 text-sm">{incident.afectacionesReportadas}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          {incident.colonia && (
            <div className="p-3 bg-gray-50 rounded-xl">
              <p className="text-gray-500 text-xs font-semibold mb-0.5">Colonia</p>
              <p className="text-gray-700 font-medium">{incident.colonia}</p>
            </div>
          )}
          {incident.direccionDetectada && (
            <div className="p-3 bg-gray-50 rounded-xl">
              <p className="text-gray-500 text-xs font-semibold mb-0.5">Dirección</p>
              <p className="text-gray-700">{incident.direccionDetectada}</p>
            </div>
          )}
          {incident.mmLluviaReportados != null && (
            <div className="p-3 bg-blue-50 rounded-xl">
              <p className="text-blue-500 text-xs font-semibold mb-0.5">Precipitación</p>
              <p className="text-blue-700 font-bold">{incident.mmLluviaReportados} mm</p>
            </div>
          )}
          {incident.autora && (
            <div className="p-3 bg-gray-50 rounded-xl">
              <p className="text-gray-500 text-xs font-semibold mb-0.5">Autora</p>
              <p className="text-gray-700">{incident.autora}</p>
            </div>
          )}
        </div>

        {/* Coordinates */}
        <div className="bg-slate-50 rounded-xl p-3 flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-xs font-semibold mb-0.5">Ubicación</p>
            <p className="text-gray-600 text-xs font-mono">
              {incident.lat.toFixed(6)}, {incident.lon.toFixed(6)}
            </p>
          </div>
          <StockIcon name="pin" className="w-4 h-4 text-gray-400" />
        </div>

        {/* Timestamps */}
        <div className="flex justify-between text-xs text-gray-400 px-1">
          <span>{formatDate(incident.fechaEvento)}</span>
          <span>{incident.createdAt ? timeAgo(incident.createdAt) : ''}</span>
        </div>

        {/* Notes */}
        {incident.notas && (
          <div className="p-3 bg-gray-50 rounded-xl">
            <p className="text-gray-500 text-xs font-semibold mb-1">Notas</p>
            <p className="text-gray-600 text-sm">{incident.notas}</p>
          </div>
        )}

        {/* News link */}
        {incident.urlNoticia && (
          <a
            href={incident.urlNoticia}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 transition-colors font-medium bg-blue-50 hover:bg-blue-100 rounded-xl px-4 py-2.5 w-full justify-center"
          >
            <StockIcon name="document" className="w-4 h-4" />
            Ver noticia fuente
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        )}
      </div>
    </div>
  );
}

// ─── Sidebar Container ──────────────────────────────────────────────────────

export function Sidebar({ selectedIncident, totalReports, onClose }: SidebarProps) {
  return (
    <aside className="w-full md:w-96 bg-white/90 backdrop-blur-lg border-r border-gray-200 overflow-y-auto h-full">
      {selectedIncident ? (
        <IncidentDetails incident={selectedIncident} onClose={onClose} />
      ) : (
        <WelcomePanel totalReports={totalReports} />
      )}
    </aside>
  );
}
