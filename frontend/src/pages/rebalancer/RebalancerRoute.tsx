import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Agent } from '../../types';
import api from '../../utils/api';
import { useIntegrationMode } from '../../hooks/useIntegrationMode';
import { RouteMap } from '../../components/map/RouteMap';
import { LurBadge } from '../../components/ui/LurBadge';

export const RebalancerRoute: React.FC = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'map' | 'list'>('map');
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [rebalancerPos, setRebalancerPos] = useState<{ lat: number; lng: number } | null>(null);
  const mode = useIntegrationMode();

  useEffect(() => {
    api.get<{ agents: Agent[] }>('/agents?limit=100')
      .then((r) => setAgents(r.data.agents))
      .catch(console.error)
      .finally(() => setLoading(false));

    // Get rebalancer GPS
    navigator.geolocation?.getCurrentPosition((pos) => {
      setRebalancerPos({ lat: pos.coords.latitude, lng: pos.coords.longitude });
    });
  }, []);

  const pinClass = (agent: Agent) => {
    if (agent.status === 'SUSPENDED') return 'text-gray-400';
    if (agent.status === 'FLAGGED' || agent.requestLocked) return 'text-red-600';
    const lur = agent.lurScore;
    if (lur === null || lur === undefined) return 'text-blue-500';
    if (lur >= 0.80) return 'text-green-600';
    if (lur >= 0.50) return 'text-yellow-600';
    if (lur >= 0.30) return 'text-orange-500';
    return 'text-red-600';
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Today's Route</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setView('map')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${view === 'map' ? 'bg-zamtel-green text-white' : 'bg-white border text-gray-600'}`}
          >
            🗺️ Map
          </button>
          <button
            onClick={() => setView('list')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${view === 'list' ? 'bg-zamtel-green text-white' : 'bg-white border text-gray-600'}`}
          >
            📋 List
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="card flex flex-wrap gap-3 text-xs">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-500"></span>LUR ≥80%</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-yellow-500"></span>LUR 50-79%</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-orange-500"></span>LUR 30-49%</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-500"></span>Flagged</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-blue-500"></span>Standalone</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-gray-400"></span>Ineligible</span>
      </div>

      {loading ? (
        <div className="card text-center py-8 text-gray-400">Loading agents…</div>
      ) : view === 'map' ? (
        <>
          <RouteMap
            agents={agents}
            rebalancerPosition={rebalancerPos}
            selectedAgentId={selectedAgent?.id}
            onAgentClick={setSelectedAgent}
            height="420px"
          />
          {selectedAgent && (
            <div className="card border-2 border-zamtel-green">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-gray-900">{selectedAgent.businessName}</h3>
                  <p className="text-sm text-gray-500">{selectedAgent.msisdn}</p>
                  <div className="mt-2">
                    <LurBadge lur={selectedAgent.lurScore} mode={mode} />
                  </div>
                </div>
                <Link
                  to={`/rebalancer/agent/${selectedAgent.id}`}
                  className="btn-primary text-sm"
                >
                  Visit →
                </Link>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="space-y-2">
          {agents.map((agent) => (
            <Link
              key={agent.id}
              to={`/rebalancer/agent/${agent.id}`}
              className="card flex items-center justify-between hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                  agent.status === 'FLAGGED' ? 'bg-red-500' :
                  agent.status === 'SUSPENDED' ? 'bg-gray-400' :
                  agent.requestLocked ? 'bg-red-500' : 'bg-green-500'
                }`} />
                <div>
                  <p className="font-medium text-gray-900 text-sm">{agent.businessName}</p>
                  <p className="text-xs text-gray-500">{agent.msisdn}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <LurBadge lur={agent.lurScore} mode={mode} showValue={false} />
                <span className={`text-lg ${pinClass(agent)}`}>→</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};
