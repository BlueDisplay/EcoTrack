'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/', label: 'Mapa', icon: '🗺️' },
  { href: '/detector', label: 'Detector', icon: '🤖' },
  { href: '/historico', label: 'Histórico', icon: '📊' },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-gray-200 z-50 safe-area-inset-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`
              flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl min-w-[64px] transition-colors
              ${
                pathname === item.href
                  ? 'text-emerald-600'
                  : 'text-gray-400 hover:text-gray-600'
              }
            `}
          >
            <span className="text-xl">{item.icon}</span>
            <span className="text-[10px] font-medium">{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
