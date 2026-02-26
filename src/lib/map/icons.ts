// ─── Leaflet marker icons by severity ───────────────────────────────────────
// This module is client-only (Leaflet requires the DOM)

import L from 'leaflet';

const SEVERITY_COLORS: Record<string, string> = {
  critico: '#dc2626',
  alto: '#ef4444',
  medio: '#f59e0b',
  bajo: '#22c55e',
};

const STATUS_COLORS: Record<string, string> = {
  enviado: '#9ca3af',
  revision: '#fbbf24',
  atendido: '#22c55e',
};

function createSvgIcon(color: string, size: number = 32): L.DivIcon {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" width="${size}" height="${size}">
      <path d="M12 0C7.03 0 3 4.03 3 9c0 6.75 9 15 9 15s9-8.25 9-15c0-4.97-4.03-9-9-9zm0 12.75c-2.07 0-3.75-1.68-3.75-3.75S9.93 5.25 12 5.25s3.75 1.68 3.75 3.75-1.68 3.75-3.75 3.75z"/>
    </svg>
  `;

  return L.divIcon({
    html: svg,
    className: 'custom-marker',
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  });
}

export function getIconBySeverity(gravedad: string | null | undefined): L.DivIcon {
  const key = gravedad?.toLowerCase() || 'bajo';
  const color = SEVERITY_COLORS[key] || SEVERITY_COLORS.bajo;
  return createSvgIcon(color);
}

export function getIconByStatus(status: string | null | undefined): L.DivIcon {
  const key = status?.toLowerCase() || 'enviado';
  const color = STATUS_COLORS[key] || STATUS_COLORS.enviado;
  return createSvgIcon(color);
}

// Default Leaflet icon fix (broken in Next.js/Webpack by default)
export function fixLeafletDefaultIcon() {
  // @ts-expect-error — Leaflet's _getIconUrl is not in types
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  });
}
