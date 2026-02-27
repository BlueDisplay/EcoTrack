'use client';

import { useState, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Sidebar } from '@/components/sidebar/sidebar';
import { ReportForm } from '@/components/forms/report-form';
import type { Report } from '@/lib/db/schema';

const EcoTrackMap = dynamic(
  () => import('@/components/map/map-container').then((m) => m.EcoTrackMap),
  {
    ssr: false,
    loading: () => (
      <div className="h-full w-full animate-pulse bg-slate-200 flex items-center justify-center">
        <p className="text-gray-400 text-sm">Cargando mapa...</p>
      </div>
    ),
  },
);

type SidebarView = 'welcome' | 'details' | 'form';

interface MapSectionProps {
  reports: Report[];
  selectedId: string | null;
  sidebarView: SidebarView;
  formCoords: { lat: number; lon: number } | null;
  onMarkerClick: (report: Report) => void;
  onMapClick: (lat: number, lon: number) => void;
  onCloseDetails: () => void;
  onFormSuccess: () => void;
  onFormCancel: () => void;
  onAddReport: () => void;
}

export function MapSection({
  reports,
  selectedId,
  sidebarView,
  formCoords,
  onMarkerClick,
  onMapClick,
  onCloseDetails,
  onFormSuccess,
  onFormCancel,
  onAddReport,
}: MapSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapInstanceRef = useRef<any>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchText, setSearchText] = useState('');
  const [isSatellite, setIsSatellite] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleMapReady = useCallback((map: any) => {
    mapInstanceRef.current = map;
  }, []);

  const handleCenterMap = useCallback(() => {
    mapInstanceRef.current?.setView([29.072967, -110.955919], 13, { animate: true });
  }, []);

  const handleToggleSatellite = useCallback(async () => {
    const map = mapInstanceRef.current;
    if (!map) return;
    const L = (await import('leaflet')).default;
    setIsSatellite((prev) => {
      const next = !prev;
      // Remove existing tile layers
      map.eachLayer((layer: unknown) => {
        if (layer instanceof L.TileLayer) map.removeLayer(layer);
      });
      if (next) {
        L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
          attribution: '&copy; Esri',
        }).addTo(map);
      } else {
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors',
        }).addTo(map);
      }
      return next;
    });
  }, []);

  const handleFullscreen = useCallback(() => {
    const el = sectionRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  }, []);

  const handleExportCSV = useCallback(() => {
    const headers = ['id', 'titulo', 'colonia', 'gravedad', 'lat', 'lon', 'fecha'];
    const rows = filteredReports.map((r) => [
      r.id, r.titulo, r.colonia || '', r.gravedad, r.lat, r.lon, r.fechaEvento || '',
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ecotrack-reportes-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const handleShare = useCallback(async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: 'EcoTrack Hermosillo', text: 'Mapa de reportes hidrometeorológicos', url });
    } else {
      await navigator.clipboard.writeText(url);
      alert('Enlace copiado al portapapeles');
    }
  }, []);
  const selectedIncident = selectedId
    ? reports.find((r) => r.id === selectedId) || null
    : null;

  const severityCounts = reports.reduce(
    (acc, r) => {
      const key = (r.gravedad || 'bajo').toLowerCase();
      acc[key] = (acc[key] || 0) + 1;
      acc.total++;
      return acc;
    },
    { alto: 0, medio: 0, bajo: 0, critico: 0, total: 0 } as Record<string, number>,
  );

  const filteredReports = reports.filter((r) => {
    if (activeFilter !== 'all') {
      if (activeFilter === 'ciudadano') {
        if (r.tipoReporte !== 'ciudadano') return false;
      } else if ((r.gravedad || 'bajo').toLowerCase() !== activeFilter) return false;
    }
    if (searchText) {
      const q = searchText.toLowerCase();
      const match =
        (r.titulo || '').toLowerCase().includes(q) ||
        (r.colonia || '').toLowerCase().includes(q) ||
        (r.direccion || '').toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  return (
    <section id="mapa-interactivo" ref={sectionRef}>
      <div className="flex flex-col lg:flex-row" style={{ height: 'calc(100vh - 84px)' }}>
        {/* Map Container */}
        <div className="w-full lg:w-3/4 h-3/5 lg:h-full bg-slate-200 shadow-xl overflow-hidden relative">
          <EcoTrackMap
            incidents={filteredReports}
            onMapClick={onMapClick}
            onMarkerClick={onMarkerClick}
            selectedId={selectedId}
            onMapReady={handleMapReady}
          />

          {/* Search and Filter Controls */}
          <div className="absolute top-4 left-4 z-[500] flex flex-col gap-2">
            {searchOpen && (
              <div className="card p-3 min-w-80">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-emerald-600">🔍</span>
                  <h4 className="font-semibold text-slate-800">Buscar Eventos</h4>
                  <button onClick={() => setSearchOpen(false)} className="ml-auto text-slate-500 hover:text-slate-700">✕</button>
                </div>
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Buscar por ubicación, tipo de evento..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                  />
                  <div className="flex flex-wrap gap-2">
                    {[
                      { key: 'all', label: '🌐 Todos' },
                      { key: 'alto', label: '⚠️ Alto Riesgo' },
                      { key: 'medio', label: '🔶 Medio Riesgo' },
                      { key: 'bajo', label: 'ℹ️ Bajo Riesgo' },
                      { key: 'ciudadano', label: '👤 Reportes' },
                    ].map((f) => (
                      <button
                        key={f.key}
                        onClick={() => setActiveFilter(f.key)}
                        className={`filter-chip ${activeFilter === f.key ? 'active' : ''}`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                  <div className="text-xs text-slate-600 pt-2 border-t">
                    Mostrando {filteredReports.length} de {reports.length} eventos
                  </div>
                </div>
              </div>
            )}
            {!searchOpen && (
              <button
                onClick={() => setSearchOpen(true)}
                className="card p-3 hover:bg-slate-50 transition-colors cursor-pointer hidden md:flex items-center gap-2"
              >
                <span className="text-emerald-600">🔍</span>
                <span className="font-medium text-slate-700">Buscar y Filtrar</span>
              </button>
            )}
          </div>

          {/* Enhanced Legend Overlay */}
          <div className="absolute bottom-4 left-4 card p-4 text-sm text-slate-700 z-[400] min-w-48">
            <h4 className="font-bold text-slate-800 flex items-center gap-2 mb-3">
              <span>📊</span> Leyenda
            </h4>
            <div className="space-y-2">
              <LegendItem color="bg-red-500" label="Alto Riesgo" count={severityCounts.alto + (severityCounts.critico || 0)} bgClass="bg-red-100 text-red-800" />
              <LegendItem color="bg-orange-500" label="Medio Riesgo" count={severityCounts.medio} bgClass="bg-orange-100 text-orange-800" />
              <LegendItem color="bg-yellow-500" label="Bajo Riesgo" count={severityCounts.bajo} bgClass="bg-yellow-100 text-yellow-800" />
              <div className="pt-2 mt-2 border-t border-slate-200">
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span>Total de reportes:</span>
                  <span className="font-semibold">{severityCounts.total}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Map Controls Overlay */}
          <div className="absolute top-4 right-4 flex flex-col gap-2 z-[400]">
            <button onClick={handleCenterMap} className="btn-map-control" title="Centrar mapa en Hermosillo">🎯</button>
            <button onClick={handleToggleSatellite} className="btn-map-control" title="Alternar vista satelital">{isSatellite ? '🗺️' : '🛰️'}</button>
            <button onClick={handleFullscreen} className="btn-map-control" title="Pantalla completa">⛶</button>
          </div>

          {/* Weather Info */}
          <div className="absolute top-4 left-4 card p-3 text-sm z-[400] bg-white/90 backdrop-blur-sm hidden md:block" style={{ top: searchOpen ? 'auto' : '1rem', display: searchOpen ? 'none' : undefined }}>
            <div className="flex items-center gap-2 text-slate-700">
              <span>🌧️</span>
              <span className="font-medium">Hermosillo, Son.</span>
            </div>
            <div className="text-xs text-slate-600 mt-1">
              Última actualización: {new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>

          {/* Mobile Map Controls */}
          <div className="absolute top-4 left-4 right-4 z-[500] flex gap-2 md:hidden">
            <button onClick={handleCenterMap} className="glass-effect rounded-xl px-3 py-2 text-sm font-semibold text-emerald-700 shadow-sm">🎯 Centro</button>
            <button onClick={handleToggleSatellite} className="glass-effect rounded-xl px-3 py-2 text-sm font-semibold text-emerald-700 shadow-sm">🛰️ Capas</button>
            <button onClick={handleFullscreen} className="glass-effect rounded-xl px-3 py-2 text-sm font-semibold text-emerald-700 shadow-sm">📍 Completa</button>
            <button onClick={() => setSearchOpen(!searchOpen)} className="glass-effect rounded-xl px-3 py-2 text-sm font-semibold text-emerald-700 shadow-sm">🔍 Buscar</button>
          </div>
        </div>

        {/* Info Panel - Desktop */}
        <aside className="hidden lg:flex w-full lg:w-1/4 h-2/5 lg:h-full bg-white shadow-xl flex-col custom-scrollbar overflow-hidden">
          <div className="flex-grow overflow-y-auto p-8">
            {sidebarView === 'form' && formCoords ? (
              <ReportForm
                lat={formCoords.lat}
                lon={formCoords.lon}
                onSuccess={onFormSuccess}
                onCancel={onFormCancel}
              />
            ) : (
              <Sidebar
                selectedIncident={selectedIncident}
                totalReports={reports.length}
                onClose={onCloseDetails}
              />
            )}
          </div>

          {/* Enhanced Action Panel */}
          <div className="p-6 border-t border-slate-100 bg-gradient-to-r from-slate-50 to-white">
            <div className="space-y-3">
              <button onClick={onAddReport} className="w-full btn btn-primary">
                ➕ Añadir Nuevo Reporte
              </button>
              <div className="flex gap-2">
                <button onClick={handleExportCSV} className="flex-1 text-xs py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors">
                  📥 Exportar
                </button>
                <button onClick={handleShare} className="flex-1 text-xs py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors">
                  🔗 Compartir
                </button>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

function LegendItem({ color, label, count, bgClass }: { color: string; label: string; count: number; bgClass: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center">
        <span className={`w-3 h-3 rounded-full ${color} mr-3 shadow-sm`} />
        <span className="font-medium">{label}</span>
      </div>
      <span className={`text-xs px-2 py-1 rounded-full ${bgClass}`}>{count}</span>
    </div>
  );
}
