import React from 'react';
import { IntegrationMode } from '../../types';

interface Props {
  lur: number | null | undefined;
  mode: IntegrationMode;
  showValue?: boolean;
}

export const LurBadge: React.FC<Props> = ({ lur, mode, showValue = true }) => {
  if (mode === 'standalone') {
    return (
      <span className="badge-blue">
        Pending Core
      </span>
    );
  }

  if (lur === null || lur === undefined) {
    return <span className="badge-blue">Unknown</span>;
  }

  const pct = Math.round(lur * 100);
  const label = pct >= 80 ? 'Green' : pct >= 50 ? 'Amber' : pct >= 30 ? 'Orange' : 'Red';
  const cls = pct >= 80 ? 'badge-green' : pct >= 50 ? 'badge-amber' : pct >= 30 ? 'badge-orange' : 'badge-red';

  return (
    <span className={cls}>
      {label}{showValue ? ` (${pct}%)` : ''}
    </span>
  );
};

interface BarProps {
  lur: number | null | undefined;
  mode: IntegrationMode;
}

export const LurBar: React.FC<BarProps> = ({ lur, mode }) => {
  if (mode === 'standalone') {
    return (
      <div className="w-full bg-gray-100 rounded-full h-3 flex items-center justify-center">
        <span className="text-xs text-gray-400">Pending Core Integration</span>
      </div>
    );
  }

  const pct = lur !== null && lur !== undefined ? Math.round(lur * 100) : 0;
  const colour = pct >= 80 ? '#22c55e' : pct >= 50 ? '#f59e0b' : pct >= 30 ? '#f97316' : '#ef4444';

  return (
    <div className="w-full bg-gray-100 rounded-full h-3 relative overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${pct}%`, backgroundColor: colour }}
      />
      <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-gray-700">
        {pct}%
      </span>
    </div>
  );
};
