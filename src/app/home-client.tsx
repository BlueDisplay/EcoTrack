'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { HeroSection } from '@/components/sections/hero-section';
import { MapSection } from '@/components/sections/map-section';
import { StatsSection } from '@/components/sections/stats-section';
import { AboutSection } from '@/components/sections/about-section';
import { HistoricalSection } from '@/components/sections/historical-section';
import { FooterSection } from '@/components/sections/footer-section';
import { LoadingScreen } from '@/components/ui/loading-screen';
import { fetchReports } from '@/lib/api/reports';
import type { Report } from '@/lib/db/schema';
import type { HydroEvent } from '@/lib/data/csv-loader';
import type { HistoricalStats } from '@/lib/data/historical-stats';
import { toast } from 'sonner';

type SidebarView = 'welcome' | 'details' | 'form';

interface HomeClientProps {
  csvEvents: HydroEvent[];
  historicalStats: HistoricalStats | null;
}

export function HomeClient({ csvEvents, historicalStats }: HomeClientProps) {
  const [reports, setReports] = useState<Report[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sidebarView, setSidebarView] = useState<SidebarView>('welcome');
  const [formCoords, setFormCoords] = useState<{ lat: number; lon: number } | null>(null);
  const mapRef = useRef<HTMLElement | null>(null);

  // Merge CSV events into Report[] for the map
  const csvAsReports: Report[] = csvEvents.map((ev) => ({
    id: ev.id_evento || ev.id || `csv-${Math.random().toString(36).slice(2)}`,
    fechaEvento: ev.fecha_evento || ev.fecha || null,
    titulo: ev.titulo || '',
    direccion: ev.direccion_detectada || ev.direccion || null,
    colonia: ev.colonia || null,
    gravedad: ev.gravedad || 'medio',
    descripcion: ev.afectaciones_reportadas || ev.descripcion || null,
    mmLluvia: ev.mm_lluvia_reportados ?? ev.mm_lluvia ?? null,
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
  }));

  const allReports = [...csvAsReports, ...reports];

  // Compute unique colonia count
  const coloniaCount = new Set(
    allReports.map((r) => r.colonia).filter(Boolean),
  ).size;

  // Load DB reports
  const loadReports = useCallback(async () => {
    try {
      const data = await fetchReports();
      setReports(data);
    } catch {
      // DB might not be configured — that's OK, we still have CSV data
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
    loadReports();
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
        totalReports={allReports.length}
        coloniaCount={coloniaCount}
        onExploreMap={scrollToMap}
        onAddReport={handleAddReport}
      />

      {/* Map Section */}
      <MapSection
        reports={allReports}
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
      <StatsSection reports={reports} csvEvents={csvEvents} />

      {/* About Section */}
      <AboutSection totalReports={allReports.length} coloniaCount={coloniaCount} />

      {/* Section Divider */}
      <div className="section-divider container mx-auto px-6" />

      {/* Historical Rainfall Section */}
      <HistoricalSection stats={historicalStats} />

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
