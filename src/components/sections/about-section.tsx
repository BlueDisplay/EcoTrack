interface AboutSectionProps {
  totalReports: number;
  coloniaCount: number;
}

export function AboutSection({ totalReports, coloniaCount }: AboutSectionProps) {
  return (
    <section id="acerca-de" className="py-24 bg-white relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 25% 25%, #10b981 2px, transparent 2px)', backgroundSize: '60px 60px' }} />
      </div>

      <div className="container mx-auto px-6 max-w-6xl relative">
        {/* Header */}
        <div className="text-center mb-16 slide-up">
          <h2 className="section-title">Acerca de EcoTrack</h2>
          <p className="section-subtitle">
            Una plataforma integral de monitoreo ambiental que combina ciencia ciudadana,
            datos históricos y tecnología para crear un Hermosillo más sustentable y resiliente.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
          {/* Mission */}
          <div className="animate-fade-in">
            <div className="card p-8 bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200">
              <h3 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                <div className="p-3 bg-emerald-600 rounded-xl text-white text-xl">👥</div>
                Nuestra Misión
              </h3>
              <p className="text-lg text-slate-700 leading-relaxed mb-6">
                Empoderar a la comunidad de Hermosillo para registrar, visualizar y compartir
                información sobre eventos hidrometeorológicos, creando un valioso registro
                de datos abiertos que fortalezca la resiliencia de nuestra ciudad.
              </p>
              <ul className="space-y-3 text-slate-600">
                <li className="flex items-center gap-3">
                  <span className="text-green-500">✓</span>
                  Monitoreo colaborativo en tiempo real
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-green-500">✓</span>
                  Datos abiertos y transparentes
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-green-500">✓</span>
                  Apoyo a la toma de decisiones
                </li>
              </ul>
            </div>
          </div>

          {/* Feature Cards */}
          <div className="animate-fade-in">
            <div className="space-y-6">
              <div className="card p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-blue-100 rounded-lg text-xl shrink-0">📊</div>
                  <div>
                    <h4 className="font-bold text-lg text-slate-800 mb-2">Datos Abiertos</h4>
                    <p className="text-slate-600">Toda la información recopilada está disponible para investigadores, autoridades y ciudadanos.</p>
                  </div>
                </div>
              </div>

              <div className="card p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-green-100 rounded-lg text-xl shrink-0">🛡️</div>
                  <div>
                    <h4 className="font-bold text-lg text-slate-800 mb-2">Prevención</h4>
                    <p className="text-slate-600">Identificamos patrones y zonas de riesgo para prevenir futuras afectaciones.</p>
                  </div>
                </div>
              </div>

              <div className="card p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-purple-100 rounded-lg text-xl shrink-0">🤝</div>
                  <div>
                    <h4 className="font-bold text-lg text-slate-800 mb-2">Colaboración</h4>
                    <p className="text-slate-600">Trabajamos junto con instituciones, investigadores y la comunidad.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          <div className="text-center card p-6 hover:scale-105 transition-transform">
            <div className="text-3xl font-bold text-emerald-600 mb-2">{totalReports}</div>
            <div className="text-sm text-slate-600">Reportes Registrados</div>
          </div>
          <div className="text-center card p-6 hover:scale-105 transition-transform">
            <div className="text-3xl font-bold text-green-600 mb-2">24/7</div>
            <div className="text-sm text-slate-600">Monitoreo Continuo</div>
          </div>
          <div className="text-center card p-6 hover:scale-105 transition-transform">
            <div className="text-3xl font-bold text-blue-600 mb-2">{coloniaCount}</div>
            <div className="text-sm text-slate-600">Colonias Cubiertas</div>
          </div>
          <div className="text-center card p-6 hover:scale-105 transition-transform">
            <div className="text-3xl font-bold text-purple-600 mb-2">100%</div>
            <div className="text-sm text-slate-600">Datos Abiertos</div>
          </div>
        </div>
      </div>
    </section>
  );
}
