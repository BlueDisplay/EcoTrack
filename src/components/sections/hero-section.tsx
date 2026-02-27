'use client';

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
        {/* Grid Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="h-full w-full" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(34, 197, 94, 0.3) 1px, transparent 0)', backgroundSize: '50px 50px' }} />
        </div>
      </div>

      <div className="relative z-10 container mx-auto px-6 text-center">
        <div className="max-w-6xl mx-auto">
          {/* Logo and Badge */}
          <div className="mb-8 animate-fade-in-up">
            <div className="inline-flex items-center gap-4 bg-white/80 backdrop-blur-sm rounded-2xl px-6 py-3 shadow-xl border border-green-100">
              <span className="text-3xl animate-glow">🌍</span>
              <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent font-bold text-xl">EcoTrack</span>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-sm font-medium text-gray-600">En Vivo</span>
              </div>
            </div>
          </div>

          {/* Main Headline */}
          <h1 className="font-bold text-3xl md:text-5xl lg:text-6xl mb-6 animate-fade-in-up leading-tight" style={{ animationDelay: '0.2s' }}>
            <span className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 bg-clip-text text-transparent">
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
              <div className="hero-stat-icon"><span>📍</span></div>
              <div className="hero-stat-number">{totalReports}</div>
              <div className="hero-stat-label">Reportes</div>
            </div>
            <div className="hero-stat-card group">
              <div className="hero-stat-icon"><span>🏠</span></div>
              <div className="hero-stat-number">{coloniaCount}</div>
              <div className="hero-stat-label">Colonias</div>
            </div>
            <div className="hero-stat-card group">
              <div className="hero-stat-icon"><span>⏱️</span></div>
              <div className="hero-stat-number">24/7</div>
              <div className="hero-stat-label">Monitoreo</div>
            </div>
            <div className="hero-stat-card group">
              <div className="hero-stat-icon"><span>🛡️</span></div>
              <div className="hero-stat-number">100%</div>
              <div className="hero-stat-label">Datos Abiertos</div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in-up" style={{ animationDelay: '0.8s' }}>
            <button onClick={onExploreMap} className="hero-cta-primary group">
              <span className="relative z-10">🗺️ Explorar Mapa Interactivo</span>
              <div className="absolute inset-0 bg-gradient-to-r from-green-700 to-emerald-700 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </button>
            <button onClick={onAddReport} className="hero-cta-secondary group">
              ➕ Añadir Reporte
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
