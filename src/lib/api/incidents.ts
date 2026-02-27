import type { Incident } from '@/lib/db/schema';

const API_BASE = '';

// ─── Incidents (news-derived, feeds the map) ────────────────────────────────

export async function fetchIncidents(limit = 500): Promise<Incident[]> {
  const res = await fetch(`${API_BASE}/api/incidents?limit=${limit}`);
  if (res.status === 503) {
    // DB not configured — return empty gracefully
    return [];
  }
  if (!res.ok) {
    throw new Error(`Failed to fetch incidents: ${res.status}`);
  }
  return res.json();
}
