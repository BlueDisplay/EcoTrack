'use client';

import { StockIcon } from '@/components/ui/stock-icon';

interface HeroSectionProps {
  totalReports: number;
  coloniaCount: number;
  onExploreMap: () => void;
  onAddReport: () => void;
}

export function HeroSection({ totalReports, coloniaCount, onExploreMap, onAddReport }: HeroSectionProps) {
  return (
    <section id="inicio" className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-r from-green-200/30 to-emerald-200/30 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-teal-200/20 to-green-200/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '-3s' }} />
        <div className="absolute top-1/2 right-1/3 w-48 h-48 bg-gradient-to-r from-emerald-300/25 to-green-300/25 rounded-full blur-2xl animate-float" style={{ animationDelay: '-1.5s' }} />

        {/* Floating Particle Dots */}
        <div className="particle-1 absolute top-[15%] left-[10%] w-3 h-3 bg-emerald-400/40 rounded-full" />
        <div className="particle-2 absolute top-[30%] right-[15%] w-2 h-2 bg-green-500/30 rounded-full" />
        <div className="particle-3 absolute bottom-[35%] left-[20%] w-2.5 h-2.5 bg-teal-400/35 rounded-full" />
        <div className="particle-4 absolute top-[60%] right-[25%] w-2 h-2 bg-emerald-500/25 rounded-full" />
        <div className="particle-1 absolute bottom-[20%] left-[60%] w-3 h-3 bg-green-400/30 rounded-full" style={{ animationDelay: '-2s' }} />
        <div className="particle-2 absolute top-[20%] right-[40%] w-1.5 h-1.5 bg-teal-500/40 rounded-full" style={{ animationDelay: '-4s' }} />

        {/* Grid Pattern */}
        <div className="absolute inset-0 opacity-[0.03]">
          <div className="h-full w-full" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(34, 197, 94, 0.4) 1px, transparent 0)', backgroundSize: '50px 50px' }} />
        </div>
      </div>

      <div className="relative z-10 container mx-auto px-6 text-center">
        <div className="max-w-6xl mx-auto">
          {/* Logo and Badge */}
          <div className="mb-8 animate-fade-in-up">
            <div className="inline-flex items-center gap-4 bg-white/80 backdrop-blur-sm rounded-2xl px-6 py-3 shadow-xl border border-green-100 gradient-border">
              <StockIcon name="globe" className="w-8 h-8" />
              <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent font-bold text-xl">EcoTrack</span>
              <div className="h-5 w-px bg-gray-300" />
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-sm font-medium text-gray-600">En Vivo</span>
              </div>
            </div>
          </div>

          {/* Main Headline */}
          <h1 className="font-bold text-3xl md:text-5xl lg:text-6xl mb-6 animate-fade-in-up leading-tight" style={{ animationDelay: '0.2s' }}>
            <span className="bg-gradient-to-r from-green-600 via-emerald-500 to-teal-600 bg-clip-text text-transparent text-shimmer">
              Cartografía Participativa
            </span>
            <br />
            <span className="text-2xl md:text-4xl lg:text-5xl bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
              de Riesgos Hidrometeorológicos
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-4xl mx-auto leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
            Plataforma de <strong className="text-green-600">ciencia ciudadana</strong> para el monitoreo colaborativo
            de riesgos hidrometeorológicos en <strong className="text-emerald-600">Hermosillo, Sonora</strong>
          </p>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-12 max-w-4xl mx-auto animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
            <div className="hero-stat-card group">
              <div className="hero-stat-icon"><StockIcon name="pin" className="w-5 h-5" /></div>
              <div className="hero-stat-number">{totalReports}</div>
              <div className="hero-stat-label">Reportes</div>
            </div>
            <div className="hero-stat-card group">
              <div className="hero-stat-icon"><StockIcon name="users" className="w-5 h-5" /></div>
              <div className="hero-stat-number">{coloniaCount}</div>
              <div className="hero-stat-label">Colonias</div>
            </div>
            <div className="hero-stat-card group">
              <div className="hero-stat-icon"><StockIcon name="clock" className="w-5 h-5" /></div>
              <div className="hero-stat-number">24/7</div>
              <div className="hero-stat-label">Monitoreo</div>
            </div>
            <div className="hero-stat-card group">
              <div className="hero-stat-icon"><StockIcon name="shield" className="w-5 h-5" /></div>
              <div className="hero-stat-number">100%</div>
              <div className="hero-stat-label">Datos Abiertos</div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in-up" style={{ animationDelay: '0.8s' }}>
            <button onClick={onExploreMap} className="hero-cta-primary group">
              <span className="relative z-10 inline-flex items-center gap-2">
                <StockIcon name="map" className="w-5 h-5" />
                Explorar Mapa Interactivo
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-green-700 to-emerald-700 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </button>
            <button onClick={onAddReport} className="hero-cta-secondary group">
              Añadir Reporte
            </button>
          </div>
        </div>
      </div>

      {/* Scroll Down Indicator */}
      <div className="absolute bottom-8 left-1/2 scroll-indicator">
        <button
          onClick={onExploreMap}
          className="flex flex-col items-center gap-2 text-emerald-600/60 hover:text-emerald-600 transition-colors"
          aria-label="Desplazarse hacia abajo"
        >
          <span className="text-xs font-medium tracking-widest uppercase">Explorar</span>
          <div className="flex flex-col items-center gap-0.5">
            <svg className="w-5 h-5 scroll-chevron" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </button>
      </div>
    </section>
  );
}
