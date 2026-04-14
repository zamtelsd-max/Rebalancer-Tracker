import React, { useEffect, useState } from 'react';
import api from '../../utils/api';
import { Commission } from '../../types';
import { formatCurrency, formatDate } from '../../utils/helpers';
import { useIntegrationMode } from '../../hooks/useIntegrationMode';

export const AdminCommissions: React.FC = () => {
  const mode = useIntegrationMode();
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState<string | null>(null);

  useEffect(() => {
    api.get<Commission[]>('/commissions')
      .then((r) => setCommissions(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleApprove = async (id: string) => {
    setApproving(id);
    try {
      await api.patch(`/commissions/${id}/approve`);
      setCommissions((prev) => prev.map((c) => c.id === id ? { ...c, status: 'APPROVED' } : c));
    } catch (err) { console.error(err); }
    finally { setApproving(null); }
  };

  if (loading) return <div className="text-center py-12 text-gray-400">Loading…</div>;

  return (
    <div className="space-y-4 max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900">Commission Management</h1>

      {mode === 'standalone' && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 text-sm text-orange-800">
          ⚠️ Commission values are estimates. Accurate LUR-based calculations require Core integration.
        </div>
      )}

      {commissions.length === 0 ? (
        <div className="card text-center py-8 text-gray-400">No commissions generated yet</div>
      ) : (
        <div className="space-y-4">
          {commissions.map((c) => (
            <div key={c.id} className="card border border-gray-200">
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div>
                  <p className="font-bold text-gray-900">{c.masterAgent?.name}</p>
                  <p className="text-sm text-gray-500">{c.masterAgent?.zone}</p>
                  <p className="text-xs text-gray-400">{formatDate(c.periodStart)} – {formatDate(c.periodEnd)}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black text-zamtel-green">{formatCurrency(c.totalCommission)}</p>
                  <span className={
                    c.status === 'APPROVED' ? 'badge-green' :
                    c.status === 'SUBMITTED' ? 'badge-amber' : 'badge-blue'
                  }>
                    {c.status}
                  </span>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                <div className="bg-gray-50 rounded-lg p-2">
                  <p className="text-xs text-gray-500">Distributed</p>
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
                  <p className="text-xs text-gray-500">Util. Bonus</p>
                  <p className="font-semibold">{formatCurrency(c.utilizationBonus)}</p>
                </div>
              </div>

              {c.status === 'SUBMITTED' && (
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => handleApprove(c.id)}
                    disabled={approving === c.id}
                    className="btn-primary text-sm"
                  >
                    {approving === c.id ? 'Approving…' : '✅ Approve'}
                  </button>
                  <button className="btn-danger text-sm">❌ Reject</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
