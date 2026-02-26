'use client';

import { GeoJSON, useMap } from 'react-leaflet';
import { useState, useEffect } from 'react';
import type { GeoJsonObject } from 'geojson';

interface AGEBLayerProps {
  visible?: boolean;
  type?: 'urbanas' | 'rurales' | 'municipio';
}

const FILE_MAP: Record<string, string> = {
  urbanas: '/geojson/AGEB-Urbanas.geojson',
  rurales: '/geojson/AGEB-Rurales.geojson',
  municipio: '/geojson/AGEB-Municipio.geojson',
};

const STYLE_MAP: Record<string, { color: string; fillOpacity: number }> = {
  urbanas: { color: '#06b6d4', fillOpacity: 0.1 },
  rurales: { color: '#a855f7', fillOpacity: 0.08 },
  municipio: { color: '#f59e0b', fillOpacity: 0.05 },
};

export function AGEBLayer({ visible = false, type = 'urbanas' }: AGEBLayerProps) {
  const [data, setData] = useState<GeoJsonObject | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && !data && !loading) {
      setLoading(true);
      fetch(FILE_MAP[type])
        .then((r) => r.json())
        .then((json) => {
          setData(json);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [visible, data, loading, type]);

  if (!visible || !data) return null;

  const style = STYLE_MAP[type] || STYLE_MAP.urbanas;

  return (
    <GeoJSON
      data={data}
      style={{
        color: style.color,
        weight: 1,
        fillOpacity: style.fillOpacity,
      }}
    />
  );
}
