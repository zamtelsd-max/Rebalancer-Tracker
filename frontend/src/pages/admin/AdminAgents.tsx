import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { Agent } from '../../types';
import { useIntegrationMode } from '../../hooks/useIntegrationMode';
import { LurBadge } from '../../components/ui/LurBadge';
import { formatCurrency, formatDate } from '../../utils/helpers';

export const AdminAgents: React.FC = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const mode = useIntegrationMode();

  const fetchAgents = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '100' });
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      const res = await api.get<{ agents: Agent[]; total: number }>(`/agents?${params}`);
      setAgents(res.data.agents);
      setTotal(res.data.total);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAgents(); }, [search, statusFilter]);

  const handleStatusChange = async (agentId: string, status: string) => {
    try {
      await api.patch(`/agents/${agentId}/status`, { status });
      setAgents((prev) => prev.map((a) => a.id === agentId ? { ...a, status: status as Agent['status'] } : a));
    } catch (err) { console.error(err); }
  };

  const handleLockToggle = async (agentId: string, locked: boolean) => {
    try {
      await api.patch(`/agents/${agentId}/status`, { requestLocked: !locked });
      setAgents((prev) => prev.map((a) => a.id === agentId ? { ...a, requestLocked: !locked } : a));
    } catch (err) { console.error(err); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-gray-900">All Agents ({total})</h1>
        <div className="flex gap-2 flex-wrap">
          <input
            type="search"
            placeholder="Search…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input w-44 text-sm"
          />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input w-32 text-sm">
            <option value="">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="FLAGGED">Flagged</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading…</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Agent</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">MSISDN</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">LUR</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">CAS</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Float</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Last Visit</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {agents.map((agent) => (
                  <tr key={agent.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{agent.businessName}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">{agent.msisdn}</td>
                    <td className="px-4 py-3">
                      <span className={
                        agent.status === 'ACTIVE' ? 'badge-green' :
                        agent.status === 'FLAGGED' ? 'badge-red' : 'badge-red'
                      }>{agent.status}</span>
                      {agent.requestLocked && <span className="badge-red ml-1 text-xs">🔒</span>}
                    </td>
                    <td className="px-4 py-3"><LurBadge lur={agent.lurScore} mode={mode} /></td>
                    <td className="px-4 py-3 font-mono text-xs">{agent.casScore ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-700">{formatCurrency(agent.floatBalance)}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{formatDate(agent.lastRebalancedAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <select
                          value={agent.status}
                          onChange={(e) => handleStatusChange(agent.id, e.target.value)}
                          className="text-xs border rounded px-1 py-0.5"
                        >
                          <option value="ACTIVE">Active</option>
                          <option value="FLAGGED">Flag</option>
                          <option value="SUSPENDED">Suspend</option>
                        </select>
                        <button
                          onClick={() => handleLockToggle(agent.id, agent.requestLocked)}
                          className={`text-xs px-2 py-0.5 rounded ${agent.requestLocked ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}
                        >
                          {agent.requestLocked ? '🔒' : '🔓'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
