'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/', label: 'Mapa', icon: '🗺️' },
  { href: '/detector', label: 'Detector IA', icon: '🤖' },
  { href: '/historico', label: 'Histórico', icon: '📊' },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <header className="bg-white/90 backdrop-blur-lg border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-gray-800">
          <span className="text-xl">🌍</span>
          <span className="hidden sm:inline">EcoTrack</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`
                px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                ${
                  pathname === item.href
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }
              `}
            >
              <span className="mr-1.5">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
