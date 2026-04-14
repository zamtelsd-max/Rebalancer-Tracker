import React from 'react';
import { IntegrationMode } from '../../types';

interface Props {
  mode: IntegrationMode;
}

export const IntegrationBanner: React.FC<Props> = ({ mode }) => {
  if (mode === 'standalone') {
    return (
      <div className="bg-orange-50 border-b border-orange-200 px-4 py-2 flex items-center gap-2 text-sm text-orange-800">
        <span className="text-base">⚠️</span>
        <span className="font-medium">Standalone Mode</span>
        <span className="hidden sm:inline">— LUR calculations require Core integration</span>
      </div>
    );
  }
  if (mode === 'tier1') {
    return (
      <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2 flex items-center gap-2 text-sm text-yellow-800">
        <span className="text-base">📦</span>
        <span className="font-medium">Batch Mode</span>
        <span className="hidden sm:inline">— Data updated daily via CSV import</span>
      </div>
    );
  }
  // tier3
  return (
    <div className="bg-green-50 border-b border-green-200 px-4 py-2 flex items-center gap-2 text-sm text-green-800">
      <span className="text-base">✅</span>
      <span className="font-medium">Live Integration</span>
      <span className="hidden sm:inline">— Real-time Core sync active</span>
    </div>
  );
};
