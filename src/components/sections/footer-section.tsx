import Link from 'next/link';
import { StockIcon } from '@/components/ui/stock-icon';

export function FooterSection() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-b from-slate-800 via-slate-900 to-slate-950 text-white py-16 relative overflow-hidden footer-glow">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-[0.06] pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: 'radial-gradient(circle at 75% 25%, #10b981 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      {/* Gradient Orb */}
      <div className="absolute -top-32 -right-32 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-green-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="container mx-auto px-6 relative">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Brand Section */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500/20 to-green-500/20 border border-emerald-500/10">
                <StockIcon name="globe" className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                EcoTrack Sonora
              </h3>
            </div>
            <p className="text-slate-400 mb-6 max-w-md leading-relaxed">
              Construyendo un Hermosillo más sustentable y resiliente a través del monitoreo ambiental
              colaborativo y la tecnología avanzada de datos climáticos.
            </p>
            <div className="flex gap-3">
              <a
                href="https://github.com/badouintec/EcoTracker"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-800 border border-slate-700 text-slate-400 hover:text-emerald-400 hover:border-emerald-500/30 hover:bg-emerald-500/10 transition-all duration-300"
                aria-label="Twitter"
              >
                <StockIcon name="document" className="w-4.5 h-4.5" />
              </a>
              <a
                href="https://github.com/badouintec/EcoTracker"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-800 border border-slate-700 text-slate-400 hover:text-emerald-400 hover:border-emerald-500/30 hover:bg-emerald-500/10 transition-all duration-300"
                aria-label="Facebook"
              >
                <StockIcon name="users" className="w-4.5 h-4.5" />
              </a>
              <a
                href="https://github.com/badouintec/EcoTracker"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-800 border border-slate-700 text-slate-400 hover:text-emerald-400 hover:border-emerald-500/30 hover:bg-emerald-500/10 transition-all duration-300"
                aria-label="GitHub"
              >
                <StockIcon name="lab" className="w-4.5 h-4.5" />
              </a>
              <a
                href="https://github.com/badouintec/EcoTracker"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-800 border border-slate-700 text-slate-400 hover:text-emerald-400 hover:border-emerald-500/30 hover:bg-emerald-500/10 transition-all duration-300"
                aria-label="Telegram"
              >
                <StockIcon name="camera" className="w-4.5 h-4.5" />
              </a>
            </div>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-bold text-lg mb-4 text-white flex items-center gap-2">
              <div className="w-1 h-5 rounded-full bg-gradient-to-b from-emerald-400 to-green-500" />
              Recursos
            </h4>
            <ul className="space-y-3 text-slate-400">
              <li>
                <Link href="/api/reports" className="hover:text-emerald-400 transition-colors inline-flex items-center gap-1.5 group">
                  <span className="w-0 h-px bg-emerald-400 group-hover:w-3 transition-all duration-300" />
                  API de Datos
                </Link>
              </li>
              <li>
                <Link href="https://github.com/badouintec/EcoTracker#readme" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 transition-colors inline-flex items-center gap-1.5 group">
                  <span className="w-0 h-px bg-emerald-400 group-hover:w-3 transition-all duration-300" />
                  Documentación
                </Link>
              </li>
              <li>
                <Link href="#estadisticas" className="hover:text-emerald-400 transition-colors inline-flex items-center gap-1.5 group">
                  <span className="w-0 h-px bg-emerald-400 group-hover:w-3 transition-all duration-300" />
                  Exportar Datos
                </Link>
              </li>
              <li>
                <Link href="#historico" className="hover:text-emerald-400 transition-colors inline-flex items-center gap-1.5 group">
                  <span className="w-0 h-px bg-emerald-400 group-hover:w-3 transition-all duration-300" />
                  Metodología
                </Link>
              </li>
            </ul>
          </div>

          {/* Community */}
          <div>
            <h4 className="font-bold text-lg mb-4 text-white flex items-center gap-2">
              <div className="w-1 h-5 rounded-full bg-gradient-to-b from-blue-400 to-cyan-500" />
              Comunidad
            </h4>
            <ul className="space-y-3 text-slate-400">
              <li>
                <Link href="https://github.com/badouintec/EcoTracker/graphs/contributors" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 transition-colors inline-flex items-center gap-1.5 group">
                  <span className="w-0 h-px bg-emerald-400 group-hover:w-3 transition-all duration-300" />
                  Colaboradores
                </Link>
              </li>
              <li>
                <Link href="https://github.com/badouintec/EcoTracker/issues/new?labels=bug" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 transition-colors inline-flex items-center gap-1.5 group">
                  <span className="w-0 h-px bg-emerald-400 group-hover:w-3 transition-all duration-300" />
                  Reportar Error
                </Link>
              </li>
              <li>
                <Link href="https://github.com/badouintec/EcoTracker/issues/new?labels=enhancement" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 transition-colors inline-flex items-center gap-1.5 group">
                  <span className="w-0 h-px bg-emerald-400 group-hover:w-3 transition-all duration-300" />
                  Sugerir Mejora
                </Link>
              </li>
              <li>
                <Link href="https://github.com/badouintec/EcoTracker/blob/main/LICENSE" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 transition-colors inline-flex items-center gap-1.5 group">
                  <span className="w-0 h-px bg-emerald-400 group-hover:w-3 transition-all duration-300" />
                  Términos de Uso
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="pt-8 border-t border-slate-700/50 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-slate-500 text-sm">
            <p>&copy; {currentYear} EcoTrack Sonora. Datos disponibles bajo licencia abierta.</p>
          </div>
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2 text-slate-400">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-sm shadow-green-500/50" />
              <span>Sistema Operativo</span>
            </div>
            <div className="text-slate-500">
              Última actualización: {new Date().toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
