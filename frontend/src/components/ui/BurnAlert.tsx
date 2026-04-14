import React from 'react';

interface Props {
  level: string;
  pct: number;
  isOverdue?: boolean;
}

export const BurnAlert: React.FC<Props> = ({ level, pct, isOverdue }) => {
  const cls = level === 'GREEN' ? 'badge-green' :
    level === 'YELLOW' ? 'badge-amber' :
    level === 'ORANGE' ? 'badge-orange' : 'badge-red';

  return (
    <div className="flex items-center gap-2">
      <span className={cls}>{level}</span>
      <span className="text-sm text-gray-600">{Math.round(pct)}% utilized</span>
      {isOverdue && <span className="badge-red">OVERDUE</span>}
    </div>
  );
};
