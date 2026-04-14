import { IntegrationMode } from '../types';

export function getLurColour(lur: number | null | undefined, mode: IntegrationMode): string {
  if (mode === 'standalone' || lur === null || lur === undefined) return '#60a5fa'; // blue
  if (lur >= 0.80) return '#22c55e'; // green
  if (lur >= 0.50) return '#f59e0b'; // amber
  if (lur >= 0.30) return '#f97316'; // orange
  return '#ef4444'; // red
}

export function getLurLabel(lur: number | null | undefined, mode: IntegrationMode): string {
  if (mode === 'standalone') return 'Pending Core Integration';
  if (lur === null || lur === undefined) return 'Unknown';
  if (lur >= 0.80) return 'Green';
  if (lur >= 0.50) return 'Amber';
  if (lur >= 0.30) return 'Orange';
  return 'Red';
}

export function formatCurrency(amount: number): string {
  return `ZMW ${amount.toLocaleString('en-ZM', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-ZM', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return '—';
  return new Date(date).toLocaleString('en-ZM', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export function getColourForGeofence(colour: string): string {
  const map: Record<string, string> = {
    green: '#22c55e',
    amber: '#f59e0b',
    orange: '#f97316',
    red: '#ef4444',
    blue: '#3b82f6',
    grey: '#9ca3af',
  };
  return map[colour] || '#9ca3af';
}
