import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../utils/api';
import { Agent, BurnDownTracker } from '../../types';
import { useIntegrationMode } from '../../hooks/useIntegrationMode';
import { LurBar, LurBadge } from '../../components/ui/LurBadge';
import { BurnAlert } from '../../components/ui/BurnAlert';
import { formatCurrency, formatDateTime } from '../../utils/helpers';

export const AgentDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const mode = useIntegrationMode();
  const [agent, setAgent] = useState<Agent & {
    rebalanceTransactions: { id: string; dispensedAt: string | null; cashAmount: number; floatAmount: number; otpVerified: boolean }[];
    burnDownTrackers: BurnDownTracker[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/agents/${id}`)
      .then((r) => setAgent(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="text-center py-12 text-gray-400">Loading…</div>;
  if (!agent) return <div className="text-center py-12 text-red-500">Agent not found</div>;

  return (
    <div className="space-y-5 max-w-3xl">
      {/* Header */}
      <div className="card">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{agent.businessName}</h1>
            <p className="text-gray-500 font-mono">{agent.msisdn}</p>
            <div className="flex gap-2 mt-2 flex-wrap">
              <span className={agent.status === 'ACTIVE' ? 'badge-green' : 'badge-red'}>
                {agent.status}
              </span>
              {agent.requestLocked && <span className="badge-red">🔒 Locked</span>}
              <LurBadge lur={agent.lurScore} mode={mode} />
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">CAS Score</p>
            <p className="text-3xl font-black" style={{
              color: (agent.casScore ?? 0) >= 80 ? '#22c55e' :
                (agent.casScore ?? 0) >= 50 ? '#f59e0b' :
                (agent.casScore ?? 0) >= 30 ? '#f97316' : '#ef4444'
            }}>
              {agent.casScore ?? '—'}
            </p>
            <p className="text-xs text-gray-400">/ 100</p>
          </div>
        </div>

        <div className="mt-4">
          <p className="text-xs text-gray-500 mb-1">LUR Score</p>
          <LurBar lur={agent.lurScore} mode={mode} />
        </div>
      </div>

      {/* Balances */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card bg-green-50 border-green-100">
          <p className="text-xs text-green-600">Float Balance</p>
          <p className="text-xl font-bold text-green-900">{formatCurrency(agent.floatBalance)}</p>
        </div>
        <div className="card bg-blue-50 border-blue-100">
          <p className="text-xs text-blue-600">Cash Balance</p>
          <p className="text-xl font-bold text-blue-900">{formatCurrency(agent.cashBalance)}</p>
        </div>
      </div>

      {/* Burn-down trackers */}
      {agent.burnDownTrackers.length > 0 && (
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-3">🔥 Burn-Down Trackers</h2>
          <div className="space-y-3">
            {agent.burnDownTrackers.map((bt) => (
              <div key={bt.id} className="p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <BurnAlert level={bt.alertLevel} pct={bt.burnPct} isOverdue={bt.isOverdue} />
                  <span className="text-xs text-gray-500">{bt.status}</span>
                </div>
                <div className="bg-gray-100 rounded-full h-2">
                  <div
                    className="h-2 rounded-full"
                    style={{
                      width: `${Math.min(bt.burnPct, 100)}%`,
                      backgroundColor: bt.alertLevel === 'GREEN' ? '#22c55e' :
                        bt.alertLevel === 'YELLOW' ? '#f59e0b' :
                        bt.alertLevel === 'ORANGE' ? '#f97316' : '#ef4444',
                    }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Initial: {formatCurrency(bt.initialAmount)}</span>
                  <span>Utilized: {formatCurrency(bt.currentUtilized)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transaction history */}
      <div className="card">
        <h2 className="font-semibold text-gray-900 mb-3">📋 Recent Transactions</h2>
        {agent.rebalanceTransactions.length === 0 ? (
          <p className="text-gray-400 text-sm">No transactions yet</p>
        ) : (
          <div className="space-y-2">
            {agent.rebalanceTransactions.map((txn) => (
              <div key={txn.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div>
                  <p className="text-xs text-gray-500">{formatDateTime(txn.dispensedAt)}</p>
                  <p className="text-sm font-medium">
                    Cash: {formatCurrency(txn.cashAmount)} · Float: {formatCurrency(txn.floatAmount)}
                  </p>
                </div>
                <div className="flex gap-2">
                  {txn.otpVerified && <span className="badge-green text-xs">OTP ✓</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
