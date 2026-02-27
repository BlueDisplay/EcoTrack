'use client';

import { useState } from 'react';

export interface LabelOption {
  value: string;
  label: string;
  emoji: string;
  color: string;
}

export const DETECTION_LABELS: LabelOption[] = [
  { value: 'basura', label: 'Basura / Plástico', emoji: '🗑️', color: 'bg-red-100 text-red-700 border-red-200 hover:bg-red-200' },
  { value: 'escombro', label: 'Escombro', emoji: '🧱', color: 'bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-200' },
  { value: 'tire', label: 'Neumático', emoji: '🛞', color: 'bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200' },
  { value: 'agua estancada', label: 'Agua Estancada', emoji: '💧', color: 'bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200' },
  { value: 'contaminacion', label: 'Contaminación', emoji: '☣️', color: 'bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-200' },
  { value: 'otro', label: 'Otro', emoji: '📌', color: 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200' },
];

interface LabelPickerProps {
  onSelect: (label: string) => void;
  onCancel: () => void;
}

export function LabelPicker({ onSelect, onCancel }: LabelPickerProps) {
  const [customLabel, setCustomLabel] = useState('');
  const [showCustom, setShowCustom] = useState(false);

  return (
    <div className="animate-in fade-in slide-in-from-top-2 duration-200">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-5 max-w-sm mx-auto">
        <div className="text-center mb-4">
          <h4 className="font-bold text-gray-800 text-lg">¿Qué detectaste?</h4>
          <p className="text-sm text-gray-500 mt-1">Selecciona la categoría del objeto marcado</p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {DETECTION_LABELS.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                if (option.value === 'otro') {
                  setShowCustom(true);
                } else {
                  onSelect(option.value);
                }
              }}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all active:scale-95 ${option.color}`}
            >
              <span className="text-base">{option.emoji}</span>
              <span>{option.label}</span>
            </button>
          ))}
        </div>

        {showCustom && (
          <div className="mt-3 flex gap-2">
            <input
              type="text"
              value={customLabel}
              onChange={(e) => setCustomLabel(e.target.value)}
              placeholder="Nombre del objeto..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && customLabel.trim()) {
                  onSelect(customLabel.trim().toLowerCase());
                }
              }}
            />
            <button
              onClick={() => {
                if (customLabel.trim()) {
                  onSelect(customLabel.trim().toLowerCase());
                }
              }}
              disabled={!customLabel.trim()}
              className="px-4 py-2 bg-emerald-500 text-white rounded-xl text-sm font-medium hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              OK
            </button>
          </div>
        )}

        <button
          onClick={onCancel}
          className="w-full mt-3 px-3 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
