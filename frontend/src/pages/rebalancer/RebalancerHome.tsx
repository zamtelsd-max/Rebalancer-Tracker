import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useIntegrationMode } from '../../hooks/useIntegrationMode';
import api from '../../utils/api';
import { formatCurrency } from '../../utils/helpers';

interface RebalancerHome {
  name: string;
  cashHolding: number;
  todayVisits: number;
  pendingRequests: number;
}

export const RebalancerHome: React.FC = () => {
  const { user } = useAuthStore();
  const mode = useIntegrationMode();
  const [data, setData] = useState<RebalancerHome | null>(null);
  const [requests, setRequests] = useState<{ id: string; status: string; agent?: { businessName: string } }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/rebalance/requests?status=PENDING').then((r) => setRequests(r.data)),
    ])
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="max-w-lg mx-auto space-y-4">
      {/* Greeting */}
      <div className="card" style={{ background: 'linear-gradient(135deg, #00843D, #006630)', color: 'white' }}>
        <p className="text-green-200 text-sm">{greeting()},</p>
        <h1 className="text-2xl font-bold">{user?.name}</h1>
        <p className="text-green-300 text-xs mt-1">{new Date().toLocaleDateString('en-ZM', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="bg-white/10 rounded-xl p-3">
            <p className="text-green-200 text-xs">Today's Visits</p>
            <p className="text-white font-bold text-xl">
              {loading ? '—' : requests.filter(r => r.status === 'COMPLETED').length}
            </p>
          </div>
          <div className="bg-white/10 rounded-xl p-3">
            <p className="text-green-200 text-xs">Pending</p>
            <p className="text-white font-bold text-xl">
              {loading ? '—' : requests.filter(r => r.status === 'PENDING').length}
            </p>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3">
        <Link to="/rebalancer/route" className="card flex flex-col items-center gap-2 py-5 hover:shadow-md transition-shadow border-2 border-zamtel-green/20 hover:border-zamtel-green">
          <span className="text-3xl">🗺️</span>
          <span className="font-semibold text-zamtel-green">Start Route</span>
          <span className="text-xs text-gray-500">View today's agents</span>
        </Link>
        <Link to="/rebalancer/scan" className="card flex flex-col items-center gap-2 py-5 hover:shadow-md transition-shadow border-2 border-zamtel-pink/20 hover:border-zamtel-pink">
          <span className="text-3xl">📷</span>
          <span className="font-semibold text-zamtel-pink">Scan QR</span>
          <span className="text-xs text-gray-500">Verify agent</span>
        </Link>
      </div>

      {/* Today's pending requests */}
      <div className="card">
        <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <span>📋</span> Pending Requests
        </h2>
        {loading ? (
          <p className="text-gray-400 text-sm">Loading…</p>
        ) : requests.filter(r => r.status === 'PENDING').length === 0 ? (
          <p className="text-gray-400 text-sm">No pending requests — all done! ✅</p>
        ) : (
          <div className="space-y-2">
            {requests.filter(r => r.status === 'PENDING').slice(0, 5).map((req) => (
              <Link
                key={req.id}
                to={`/rebalancer/agent/${req.id}`}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-green-50 transition-colors"
              >
                <span className="text-sm font-medium text-gray-900">
                  {req.agent?.businessName || 'Unknown Agent'}
                </span>
                <span className="badge-amber">Pending</span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Integration mode note */}
      {mode === 'standalone' && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-blue-700 text-sm">
            <span className="font-semibold">ℹ️ Standalone Mode:</span> LUR scores are not available.
            GPS verification, QR scan, and OTP dispensing are fully operational.
          </p>
        </div>
      )}
    </div>
  );
};
