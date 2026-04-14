import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { useIntegrationMode } from '../../hooks/useIntegrationMode';
import { KpiCard } from '../../components/ui/KpiCard';
import { BurnAlert } from '../../components/ui/BurnAlert';
import { DashboardStats, BurnDownTracker } from '../../types';
import { formatCurrency } from '../../utils/helpers';

export const TdeDashboard: React.FC = () => {
  const mode = useIntegrationMode();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [alerts, setAlerts] = useState<BurnDownTracker[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<DashboardStats>('/reports/dashboard').then((r) => setStats(r.data)),
      api.get<BurnDownTracker[]>('/burndown?alertLevel=RED').then((r) => setAlerts(r.data)),
    ])
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-12 text-gray-400">Loading dashboard…</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">TDE Dashboard</h1>
        <span className="text-sm text-gray-500">Zone Overview</span>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KpiCard label="Total Agents" value={stats?.totalAgents || 0} icon="👥" colour="green" />
        <KpiCard label="Active" value={stats?.activeAgents || 0} icon="✅" colour="green" />
        <KpiCard label="Flagged" value={stats?.flaggedAgents || 0} icon="🚩" colour="red" />
        <KpiCard label="Red Alerts" value={stats?.redAlerts || 0} icon="🔴" colour="red" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <KpiCard
          label="Total Distributed"
          value={formatCurrency(stats?.totalDistributed || 0)}
          icon="💰"
          colour="pink"
        />
        <KpiCard
          label="Total Transactions"
          value={stats?.totalTxns || 0}
          icon="📊"
          colour="blue"
        />
      </div>

      {/* Burn-down alerts */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900 text-lg">🔴 Red Burn-Down Alerts</h2>
          <Link to="/tde/agents" className="text-sm text-zamtel-green font-medium hover:underline">
            View All Agents →
          </Link>
        </div>

        {alerts.length === 0 ? (
          <p className="text-green-600 text-sm">✅ No red alerts — all agents utilizing funds well</p>
        ) : (
          <div className="space-y-3">
            {alerts.slice(0, 8).map((alert) => (
              <div key={alert.id} className="flex items-center justify-between p-3 bg-red-50 rounded-xl border border-red-200">
                <div>
                  <p className="font-medium text-gray-900 text-sm">{alert.agent?.businessName}</p>
                  <p className="text-xs text-gray-500">{alert.agent?.msisdn}</p>
                </div>
                <BurnAlert level={alert.alertLevel} pct={alert.burnPct} isOverdue={alert.isOverdue} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* LUR note for standalone */}
      {mode === 'standalone' && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-sm text-orange-800">
          <strong>⚠️ Standalone Mode:</strong> LUR scores, burn-down percentages, and fraud detection require Core integration.
          CAS scores are calculated from TRN submissions and observation reports.
        </div>
      )}
    </div>
  );
};
