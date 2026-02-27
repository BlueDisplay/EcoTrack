'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { HeroSection } from '@/components/sections/hero-section';
import { MapSection } from '@/components/sections/map-section';
import { StatsSection } from '@/components/sections/stats-section';
import { AboutSection } from '@/components/sections/about-section';
import { HistoricalSection } from '@/components/sections/historical-section';
import { FooterSection } from '@/components/sections/footer-section';
import { LoadingScreen } from '@/components/ui/loading-screen';
import { fetchIncidents } from '@/lib/api/incidents';
import type { Incident } from '@/lib/db/schema';
import type { HydroEvent, RainfallDataSource } from '@/lib/data/csv-loader';
import type { HistoricalStats } from '@/lib/data/historical-stats';
import { toast } from 'sonner';

type SidebarView = 'welcome' | 'details' | 'form';

interface HomeClientProps {
  csvEvents: HydroEvent[];
  historicalStats: HistoricalStats | null;
  rainfallSource: RainfallDataSource | null;
}

export function HomeClient({ csvEvents, historicalStats, rainfallSource }: HomeClientProps) {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sidebarView, setSidebarView] = useState<SidebarView>('welcome');
  const [formCoords, setFormCoords] = useState<{ lat: number; lon: number } | null>(null);
  const mapRef = useRef<HTMLElement | null>(null);

  // Merge CSV events into Incident[] for the map
  const csvAsIncidents: Incident[] = csvEvents.map((ev) => ({
    id: ev.id_evento || ev.id || `csv-${Math.random().toString(36).slice(2)}`,
    fechaEvento: ev.fecha_evento || ev.fecha || new Date().toISOString().split('T')[0],
    fechaPublicacion: null,
    titulo: ev.titulo || '',
    medio: ev.medio || null,
    autora: null,
    urlNoticia: ev.url_noticia || `https://csv-event-${Math.random().toString(36).slice(2)}`,
    direccionDetectada: ev.direccion_detectada || ev.direccion || null,
    colonia: ev.colonia || null,
    urlMaps: null,
    lat: Number(ev.lat) || 29.07,
    lon: Number(ev.lon) || -110.96,
    mmLluviaReportados: ev.mm_lluvia_reportados ?? ev.mm_lluvia ?? null,
    afectacionesReportadas: ev.afectaciones_reportadas || ev.descripcion || null,
    gravedad: ev.gravedad || 'medio',
    notas: null,
    conaguaStationId: null,
    status: 'atendido',
    createdAt: ev.fecha_evento ? new Date(ev.fecha_evento) : new Date(),
  }));

  const allIncidents = [...csvAsIncidents, ...incidents];

  // Compute unique colonia count
  const coloniaCount = new Set(
    allIncidents.map((r) => r.colonia).filter(Boolean),
  ).size;

  // Load DB incidents
  const loadIncidents = useCallback(async () => {
    try {
      const data = await fetchIncidents();
      setIncidents(data);
    } catch {
      // DB might not be configured — that's OK, we still have CSV data
    }
  }, []);

  useEffect(() => {
    loadIncidents();
  }, [loadIncidents]);

  // Handlers
  const handleMarkerClick = (incident: Incident) => {
    setSelectedId(incident.id);
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
    loadIncidents();
    toast.success('Reporte enviado correctamente');
  };

  const handleFormCancel = () => {
    setSidebarView('welcome');
    setFormCoords(null);
  };

  const scrollToMap = () => {
    document.getElementById('mapa-interactivo')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleAddReport = () => {
    scrollToMap();
    // Set sidebar to prompt user to click on map
    setTimeout(() => {
      setSidebarView('welcome');
      toast.info('Haz clic en el mapa para seleccionar la ubicacion del reporte');
    }, 500);
  };

  return (
    <>
      {/* Loading Screen */}
      <LoadingScreen />

      {/* Scroll Progress Bar */}
      <ScrollProgress />

      {/* Hero Section */}
      <HeroSection
        totalReports={allIncidents.length}
        coloniaCount={coloniaCount}
        onExploreMap={scrollToMap}
        onAddReport={handleAddReport}
      />

      {/* Map Section */}
      <MapSection
        incidents={allIncidents}
        selectedId={selectedId}
        sidebarView={sidebarView}
        formCoords={formCoords}
        onMarkerClick={handleMarkerClick}
        onMapClick={handleMapClick}
        onCloseDetails={handleCloseDetails}
        onFormSuccess={handleFormSuccess}
        onFormCancel={handleFormCancel}
        onAddReport={handleAddReport}
      />

      {/* Statistics Section */}
      <StatsSection incidents={incidents} csvEvents={csvEvents} />

      {/* About Section */}
      <AboutSection totalReports={allIncidents.length} coloniaCount={coloniaCount} />

      {/* Section Divider */}
      <div className="section-divider container mx-auto px-6" />

      {/* Historical Rainfall Section */}
      <HistoricalSection stats={historicalStats} source={rainfallSource} />

      {/* Footer */}
      <FooterSection />
    </>
  );
}

function ScrollProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      setProgress(scrollPercent);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="scroll-progress" style={{ width: `${progress}%` }} />
  );
}
