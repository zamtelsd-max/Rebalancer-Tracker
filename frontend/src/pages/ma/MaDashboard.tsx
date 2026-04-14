import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { Agent, Commission } from '../../types';
import { useIntegrationMode } from '../../hooks/useIntegrationMode';
import { LurBadge } from '../../components/ui/LurBadge';
import { KpiCard } from '../../components/ui/KpiCard';
import { formatCurrency, formatDate } from '../../utils/helpers';

export const MaDashboard: React.FC = () => {
  const mode = useIntegrationMode();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<{ agents: Agent[] }>('/agents?limit=20').then((r) => setAgents(r.data.agents)),
      api.get<Commission[]>('/commissions').then((r) => setCommissions(r.data)),
    ])
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const lurCounts = {
    green: agents.filter((a) => (a.lurScore ?? 0) >= 0.8).length,
    amber: agents.filter((a) => (a.lurScore ?? 0) >= 0.5 && (a.lurScore ?? 0) < 0.8).length,
    orange: agents.filter((a) => (a.lurScore ?? 0) >= 0.3 && (a.lurScore ?? 0) < 0.5).length,
    red: agents.filter((a) => (a.lurScore ?? 0) < 0.3).length,
  };

  const latestCommission = commissions[0];

  if (loading) return <div className="text-center py-12 text-gray-400">Loading…</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Master Agent Portal</h1>

      {/* Commission summary */}
      {latestCommission && (
        <div className="card" style={{ background: 'linear-gradient(135deg, #00843D 0%, #006630 100%)', color: 'white' }}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-green-200 text-xs">Latest Commission</p>
              <p className="text-3xl font-black">{formatCurrency(latestCommission.totalCommission)}</p>
              <p className="text-green-200 text-xs mt-1">
                {formatDate(latestCommission.periodStart)} – {formatDate(latestCommission.periodEnd)}
              </p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
              latestCommission.status === 'APPROVED' ? 'bg-green-200 text-green-900' :
              latestCommission.status === 'SUBMITTED' ? 'bg-yellow-200 text-yellow-900' :
              'bg-white/20 text-white'
            }`}>
              {latestCommission.status}
            </span>
          </div>
        </div>
      )}

      {/* LUR traffic lights */}
      {mode !== 'standalone' && (
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-3">Agent LUR Portfolio</h2>
          <div className="grid grid-cols-4 gap-3">
            <div className="text-center p-3 bg-green-50 rounded-xl border border-green-200">
              <p className="text-2xl font-black text-green-700">{lurCounts.green}</p>
              <p className="text-xs text-green-600 mt-1">🟢 Green</p>
            </div>
            <div className="text-center p-3 bg-yellow-50 rounded-xl border border-yellow-200">
              <p className="text-2xl font-black text-yellow-700">{lurCounts.amber}</p>
              <p className="text-xs text-yellow-600 mt-1">🟡 Amber</p>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-xl border border-orange-200">
              <p className="text-2xl font-black text-orange-700">{lurCounts.orange}</p>
              <p className="text-xs text-orange-600 mt-1">🟠 Orange</p>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-xl border border-red-200">
              <p className="text-2xl font-black text-red-700">{lurCounts.red}</p>
              <p className="text-xs text-red-600 mt-1">🔴 Red</p>
            </div>
          </div>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <KpiCard label="Total Agents" value={agents.length} icon="👥" colour="green" />
        <KpiCard label="Active" value={agents.filter(a => a.status === 'ACTIVE').length} icon="✅" colour="green" />
        <KpiCard label="Flagged" value={agents.filter(a => a.status === 'FLAGGED').length} icon="🚩" colour="red" />
      </div>

      {/* Agent list */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-900">My Agents</h2>
          <Link to="/ma/commission" className="text-sm text-zamtel-green font-medium hover:underline">
            Commission →
          </Link>
        </div>
        <div className="space-y-2">
          {agents.slice(0, 8).map((agent) => (
            <div key={agent.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <div>
                <p className="font-medium text-gray-900 text-sm">{agent.businessName}</p>
                <p className="text-xs text-gray-500">{agent.msisdn}</p>
              </div>
              <div className="flex items-center gap-2">
                <LurBadge lur={agent.lurScore} mode={mode} showValue={false} />
                <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                  agent.status === 'ACTIVE' ? 'bg-green-500' :
                  agent.status === 'FLAGGED' ? 'bg-red-500' : 'bg-gray-400'
                }`} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
