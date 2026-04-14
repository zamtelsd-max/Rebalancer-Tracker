import React, { useEffect, useState } from 'react';
import api from '../../utils/api';
import { formatCurrency, formatDateTime } from '../../utils/helpers';

interface Request {
  id: string;
  amountApproved: number | null;
  type: string;
  status: string;
  createdAt: string;
  agent?: { businessName: string; msisdn: string };
}

export const HistoryPage: React.FC = () => {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<Request[]>('/rebalance/requests')
      .then((r) => setRequests(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-12 text-gray-400">Loading history…</div>;

  return (
    <div className="max-w-lg mx-auto space-y-3">
      <h1 className="text-xl font-bold text-gray-900">Visit History</h1>

      {requests.length === 0 ? (
        <div className="card text-center py-8 text-gray-400">No visits recorded yet</div>
      ) : (
        requests.map((req) => (
          <div key={req.id} className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-gray-900">{req.agent?.businessName || '—'}</p>
                <p className="text-xs text-gray-500">{req.agent?.msisdn}</p>
                <p className="text-xs text-gray-400 mt-1">{formatDateTime(req.createdAt)}</p>
              </div>
              <div className="text-right">
                <span className={
                  req.status === 'COMPLETED' ? 'badge-green' :
                  req.status === 'PENDING' ? 'badge-amber' :
                  req.status === 'FLAGGED' ? 'badge-red' : 'badge-blue'
                }>
                  {req.status}
                </span>
                {req.amountApproved && (
                  <p className="text-sm font-bold text-gray-900 mt-1">{formatCurrency(req.amountApproved)}</p>
                )}
                <p className="text-xs text-gray-500">{req.type}</p>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
};
