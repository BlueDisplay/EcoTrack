import { StockIcon } from '@/components/ui/stock-icon';

interface AboutSectionProps {
  totalReports: number;
  coloniaCount: number;
}

export function AboutSection({ totalReports, coloniaCount }: AboutSectionProps) {
  return (
    <section id="acerca-de" className="py-24 bg-white relative overflow-hidden">
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'radial-gradient(circle at 25% 25%, #10b981 2px, transparent 2px)',
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      <div className="container mx-auto px-6 max-w-6xl relative space-y-12">
        <div className="text-center mb-8 reveal">
          <h2 className="section-title">Acerca de EcoTrack</h2>
          <p className="section-subtitle">
            Plataforma de monitoreo ambiental para análisis hidrometeorológico,
            trazabilidad de incidentes y apoyo técnico a la toma de decisiones.
          </p>
        </div>

        <div className="card p-8 bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200 reveal">
          <h3 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-100 to-green-100 shadow-sm">
              <StockIcon name="shield" className="w-6 h-6" />
            </span>
            Propósito Operativo
          </h3>
          <p className="text-slate-700 leading-relaxed text-lg">
            EcoTrack integra evidencia ciudadana georreferenciada, detección asistida por IA,
            eventos hemerográficos y series de lluvia CONAGUA para priorizar zonas de atención,
            evaluar severidad y mejorar tiempos de respuesta institucional.
          </p>
        </div>

        <div className="space-y-6 reveal">
          <h3 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-gradient-to-br from-blue-100 to-cyan-100 shadow-sm">
              <StockIcon name="chart" className="w-6 h-6" />
            </span>
            Métodos de Estimación de Riesgo Hidrometeorológico
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <article className="card p-6 reveal stagger-1">
              <div className="flex items-start gap-4">
                <div className="number-badge">1</div>
                <div>
                  <h4 className="font-bold text-slate-800 mb-2">Umbrales lluvia-impacto</h4>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Se relacionan acumulados de precipitación (24h/72h) con reportes de
                    afectación para estimar niveles de alerta por colonia y ventana temporal.
                  </p>
                </div>
              </div>
            </article>

            <article className="card p-6 reveal stagger-2">
              <div className="flex items-start gap-4">
                <div className="number-badge">2</div>
                <div>
                  <h4 className="font-bold text-slate-800 mb-2">Cruce espacial multicapa</h4>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Se combinan puntos de incidentes, densidad de reportes, historial de
                    eventos y proximidad a zonas críticas para calcular prioridad territorial.
                  </p>
                </div>
              </div>
            </article>

            <article className="card p-6 reveal stagger-3">
              <div className="flex items-start gap-4">
                <div className="number-badge">3</div>
                <div>
                  <h4 className="font-bold text-slate-800 mb-2">Severidad con evidencia</h4>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    La foto obligatoria y el score de IA permiten clasificar casos con mayor
                    consistencia, reduciendo falsos positivos en la operación diaria.
                  </p>
                </div>
              </div>
            </article>
          </div>
        </div>

        <div className="space-y-6 reveal">
          <h3 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-gradient-to-br from-slate-100 to-gray-100 shadow-sm">
              <StockIcon name="document" className="w-6 h-6" />
            </span>
            Marco Técnico y Regulatorio
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card p-6 reveal stagger-1">
              <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                <div className="w-1.5 h-6 rounded-full bg-gradient-to-b from-emerald-500 to-green-600" />
                Referencias normativas
              </h4>
              <ul className="text-sm text-slate-600 space-y-2.5">
                <li className="flex items-start gap-2">
                  <span className="w-1 h-1 rounded-full bg-emerald-500 mt-2 flex-shrink-0" />
                  Ley General de Protección Civil y marcos estatales/municipales vigentes.
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1 h-1 rounded-full bg-emerald-500 mt-2 flex-shrink-0" />
                  Lineamientos para Atlas de Riesgos y gestión territorial preventiva.
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1 h-1 rounded-full bg-emerald-500 mt-2 flex-shrink-0" />
                  Criterios de monitoreo hidrometeorológico y datos oficiales de CONAGUA.
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1 h-1 rounded-full bg-emerald-500 mt-2 flex-shrink-0" />
                  Protocolos de coordinación entre autoridades y comunidad para atención temprana.
                </li>
              </ul>
            </div>

            <div className="card p-6 reveal stagger-2">
              <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                <div className="w-1.5 h-6 rounded-full bg-gradient-to-b from-blue-500 to-cyan-600" />
                Gobernanza de datos
              </h4>
              <ul className="text-sm text-slate-600 space-y-2.5">
                <li className="flex items-start gap-2">
                  <span className="w-1 h-1 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                  Trazabilidad por fuente: ciudadano, noticia o estación hidrométrica.
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1 h-1 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                  Versionado de reglas de severidad y auditoría de cambios de estado.
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1 h-1 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                  Coherencia espacial mediante conagua_station_id y georreferenciación.
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1 h-1 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                  Interoperabilidad para reportes técnicos y tableros de protección civil.
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 reveal">
          <div className="text-center card p-6 group hover:scale-105 transition-transform">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-100 mb-3 group-hover:scale-110 transition-transform">
              <StockIcon name="pin" className="w-6 h-6 text-emerald-600" />
            </div>
            <div className="text-3xl font-bold text-emerald-600 mb-1">{totalReports}</div>
            <div className="text-sm text-slate-600 font-medium">Reportes en Plataforma</div>
          </div>
          <div className="text-center card p-6 group hover:scale-105 transition-transform">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-green-100 mb-3 group-hover:scale-110 transition-transform">
              <StockIcon name="clock" className="w-6 h-6 text-green-600" />
            </div>
            <div className="text-3xl font-bold text-green-600 mb-1">24/7</div>
            <div className="text-sm text-slate-600 font-medium">Monitoreo Continuo</div>
          </div>
          <div className="text-center card p-6 group hover:scale-105 transition-transform">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-100 mb-3 group-hover:scale-110 transition-transform">
              <StockIcon name="map" className="w-6 h-6 text-blue-600" />
            </div>
            <div className="text-3xl font-bold text-blue-600 mb-1">{coloniaCount}</div>
            <div className="text-sm text-slate-600 font-medium">Colonias con Cobertura</div>
          </div>
          <div className="text-center card p-6 group hover:scale-105 transition-transform">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-purple-100 mb-3 group-hover:scale-110 transition-transform">
              <StockIcon name="grid" className="w-6 h-6 text-purple-600" />
            </div>
            <div className="text-3xl font-bold text-purple-600 mb-1">4</div>
            <div className="text-sm text-slate-600 font-medium">Fuentes Integradas</div>
          </div>
        </div>
      </div>
    </section>
  );
}
