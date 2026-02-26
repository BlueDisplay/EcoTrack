'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Sidebar } from '@/components/sidebar/sidebar';
import { ReportForm } from '@/components/forms/report-form';
import { fetchReports } from '@/lib/api/reports';
import type { Report } from '@/lib/db/schema';
import { toast } from 'sonner';

// Dynamic import — Leaflet requires the DOM (no SSR)
const EcoTrackMap = dynamic(
  () => import('@/components/map/map-container').then((m) => m.EcoTrackMap),
  {
    ssr: false,
    loading: () => (
      <div className="h-full w-full animate-pulse bg-slate-200 rounded-xl flex items-center justify-center">
        <p className="text-gray-400 text-sm">Cargando mapa...</p>
      </div>
    ),
  },
);

type SidebarView = 'welcome' | 'details' | 'form';

export default function HomePage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sidebarView, setSidebarView] = useState<SidebarView>('welcome');
  const [formCoords, setFormCoords] = useState<{ lat: number; lon: number } | null>(null);

  // Load reports
  const loadReports = useCallback(async () => {
    try {
      const data = await fetchReports();
      setReports(data);
    } catch (err) {
      console.error('Failed to load reports:', err);
      toast.error('No se pudieron cargar los reportes');
    }
  }, []);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  // Handlers
  const handleMarkerClick = (report: Report) => {
    setSelectedId(report.id);
    setSidebarView('details');
  };

  const handleMapClick = (lat: number, lon: number) => {
    setFormCoords({ lat, lon });
    setSidebarView('form');
    setSelectedId(null);
  };

  const handleCloseDetails = () => {
    setSelectedId(null);
    setSidebarView('welcome');
  };

  const handleFormSuccess = () => {
    setSidebarView('welcome');
    setFormCoords(null);
    loadReports(); // Reload to show the new report
    toast.success('Reporte enviado correctamente');
  };

  const handleFormCancel = () => {
    setSidebarView('welcome');
    setFormCoords(null);
  };

  const selectedIncident = selectedId
    ? reports.find((r) => r.id === selectedId) || null
    : null;

  return (
    <div className="h-[calc(100dvh-3.5rem)] flex flex-col md:flex-row">
      {/* Sidebar */}
      <div className="w-full md:w-96 md:h-full overflow-y-auto scrollbar-thin border-b md:border-b-0 md:border-r border-gray-200 bg-white/90 backdrop-blur-lg">
        {sidebarView === 'form' && formCoords ? (
          <ReportForm
            lat={formCoords.lat}
            lon={formCoords.lon}
            onSuccess={handleFormSuccess}
            onCancel={handleFormCancel}
          />
        ) : (
          <Sidebar
            selectedIncident={selectedIncident}
            totalReports={reports.length}
            onClose={handleCloseDetails}
          />
        )}
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        <EcoTrackMap
          incidents={reports}
          onMapClick={handleMapClick}
          onMarkerClick={handleMarkerClick}
          selectedId={selectedId}
        />
      </div>
    </div>
  );
}
