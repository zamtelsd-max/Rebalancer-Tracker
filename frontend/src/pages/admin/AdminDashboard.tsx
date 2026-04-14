import React, { useEffect, useState } from 'react';
import api from '../../utils/api';
import { useIntegrationMode } from '../../hooks/useIntegrationMode';
import { KpiCard } from '../../components/ui/KpiCard';
import { GeofenceMap } from '../../components/map/GeofenceMap';
import { DashboardStats, HeatmapPoint } from '../../types';
import { formatCurrency } from '../../utils/helpers';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend,
} from 'recharts';

// Mock chart data for visual demo
const distributionData = [
  { month: 'Jan', distributed: 320000, utilized: 240000 },
  { month: 'Feb', distributed: 380000, utilized: 290000 },
  { month: 'Mar', distributed: 450000, utilized: 360000 },
  { month: 'Apr', distributed: 420000, utilized: 310000 },
  { month: 'May', distributed: 510000, utilized: 420000 },
  { month: 'Jun', distributed: 490000, utilized: 400000 },
];

const agentScoreData = [
  { name: 'Green', value: 7, fill: '#22c55e' },
  { name: 'Amber', value: 6, fill: '#f59e0b' },
  { name: 'Orange', value: 4, fill: '#f97316' },
  { name: 'Red', value: 3, fill: '#ef4444' },
];

export const AdminDashboard: React.FC = () => {
  const mode = useIntegrationMode();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [heatmapPoints, setHeatmapPoints] = useState<HeatmapPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUnserviced, setShowUnserviced] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<DashboardStats>('/reports/dashboard').then((r) => setStats(r.data)),
      api.get<HeatmapPoint[]>('/reports/heatmap').then((r) => setHeatmapPoints(r.data)),
    ])
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Network Dashboard</h1>
          <p className="text-sm text-gray-500">ZLMS — Zamtel Liquidity Management System</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400">Last updated</p>
          <p className="text-sm font-medium text-gray-700">{new Date().toLocaleTimeString('en-ZM')}</p>
        </div>
      </div>

      {/* KPI row */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="card h-24 animate-pulse bg-gray-50" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <KpiCard label="Total Agents" value={stats?.totalAgents || 0} icon="👥" colour="green" />
          <KpiCard label="Active" value={stats?.activeAgents || 0} icon="✅" colour="green" />
          <KpiCard label="Flagged" value={stats?.flaggedAgents || 0} icon="🚩" colour="red" />
          <KpiCard label="Transactions" value={stats?.totalTxns || 0} icon="📊" colour="blue" />
          <KpiCard label="Red Alerts" value={stats?.redAlerts || 0} icon="🔴" colour="red" />
          <KpiCard
            label="Distributed"
            value={`ZMW ${((stats?.totalDistributed || 0) / 1000).toFixed(0)}K`}
            icon="💰"
            colour="pink"
          />
        </div>
      )}

      {/* Geofence map — SERVICED AREAS */}
      <div className="card">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div>
            <h2 className="font-semibold text-gray-900 text-lg">
              🗺️ Serviced Areas — Lusaka Network
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Geofence circles show visited agent locations. Colour = LUR/CAS performance.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={showUnserviced}
                onChange={(e) => setShowUnserviced(e.target.checked)}
                className="rounded"
              />
              Show unserviced
            </label>
            {/* Map legend */}
            <div className="flex gap-2 text-xs flex-wrap">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-500"></span>≥80%</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-yellow-500"></span>50-79%</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-orange-500"></span>30-49%</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-500"></span>Flagged</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-blue-500"></span>Standalone</span>
            </div>
          </div>
        </div>
        <GeofenceMap points={heatmapPoints} height="480px" showUnserviced={showUnserviced} />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribution vs Utilization */}
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">Distribution vs Utilization (ZMW)</h2>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={distributionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
              <Legend />
              <Line type="monotone" dataKey="distributed" stroke="#00843D" strokeWidth={2.5} dot={false} name="Distributed" />
              <Line type="monotone" dataKey="utilized" stroke="#E4007C" strokeWidth={2.5} dot={false} name="Utilized" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Agent performance */}
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">Agent LUR Distribution</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={agentScoreData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="value" name="Agents">
                {agentScoreData.map((entry, i) => (
                  <React.Fragment key={i}>
                    {/* @ts-ignore */}
                    <rect fill={entry.fill} />
                  </React.Fragment>
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
