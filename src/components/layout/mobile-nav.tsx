'use client';

import { usePathname } from 'next/navigation';
import { StockIcon, type StockIconName } from '@/components/ui/stock-icon';

const NAV_ITEMS = [
  { label: 'Mapa', icon: 'map' as StockIconName, scrollTo: 'mapa-interactivo' },
  { label: 'Estadísticas', icon: 'chart' as StockIconName, scrollTo: 'estadisticas' },
  { label: '', icon: 'target' as StockIconName, scrollTo: 'mapa-interactivo', special: true },
  { label: 'Capas', icon: 'grid' as StockIconName, scrollTo: 'mapa-interactivo' },
  { label: 'Histórico', icon: 'clock' as StockIconName, scrollTo: 'historico' },
];

export function MobileNav() {
  const pathname = usePathname();

  const handleClick = (scrollTo: string) => {
    if (pathname === '/') {
      document.getElementById(scrollTo)?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-30 safe-area-bottom">
      <div className="flex justify-around items-center py-2">
        {NAV_ITEMS.map((item, i) => {
          if (item.special) {
            return (
              <button
                key={i}
                onClick={() => handleClick(item.scrollTo)}
                className="flex flex-col items-center -mt-6"
                aria-label="Añadir reporte"
              >
                <div className="bg-gradient-to-r from-emerald-500 to-green-600 rounded-full p-3.5 shadow-lg hover:shadow-xl transition-shadow">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
              </button>
            );
          }
          return (
            <button
              key={i}
              onClick={() => handleClick(item.scrollTo)}
              className="flex flex-col items-center gap-0.5 px-2 py-1 text-gray-500 hover:text-emerald-600 transition-colors"
            >
              <span className="text-lg">
                <StockIcon name={item.icon} className="w-5 h-5" />
              </span>
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
