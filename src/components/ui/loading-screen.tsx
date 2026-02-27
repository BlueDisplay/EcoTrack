'use client';

import { useState, useEffect } from 'react';
import { StockIcon } from '@/components/ui/stock-icon';

const LOADING_STEPS = [
  'Conectando con servidor',
  'Cargando datos meteorológicos',
  'Preparando mapa interactivo',
];

export function LoadingScreen() {
  const [visible, setVisible] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    const stepInterval = setInterval(() => {
      setStepIndex((prev) => Math.min(prev + 1, LOADING_STEPS.length - 1));
    }, 450);

    const timer = setTimeout(() => {
      setFadeOut(true);
      setTimeout(() => setVisible(false), 500);
    }, 1500);

    return () => {
      clearTimeout(timer);
      clearInterval(stepInterval);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`loading-screen ${fadeOut ? 'opacity-0' : 'opacity-100'}`}
      style={{ transition: 'opacity 0.5s ease-out' }}
    >
      <div className="text-center max-w-sm mx-auto px-6">
        {/* Logo */}
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 shadow-lg shadow-emerald-500/30 mb-5">
            <StockIcon name="globe" className="w-10 h-10 text-white" />
          </div>
          <div className="font-bold text-3xl bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
            EcoTrack
          </div>
          <p className="text-sm text-slate-500 mt-1">Cartografía Participativa</p>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden mb-6">
          <div className="h-full bg-gradient-to-r from-emerald-500 to-green-500 rounded-full loading-progress-bar" />
        </div>

        {/* Loading Steps */}
        <div className="space-y-2.5">
          {LOADING_STEPS.map((step, i) => (
            <div
              key={step}
              className={`flex items-center gap-3 text-sm transition-all duration-300 ${
                i <= stepIndex ? 'opacity-100' : 'opacity-0 translate-y-2'
              }`}
            >
              <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                i < stepIndex
                  ? 'bg-emerald-500'
                  : i === stepIndex
                    ? 'bg-emerald-100 border-2 border-emerald-500'
                    : 'bg-gray-200'
              }`}>
                {i < stepIndex && (
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
                {i === stepIndex && (
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                )}
              </div>
              <span className={`${i <= stepIndex ? 'text-slate-700' : 'text-slate-400'} font-medium`}>
                {step}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
