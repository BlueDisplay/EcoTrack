'use client';

import type { Incident } from '@/lib/db/schema';
import { getSeverityConfig, getStatusConfig, formatDate, timeAgo } from '@/lib/utils';

interface SidebarProps {
  selectedIncident: Incident | null;
  totalReports: number;
  onClose: () => void;
}

// ─── Welcome Panel ──────────────────────────────────────────────────────────

function WelcomePanel({ totalReports }: { totalReports: number }) {
  return (
    <div className="p-6">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-gray-800 mb-2">
          🌍 EcoTrack
        </h2>
        <p className="text-sm text-gray-500">
          Cartografía Participativa de Riesgos Hidrometeorológicos
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-blue-50 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-blue-600">{totalReports}</p>
          <p className="text-xs text-blue-500">Reportes</p>
        </div>
        <div className="bg-emerald-50 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-emerald-600">IA</p>
          <p className="text-xs text-emerald-500">Detección</p>
        </div>
      </div>

      <p className="text-xs text-gray-400 text-center">
        Haz clic en un marcador del mapa para ver los detalles, o haz clic en
        el mapa para crear un nuevo reporte.
      </p>
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
    <div className="p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-800 flex-1 pr-2">
          {incident.titulo}
        </h3>
        <button
          onClick={onClose}
          className="p-1 rounded-full hover:bg-gray-100 transition-colors"
          aria-label="Cerrar"
        >
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Status badges */}
      <div className="flex gap-2 mb-4">
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${severity.bg} ${severity.text}`}>
          {severity.label}
        </span>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${status.bg} ${status.text}`}>
          {status.label}
        </span>
        {incident.medio && (
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
            📰 {incident.medio}
          </span>
        )}
      </div>

      {/* Details grid */}
      <div className="space-y-3 text-sm">
        {incident.afectacionesReportadas && (
          <div>
            <p className="text-gray-500 text-xs font-medium mb-1">Afectaciones</p>
            <p className="text-gray-700">{incident.afectacionesReportadas}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          {incident.colonia && (
            <div>
              <p className="text-gray-500 text-xs font-medium">Colonia</p>
              <p className="text-gray-700">{incident.colonia}</p>
            </div>
          )}
          {incident.direccionDetectada && (
            <div>
              <p className="text-gray-500 text-xs font-medium">Dirección</p>
              <p className="text-gray-700">{incident.direccionDetectada}</p>
            </div>
          )}
          {incident.mmLluviaReportados != null && (
            <div>
              <p className="text-gray-500 text-xs font-medium">Precipitación</p>
              <p className="text-gray-700">{incident.mmLluviaReportados} mm</p>
            </div>
          )}
          {incident.autora && (
            <div>
              <p className="text-gray-500 text-xs font-medium">Autora</p>
              <p className="text-gray-700">{incident.autora}</p>
            </div>
          )}
        </div>

        {/* Coordinates */}
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-gray-500 text-xs font-medium mb-1">Ubicación</p>
          <p className="text-gray-600 text-xs font-mono">
            {incident.lat.toFixed(6)}, {incident.lon.toFixed(6)}
          </p>
        </div>

        {/* Timestamps */}
        <div className="flex justify-between text-xs text-gray-400">
          <span>{formatDate(incident.fechaEvento)}</span>
          <span>{incident.createdAt ? timeAgo(incident.createdAt) : ''}</span>
        </div>

        {/* Notes */}
        {incident.notas && (
          <div>
            <p className="text-gray-500 text-xs font-medium mb-1">Notas</p>
            <p className="text-gray-600 text-sm">{incident.notas}</p>
          </div>
        )}

        {/* News link */}
        {incident.urlNoticia && (
          <a
            href={incident.urlNoticia}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 transition-colors"
          >
            📰 Ver noticia fuente
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
