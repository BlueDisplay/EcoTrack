'use client';

import { useCallback, useState, useRef } from 'react';

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
        relative border-2 border-dashed rounded-xl p-8 text-center transition-all
        ${isDragging ? 'border-emerald-400 bg-emerald-50' : 'border-gray-300 hover:border-emerald-300 hover:bg-gray-50'}
        ${preview ? 'p-2' : 'p-8'}
      `}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
    >
      {preview ? (
        <div className="relative">
          <img
            src={preview}
            alt="Preview"
            className="w-full rounded-lg object-contain max-h-80"
          />
          <button
            onClick={() => inputRef.current?.click()}
            className="absolute top-2 right-2 bg-white/80 backdrop-blur-sm rounded-full p-2 hover:bg-white transition-colors shadow-sm"
            aria-label="Cambiar imagen"
          >
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="mx-auto w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <div>
            <p className="text-gray-700 font-medium">
              Arrastra una imagen aquí
            </p>
            <p className="text-gray-400 text-sm mt-1">
              o{' '}
              <button
                onClick={() => inputRef.current?.click()}
                className="text-emerald-600 hover:text-emerald-700 underline"
              >
                selecciona un archivo
              </button>
            </p>
            <p className="text-gray-300 text-xs mt-2">
              JPG, PNG o WebP — máximo 10 MB
            </p>
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
