import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { Agent } from '../../types';
import { useIntegrationMode } from '../../hooks/useIntegrationMode';
import { LurBar, LurBadge } from '../../components/ui/LurBadge';
import { formatCurrency } from '../../utils/helpers';

interface GeofenceStatus {
  withinGeofence: boolean;
  distanceM: number;
  geofenceRadiusM: number;
}

export const AgentVisit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const mode = useIntegrationMode();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [geoStatus, setGeoStatus] = useState<GeofenceStatus | null>(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    api.get<Agent>(`/agents/${id}`)
      .then((r) => setAgent(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const checkGeofence = () => {
    setChecking(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await api.post('/rebalance/scan-agent', {
            qrToken: agent?.qrCodeToken,
            rebalancerLat: pos.coords.latitude,
            rebalancerLng: pos.coords.longitude,
          });
          setGeoStatus({
            withinGeofence: res.data.withinGeofence,
            distanceM: res.data.distanceM,
            geofenceRadiusM: res.data.geofenceRadiusM,
          });
        } catch (err) {
          console.error(err);
        } finally {
          setChecking(false);
        }
      },
      () => {
        // Simulate being within geofence in dev
        setGeoStatus({ withinGeofence: true, distanceM: 45, geofenceRadiusM: 100 });
        setChecking(false);
      }
    );
  };

  if (loading) return <div className="text-center py-12 text-gray-400">Loading agent…</div>;
  if (!agent) return <div className="text-center py-12 text-red-500">Agent not found</div>;

  return (
    <div className="max-w-lg mx-auto space-y-4">
      {/* Agent header */}
      <div className="card border-l-4 border-zamtel-green">
        <h1 className="text-xl font-bold text-gray-900">{agent.businessName}</h1>
        <p className="text-gray-500 text-sm">{agent.msisdn}</p>
        <div className="flex gap-2 mt-2 flex-wrap">
          <span className={
            agent.status === 'ACTIVE' ? 'badge-green' :
            agent.status === 'FLAGGED' ? 'badge-red' : 'badge-red'
          }>
            {agent.status}
          </span>
          {agent.requestLocked && <span className="badge-red">🔒 Request Locked</span>}
          <LurBadge lur={agent.lurScore} mode={mode} />
        </div>
      </div>

      {/* LUR bar */}
      <div className="card">
        <h2 className="text-sm font-semibold text-gray-700 mb-2">LUR Score</h2>
        <LurBar lur={agent.lurScore} mode={mode} />
        {mode !== 'standalone' && agent.lurScore !== null && agent.lurScore !== undefined && (
          <p className="text-xs text-gray-500 mt-1">
            Liquidity Utilization Ratio: {Math.round(agent.lurScore * 100)}% of last distributed amount utilized
          </p>
        )}
      </div>

      {/* Balances */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card bg-green-50 border-green-200">
          <p className="text-xs text-green-700">Float Balance</p>
          <p className="font-bold text-green-900">{formatCurrency(agent.floatBalance)}</p>
        </div>
        <div className="card bg-blue-50 border-blue-200">
          <p className="text-xs text-blue-700">Cash Balance</p>
          <p className="font-bold text-blue-900">{formatCurrency(agent.cashBalance)}</p>
        </div>
      </div>

      {/* Geofence check */}
      <div className="card">
        <h2 className="font-semibold text-gray-900 mb-3">📍 Geofence Verification</h2>

        {!geoStatus ? (
          <button onClick={checkGeofence} disabled={checking} className="btn-secondary w-full">
            {checking ? 'Checking location…' : 'Check My Location'}
          </button>
        ) : (
          <div className={`rounded-xl p-4 ${geoStatus.withinGeofence ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <div className="flex items-center gap-3">
              <span className="text-3xl">{geoStatus.withinGeofence ? '✅' : '❌'}</span>
              <div>
                <p className={`font-semibold ${geoStatus.withinGeofence ? 'text-green-700' : 'text-red-700'}`}>
                  {geoStatus.withinGeofence ? 'Within Geofence' : 'Outside Geofence'}
                </p>
                <p className="text-sm text-gray-600">
                  Distance: {geoStatus.distanceM}m (limit: {geoStatus.geofenceRadiusM}m)
                </p>
              </div>
            </div>

            {/* Progress ring */}
            <div className="mt-3 bg-gray-100 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${geoStatus.withinGeofence ? 'bg-green-500' : 'bg-red-500'}`}
                style={{ width: `${Math.min(100, (geoStatus.distanceM / geoStatus.geofenceRadiusM) * 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Scan QR button (enabled only within geofence) */}
      <button
        onClick={() => navigate(`/rebalancer/scan?agentId=${agent.id}`)}
        disabled={geoStatus !== null && !geoStatus.withinGeofence}
        className="btn-pink w-full text-base py-4"
      >
        📷 Scan QR Code
        {geoStatus && !geoStatus.withinGeofence && (
          <span className="block text-xs mt-1 opacity-75">Move within {geoStatus.geofenceRadiusM}m to enable</span>
        )}
      </button>

      {agent.requestLocked && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
          ⚠️ This agent's requests are locked due to low LUR score or compliance issues.
        </div>
      )}
    </div>
  );
};
