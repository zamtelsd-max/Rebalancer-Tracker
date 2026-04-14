import React, { useEffect, useState } from 'react';
import api from '../../utils/api';
import { Commission } from '../../types';
import { formatDate } from '../../utils/helpers';

interface Dispute {
  id: string;
  commissionId: string;
  description: string;
  status: string;
  resolution?: string | null;
  createdAt: string;
}

export const DisputesPage: React.FC = () => {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ commissionId: '', description: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get<Commission[]>('/commissions').then((r) => setCommissions(r.data)),
    ])
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleRaise = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.post<Dispute>('/commissions/disputes', form);
      setDisputes((prev) => [res.data, ...prev]);
      setForm({ commissionId: '', description: '' });
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900">Disputes</h1>

      {/* Raise dispute form */}
      <div className="card">
        <h2 className="font-semibold text-gray-900 mb-3">Raise a Dispute</h2>
        <form onSubmit={handleRaise} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Commission Period</label>
            <select
              value={form.commissionId}
              onChange={(e) => setForm((f) => ({ ...f, commissionId: e.target.value }))}
              className="input"
              required
            >
              <option value="">Select commission…</option>
              {commissions.map((c) => (
                <option key={c.id} value={c.id}>
                  {formatDate(c.periodStart)} – {formatDate(c.periodEnd)} ({c.status})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={3}
              className="input"
              placeholder="Describe the dispute…"
              required
            />
          </div>
          <button type="submit" disabled={submitting} className="btn-primary">
            {submitting ? 'Submitting…' : '⚖️ Raise Dispute'}
          </button>
        </form>
      </div>

      {/* Dispute list */}
      {disputes.length === 0 ? (
        <div className="card text-center py-6 text-gray-400">No disputes raised</div>
      ) : (
        disputes.map((d) => (
          <div key={d.id} className="card border border-gray-200">
            <div className="flex items-start justify-between">
              <p className="text-sm text-gray-700 flex-1 mr-3">{d.description}</p>
              <span className={
                d.status === 'RESOLVED' ? 'badge-green' :
                d.status === 'IN_REVIEW' ? 'badge-amber' :
                d.status === 'DISMISSED' ? 'badge-red' : 'badge-blue'
              }>
                {d.status}
              </span>
            </div>
            {d.resolution && (
              <div className="mt-2 bg-green-50 border border-green-200 rounded-lg p-2 text-sm text-green-700">
                Resolution: {d.resolution}
              </div>
            )}
            <p className="text-xs text-gray-400 mt-2">{formatDate(d.createdAt)}</p>
          </div>
        ))
      )}
    </div>
  );
};
