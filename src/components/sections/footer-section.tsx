import Link from 'next/link';

export function FooterSection() {
  return (
    <footer className="bg-gradient-to-r from-slate-800 to-slate-900 text-white py-16 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: 'radial-gradient(circle at 75% 25%, #10b981 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      <div className="container mx-auto px-6 relative">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Brand Section */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">🌍</span>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                EcoTrack Sonora
              </h3>
            </div>
            <p className="text-slate-300 mb-6 max-w-md leading-relaxed">
              Construyendo un Hermosillo más sustentable y resiliente a través del monitoreo ambiental
              colaborativo y la tecnología avanzada de datos climáticos.
            </p>
            <div className="flex gap-4">
              <a
                href="#"
                className="text-slate-400 hover:text-emerald-400 transition-colors text-lg p-2 rounded-lg hover:bg-slate-700"
                aria-label="Twitter"
              >
                𝕏
              </a>
              <a
                href="#"
                className="text-slate-400 hover:text-emerald-400 transition-colors text-lg p-2 rounded-lg hover:bg-slate-700"
                aria-label="Facebook"
              >
                f
              </a>
              <a
                href="https://github.com/badouintec/EcoTracker"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-emerald-400 transition-colors text-lg p-2 rounded-lg hover:bg-slate-700"
                aria-label="GitHub"
              >
                ⌨
              </a>
              <a
                href="#"
                className="text-slate-400 hover:text-emerald-400 transition-colors text-lg p-2 rounded-lg hover:bg-slate-700"
                aria-label="Telegram"
              >
                ✈
              </a>
            </div>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-bold text-lg mb-4 text-white">Recursos</h4>
            <ul className="space-y-2 text-slate-300">
              <li>
                <Link href="#" className="hover:text-emerald-400 transition-colors">
                  API de Datos
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-emerald-400 transition-colors">
                  Documentación
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-emerald-400 transition-colors">
                  Exportar Datos
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-emerald-400 transition-colors">
                  Metodología
                </Link>
              </li>
            </ul>
          </div>

          {/* Community */}
          <div>
            <h4 className="font-bold text-lg mb-4 text-white">Comunidad</h4>
            <ul className="space-y-2 text-slate-300">
              <li>
                <Link href="#" className="hover:text-emerald-400 transition-colors">
                  Colaboradores
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-emerald-400 transition-colors">
                  Reportar Error
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-emerald-400 transition-colors">
                  Sugerir Mejora
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-emerald-400 transition-colors">
                  Términos de Uso
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="pt-8 border-t border-slate-700 flex flex-col md:flex-row justify-between items-center">
          <div className="text-slate-400 text-sm mb-4 md:mb-0">
            <p>&copy; 2025 EcoTrack Sonora. Datos disponibles bajo licencia abierta.</p>
          </div>
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2 text-slate-400">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span>Sistema Operativo</span>
            </div>
            <div className="text-slate-400">
              Última actualización: {new Date().toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
