'use client';

import { useCallback, useState, useRef } from 'react';
import { StockIcon } from '@/components/ui/stock-icon';

interface ImageUploadProps {
  onFileSelect: (file: File) => void;
  preview: string | null;
}

export function ImageUpload({ onFileSelect, preview }: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith('image/')) {
        onFileSelect(file);
      }
    },
    [onFileSelect],
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        onFileSelect(file);
      }
    },
    [onFileSelect],
  );

  return (
    <div
      className={`
        relative border-2 border-dashed rounded-2xl text-center transition-all duration-300 cursor-pointer
        ${isDragging
          ? 'border-emerald-400 bg-emerald-50 scale-[1.02] shadow-lg shadow-emerald-500/10'
          : 'border-gray-300 hover:border-emerald-300 hover:bg-emerald-50/30'
        }
        ${preview ? 'p-3' : 'p-10'}
      `}
      onClick={() => !preview && inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
    >
      {preview ? (
        <div className="relative group">
          <img
            src={preview}
            alt="Preview"
            className="w-full rounded-xl object-contain max-h-80 transition-all duration-300 group-hover:brightness-95"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300 rounded-xl flex items-center justify-center">
            <button
              onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
              className="opacity-0 group-hover:opacity-100 bg-white/90 backdrop-blur-sm rounded-xl px-4 py-2 shadow-lg hover:bg-white transition-all duration-300 text-sm font-medium text-gray-700 flex items-center gap-2"
              aria-label="Cambiar imagen"
            >
              <StockIcon name="camera" className="w-4 h-4" />
              Cambiar imagen
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className={`mx-auto w-20 h-20 rounded-2xl flex items-center justify-center transition-all duration-300 ${
            isDragging ? 'bg-emerald-200 scale-110' : 'bg-emerald-100'
          }`}>
            <StockIcon name="upload" className={`w-9 h-9 transition-all duration-300 ${isDragging ? 'text-emerald-700 scale-110' : 'text-emerald-500'}`} />
          </div>
          <div>
            <p className="text-gray-700 font-semibold text-lg">
              {isDragging ? 'Suelta la imagen aquí' : 'Arrastra una imagen aquí'}
            </p>
            <p className="text-gray-400 text-sm mt-2">
              o{' '}
              <button
                onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
                className="text-emerald-600 hover:text-emerald-700 font-medium underline underline-offset-2"
              >
                selecciona un archivo
              </button>
            </p>
          </div>
          <div className="flex items-center justify-center gap-4 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <StockIcon name="camera" className="w-3.5 h-3.5" />
              JPG, PNG, WebP
            </span>
            <span className="w-1 h-1 rounded-full bg-gray-300" />
            <span className="flex items-center gap-1">
              <StockIcon name="lab" className="w-3.5 h-3.5" />
              Optimización automática
            </span>
          </div>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleChange}
        className="hidden"
      />
    </div>
  );
}
