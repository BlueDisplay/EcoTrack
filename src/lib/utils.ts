import { clsx, type ClassValue } from 'clsx';

// ─── Lightweight clsx (no dependency needed for this simple version) ───────

export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

// ─── Date formatting ────────────────────────────────────────────────────────

export function formatDate(dateStr: string | Date | null | undefined): string {
  if (!dateStr) return 'Sin fecha';
  const d = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  if (isNaN(d.getTime())) return 'Fecha inválida';
  return d.toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatDateShort(dateStr: string | Date | null | undefined): string {
  if (!dateStr) return '—';
  const d = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function timeAgo(dateStr: string | Date): string {
  const d = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000);

  const intervals: [number, string][] = [
    [31536000, 'año'],
    [2592000, 'mes'],
    [86400, 'día'],
    [3600, 'hora'],
    [60, 'minuto'],
  ];

  for (const [secs, label] of intervals) {
    const count = Math.floor(seconds / secs);
    if (count >= 1) {
      return `hace ${count} ${label}${count > 1 ? (label === 'mes' ? 'es' : 's') : ''}`;
    }
  }

  return 'hace un momento';
}

// ─── Severity helpers ───────────────────────────────────────────────────────

export const SEVERITY_CONFIG = {
  critico: { label: 'Crítico', color: '#dc2626', bg: 'bg-red-100', text: 'text-red-700', icon: 'fa-solid fa-triangle-exclamation' },
  alto: { label: 'Alto', color: '#ef4444', bg: 'bg-orange-100', text: 'text-orange-700', icon: 'fa-solid fa-exclamation-circle' },
  medio: { label: 'Medio', color: '#f59e0b', bg: 'bg-yellow-100', text: 'text-yellow-700', icon: 'fa-solid fa-exclamation' },
  bajo: { label: 'Bajo', color: '#22c55e', bg: 'bg-green-100', text: 'text-green-700', icon: 'fa-solid fa-info-circle' },
} as const;

export type SeverityKey = keyof typeof SEVERITY_CONFIG;

export function getSeverityConfig(gravedad: string | null | undefined) {
  const key = (gravedad?.toLowerCase() || 'bajo') as SeverityKey;
  return SEVERITY_CONFIG[key] || SEVERITY_CONFIG.bajo;
}

// ─── Status helpers ─────────────────────────────────────────────────────────

export const STATUS_CONFIG = {
  enviado: { label: 'Enviado', color: '#9ca3af', bg: 'bg-gray-100', text: 'text-gray-600' },
  revision: { label: 'En Revisión', color: '#fbbf24', bg: 'bg-yellow-100', text: 'text-yellow-600' },
  atendido: { label: 'Atendido', color: '#22c55e', bg: 'bg-green-100', text: 'text-green-600' },
} as const;

export type StatusKey = keyof typeof STATUS_CONFIG;

export function getStatusConfig(status: string | null | undefined) {
  const key = (status?.toLowerCase() || 'enviado') as StatusKey;
  return STATUS_CONFIG[key] || STATUS_CONFIG.enviado;
}

// ─── Number formatting ──────────────────────────────────────────────────────

export function formatNumber(n: number): string {
  return n.toLocaleString('es-MX');
}
