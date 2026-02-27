'use client';

import { useEffect, useRef } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
  GeoJSON,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import type { Incident } from '@/lib/db/schema';
import { getIconBySeverity, fixLeafletDefaultIcon } from '@/lib/map/icons';
import { getSeverityConfig, getStatusConfig, formatDate } from '@/lib/utils';

import 'leaflet/dist/leaflet.css';

// ─── Props ──────────────────────────────────────────────────────────────────

interface EcoTrackMapProps {
  incidents: Incident[];
  onMapClick?: (lat: number, lng: number) => void;
  onMarkerClick?: (incident: Incident) => void;
  selectedId?: string | null;
  onMapReady?: (map: L.Map) => void;
}

// ─── Map Click Handler ──────────────────────────────────────────────────────

function MapClickHandler({
  onClick,
}: {
  onClick: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      onClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// ─── Auto-Pan to selected marker ────────────────────────────────────────────

function AutoPan({ lat, lon }: { lat: number; lon: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lon], map.getZoom(), { animate: true });
  }, [lat, lon, map]);
  return null;
}

// ─── Map Ready Handler ──────────────────────────────────────────────────────

function MapReadyHandler({ onReady }: { onReady: (map: L.Map) => void }) {
  const map = useMap();
  useEffect(() => {
    onReady(map);
  }, [map, onReady]);
  return null;
}

// ─── Incident Marker ────────────────────────────────────────────────────────

function IncidentMarker({
  incident,
  onClick,
}: {
  incident: Incident;
  onClick?: () => void;
}) {
  const severity = getSeverityConfig(incident.gravedad);
  const status = getStatusConfig(incident.status);

  return (
    <Marker
      position={[incident.lat, incident.lon]}
      icon={getIconBySeverity(incident.gravedad)}
      eventHandlers={{ click: () => onClick?.() }}
    >
      <Popup maxWidth={300} className="ecotrack-popup">
        <div className="p-2">
          <h3 className="font-bold text-sm mb-1">{incident.titulo}</h3>
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-medium ${severity.bg} ${severity.text}`}
            >
              {severity.label}
            </span>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-medium ${status.bg} ${status.text}`}
            >
              {status.label}
            </span>
          </div>
          {incident.colonia && (
            <p className="text-xs text-gray-500">📍 {incident.colonia}</p>
          )}
          {incident.afectacionesReportadas && (
            <p className="text-xs text-gray-600 mt-1 line-clamp-2">
              {incident.afectacionesReportadas}
            </p>
          )}
          <p className="text-xs text-gray-400 mt-1">
            {formatDate(incident.fechaEvento)}
          </p>
        </div>
      </Popup>
    </Marker>
  );
}

// ─── Main Map Component ─────────────────────────────────────────────────────

export function EcoTrackMap({
  incidents,
  onMapClick,
  onMarkerClick,
  selectedId,
  onMapReady,
}: EcoTrackMapProps) {
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    fixLeafletDefaultIcon();
  }, []);

  const selectedIncident = selectedId
    ? incidents.find((i) => i.id === selectedId)
    : null;

  return (
    <MapContainer
      center={[29.072967, -110.955919]}
      zoom={13}
      className="h-full w-full rounded-xl z-0"
      ref={mapRef}
      zoomControl={true}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />

      {incidents.map((incident) => (
        <IncidentMarker
          key={incident.id}
          incident={incident}
          onClick={() => onMarkerClick?.(incident)}
        />
      ))}

      {onMapClick && <MapClickHandler onClick={onMapClick} />}

      {onMapReady && <MapReadyHandler onReady={onMapReady} />}

      {selectedIncident && (
        <AutoPan lat={selectedIncident.lat} lon={selectedIncident.lon} />
      )}
    </MapContainer>
  );
}

export default EcoTrackMap;
