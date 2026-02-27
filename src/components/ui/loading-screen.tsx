'use client';

import { useState, useEffect } from 'react';
import { StockIcon } from '@/components/ui/stock-icon';

export function LoadingScreen() {
  const [visible, setVisible] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFadeOut(true);
      setTimeout(() => setVisible(false), 500);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`loading-screen ${fadeOut ? 'opacity-0' : 'opacity-100'}`}
      style={{ transition: 'opacity 0.5s ease-out' }}
    >
      <div className="text-center">
        <div className="mb-8 animate-pulse">
          <span className="text-6xl block mb-4 flex justify-center" style={{ filter: 'drop-shadow(0 0 10px rgba(34, 197, 94, 0.5))' }}>
            <StockIcon name="globe" className="w-14 h-14" />
          </span>
          <div className="font-bold text-3xl bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
            EcoTrack
          </div>
        </div>
        <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-slate-800 mb-2">Inicializando Sistema</h2>
        <p className="text-slate-600">Cargando datos meteorológicos y configuración del mapa...</p>
      </div>
    </div>
  );
}
