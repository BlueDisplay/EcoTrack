'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { fixLeafletDefaultIcon } from '@/lib/map/icons';

import 'leaflet/dist/leaflet.css';

interface DetectionMapProps {
  location: { lat: number; lon: number } | null;
}

export function DetectionMap({ location }: DetectionMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    fixLeafletDefaultIcon();
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    if (!mapRef.current) {
      mapRef.current = L.map(containerRef.current).setView(
        [29.072967, -110.955919],
        13,
      );
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(mapRef.current);
    }

    return () => {
      // Cleanup on unmount
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;

    // Remove previous marker
    if (markerRef.current) {
      markerRef.current.remove();
      markerRef.current = null;
    }

    if (location) {
      mapRef.current.setView([location.lat, location.lon], 16, {
        animate: true,
      });
      markerRef.current = L.marker([location.lat, location.lon])
        .addTo(mapRef.current)
        .bindPopup(
          `📍 ${location.lat.toFixed(6)}, ${location.lon.toFixed(6)}`,
        )
        .openPopup();
    }
  }, [location]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-3 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-700">
          📍 Ubicación de la Imagen
        </h3>
        {location ? (
          <p className="text-xs text-gray-400 font-mono mt-1">
            {location.lat.toFixed(6)}, {location.lon.toFixed(6)}
          </p>
        ) : (
          <p className="text-xs text-gray-400 mt-1">
            Sin datos GPS en la imagen
          </p>
        )}
      </div>
      <div ref={containerRef} className="h-48 w-full" />
    </div>
  );
}
