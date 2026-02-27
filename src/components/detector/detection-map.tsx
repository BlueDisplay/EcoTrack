'use client';

import { useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import { fixLeafletDefaultIcon } from '@/lib/map/icons';

import 'leaflet/dist/leaflet.css';

interface DetectionMapProps {
  /** EXIF / user-picked location — null if unknown */
  location: { lat: number; lon: number } | null;
  /** Whether the image is loaded (so we show the map prompt when appropriate) */
  hasImage?: boolean;
  /** Whether the EXIF data was present in the image */
  hasExif?: boolean;
  /** Called when user drags the pin to set location manually */
  onLocationChange?: (coords: { lat: number; lon: number }) => void;
}

const DEFAULT_CENTER: L.LatLngExpression = [29.072967, -110.955919]; // Hermosillo

export function DetectionMap({
  location,
  hasImage = false,
  hasExif = false,
  onLocationChange,
}: DetectionMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    fixLeafletDefaultIcon();
  }, []);

  // Stable callback ref for drag handler
  const onLocationChangeRef = useRef(onLocationChange);
  onLocationChangeRef.current = onLocationChange;

  const handleMarkerDrag = useCallback((e: L.LeafletEvent) => {
    const latlng = (e.target as L.Marker).getLatLng();
    onLocationChangeRef.current?.({ lat: latlng.lat, lon: latlng.lng });
  }, []);

  // Initialise map once
  useEffect(() => {
    if (!containerRef.current) return;

    if (!mapRef.current) {
      mapRef.current = L.map(containerRef.current).setView(DEFAULT_CENTER, 13);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(mapRef.current);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Sync marker whenever location changes
  useEffect(() => {
    if (!mapRef.current) return;

    // Remove previous marker
    if (markerRef.current) {
      markerRef.current.remove();
      markerRef.current = null;
    }

    if (location) {
      // has a location (from EXIF or user-picked) — show marker
      const isDraggable = !hasExif; // only draggable if user is setting it manually
      mapRef.current.setView([location.lat, location.lon], 16, { animate: true });
      markerRef.current = L.marker([location.lat, location.lon], { draggable: isDraggable })
        .addTo(mapRef.current)
        .bindPopup(
          isDraggable
            ? `<div class="text-xs"><strong>Arrastra el pin</strong> a la ubicación correcta<br/>${location.lat.toFixed(6)}, ${location.lon.toFixed(6)}</div>`
            : `${location.lat.toFixed(6)}, ${location.lon.toFixed(6)}`,
        )
        .openPopup();

      if (isDraggable) {
        markerRef.current.on('dragend', handleMarkerDrag);
        // Update popup on drag
        markerRef.current.on('drag', (e: L.LeafletEvent) => {
          const ll = (e.target as L.Marker).getLatLng();
          (e.target as L.Marker).setPopupContent(
            `<div class="text-xs"><strong>Arrastra el pin</strong> a la ubicación correcta<br/>${ll.lat.toFixed(6)}, ${ll.lng.toFixed(6)}</div>`,
          );
        });
      }
    } else if (hasImage && !hasExif) {
      // No location yet — place a draggable marker at center for user to set
      mapRef.current.setView(DEFAULT_CENTER, 13, { animate: true });
      markerRef.current = L.marker(DEFAULT_CENTER, { draggable: true })
        .addTo(mapRef.current)
        .bindPopup(
          `<div class="text-xs"><strong>Arrastra el pin</strong> a donde fue tomada la foto</div>`,
        )
        .openPopup();
      markerRef.current.on('dragend', handleMarkerDrag);
      markerRef.current.on('drag', (e: L.LeafletEvent) => {
        const ll = (e.target as L.Marker).getLatLng();
        (e.target as L.Marker).setPopupContent(
          `<div class="text-xs"><strong>Arrastra el pin</strong> a la ubicación correcta<br/>${ll.lat.toFixed(6)}, ${ll.lng.toFixed(6)}</div>`,
        );
      });
    }
  }, [location, hasImage, hasExif, handleMarkerDrag]);

  // Determine banner text
  const showNoExifBanner = hasImage && !hasExif;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-3 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-700">
          Ubicación de la Imagen
        </h3>
        {location && hasExif ? (
          <p className="text-xs text-gray-400 font-mono mt-1">
            {location.lat.toFixed(6)}, {location.lon.toFixed(6)} (EXIF)
          </p>
        ) : location && !hasExif ? (
          <p className="text-xs text-emerald-600 font-mono mt-1">
            {location.lat.toFixed(6)}, {location.lon.toFixed(6)} (manual)
          </p>
        ) : !hasImage ? (
          <p className="text-xs text-gray-400 mt-1">
            Sube una imagen para ver la ubicación
          </p>
        ) : null}
      </div>

      {/* No-EXIF warning banner */}
      {showNoExifBanner && (
        <div className="px-3 py-2 bg-amber-50 border-b border-amber-100 flex items-start gap-2">
          <svg className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="text-xs text-amber-700 leading-relaxed">
            <strong>Imagen sin metadatos de localización.</strong>{' '}
            Favor de ubicar dónde fue tomada moviendo el pin en el mapa.
          </p>
        </div>
      )}

      <div ref={containerRef} className="h-48 w-full" />
    </div>
  );
}
