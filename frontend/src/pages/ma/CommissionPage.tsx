import React, { useEffect, useState } from 'react';
import api from '../../utils/api';
import { Commission } from '../../types';
import { useIntegrationMode } from '../../hooks/useIntegrationMode';
import { formatCurrency, formatDate } from '../../utils/helpers';

export const CommissionPage: React.FC = () => {
  const mode = useIntegrationMode();
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<string | null>(null);

  useEffect(() => {
    api.get<Commission[]>('/commissions')
      .then((r) => setCommissions(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (id: string) => {
    setSubmitting(id);
    try {
      await api.post(`/commissions/${id}/submit`);
      setCommissions((prev) => prev.map((c) => c.id === id ? { ...c, status: 'SUBMITTED' } : c));
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(null);
    }
  };

  if (loading) return <div className="text-center py-12 text-gray-400">Loading…</div>;

  return (
    <div className="space-y-5 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900">Commission Statements</h1>

      {mode === 'standalone' && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-sm text-orange-800">
          ⚠️ Commission calculations are estimates in Standalone Mode. Full accuracy requires Core integration.
        </div>
      )}

      {commissions.length === 0 ? (
        <div className="card text-center py-8 text-gray-400">No commission statements yet</div>
      ) : (
        commissions.map((c) => (
          <div key={c.id} className="card border border-gray-200">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-bold text-gray-900 text-lg">{formatCurrency(c.totalCommission)}</p>
                <p className="text-gray-500 text-sm">
                  {formatDate(c.periodStart)} – {formatDate(c.periodEnd)}
                </p>
              </div>
              <span className={
                c.status === 'APPROVED' ? 'badge-green' :
                c.status === 'SUBMITTED' ? 'badge-amber' : 'badge-blue'
              }>
                {c.status}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              <div className="bg-gray-50 rounded-lg p-2">
                <p className="text-xs text-gray-500">Total Distributed</p>
                <p className="font-semibold">{formatCurrency(c.totalDistributed)}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-2">
                <p className="text-xs text-gray-500">Avg LUR</p>
                <p className="font-semibold">
                  {mode === 'standalone' ? <span className="text-orange-500">N/A</span> : `${Math.round(c.lurAvg * 100)}%`}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-2">
                <p className="text-xs text-gray-500">Base Fee</p>
                <p className="font-semibold">{formatCurrency(c.baseFee)}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-2">
                <p className="text-xs text-gray-500">Utilization Bonus</p>
                <p className="font-semibold">{formatCurrency(c.utilizationBonus)}</p>
              </div>
            </div>

            {c.status === 'DRAFT' && (
              <button
                onClick={() => handleSubmit(c.id)}
                disabled={submitting === c.id}
                className="btn-primary mt-4 text-sm"
              >
                {submitting === c.id ? 'Submitting…' : '📤 Submit for Approval'}
              </button>
            )}
          </div>
        ))
      )}
    </div>
  );
};
