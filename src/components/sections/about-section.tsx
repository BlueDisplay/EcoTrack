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
        <div className="text-center mb-8 slide-up">
          <h2 className="section-title">Acerca de EcoTrack</h2>
          <p className="section-subtitle">
            Plataforma de monitoreo ambiental para análisis hidrometeorológico,
            trazabilidad de incidentes y apoyo técnico a la toma de decisiones.
          </p>
        </div>

        <div className="card p-8 bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200">
          <h3 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-3">
            <span className="p-2 rounded-lg bg-emerald-100">
              <StockIcon name="shield" className="w-6 h-6" />
            </span>
            Propósito Operativo
          </h3>
          <p className="text-slate-700 leading-relaxed">
            EcoTrack integra evidencia ciudadana georreferenciada, detección asistida por IA,
            eventos hemerográficos y series de lluvia CONAGUA para priorizar zonas de atención,
            evaluar severidad y mejorar tiempos de respuesta institucional.
          </p>
        </div>

        <div className="space-y-6">
          <h3 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
            <span className="p-2 rounded-lg bg-blue-100">
              <StockIcon name="chart" className="w-6 h-6" />
            </span>
            Métodos de Estimación de Riesgo Hidrometeorológico
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <article className="card p-6">
              <h4 className="font-bold text-slate-800 mb-2">1) Umbrales lluvia-impacto</h4>
              <p className="text-sm text-slate-600">
                Se relacionan acumulados de precipitación (24h/72h) con reportes de
                afectación para estimar niveles de alerta por colonia y ventana temporal.
              </p>
            </article>

            <article className="card p-6">
              <h4 className="font-bold text-slate-800 mb-2">2) Cruce espacial multicapa</h4>
              <p className="text-sm text-slate-600">
                Se combinan puntos de incidentes, densidad de reportes, historial de
                eventos y proximidad a zonas críticas para calcular prioridad territorial.
              </p>
            </article>

            <article className="card p-6">
              <h4 className="font-bold text-slate-800 mb-2">3) Severidad con evidencia</h4>
              <p className="text-sm text-slate-600">
                La foto obligatoria y el score de IA permiten clasificar casos con mayor
                consistencia, reduciendo falsos positivos en la operación diaria.
              </p>
            </article>
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
            <span className="p-2 rounded-lg bg-slate-100">
              <StockIcon name="document" className="w-6 h-6" />
            </span>
            Marco Técnico y Regulatorio
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card p-6">
              <h4 className="font-semibold text-slate-800 mb-3">Referencias normativas</h4>
              <ul className="text-sm text-slate-600 space-y-2 list-disc list-inside">
                <li>Ley General de Protección Civil y marcos estatales/municipales vigentes.</li>
                <li>Lineamientos para Atlas de Riesgos y gestión territorial preventiva.</li>
                <li>Criterios de monitoreo hidrometeorológico y datos oficiales de CONAGUA.</li>
                <li>Protocolos de coordinación entre autoridades y comunidad para atención temprana.</li>
              </ul>
            </div>

            <div className="card p-6">
              <h4 className="font-semibold text-slate-800 mb-3">Gobernanza de datos</h4>
              <ul className="text-sm text-slate-600 space-y-2 list-disc list-inside">
                <li>Trazabilidad por fuente: ciudadano, noticia o estación hidrométrica.</li>
                <li>Versionado de reglas de severidad y auditoría de cambios de estado.</li>
                <li>Coherencia espacial mediante `conagua_station_id` y georreferenciación.</li>
                <li>Interoperabilidad para reportes técnicos y tableros de protección civil.</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center card p-6 hover:scale-105 transition-transform">
            <div className="text-3xl font-bold text-emerald-600 mb-2">{totalReports}</div>
            <div className="text-sm text-slate-600">Reportes en Plataforma</div>
          </div>
          <div className="text-center card p-6 hover:scale-105 transition-transform">
            <div className="text-3xl font-bold text-green-600 mb-2">24/7</div>
            <div className="text-sm text-slate-600">Monitoreo Continuo</div>
          </div>
          <div className="text-center card p-6 hover:scale-105 transition-transform">
            <div className="text-3xl font-bold text-blue-600 mb-2">{coloniaCount}</div>
            <div className="text-sm text-slate-600">Colonias con Cobertura</div>
          </div>
          <div className="text-center card p-6 hover:scale-105 transition-transform">
            <div className="text-3xl font-bold text-purple-600 mb-2">4</div>
            <div className="text-sm text-slate-600">Fuentes Integradas</div>
          </div>
        </div>
      </div>
    </section>
  );
}

