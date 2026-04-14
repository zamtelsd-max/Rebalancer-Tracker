import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../utils/api';
import { formatCurrency } from '../../utils/helpers';

export const DispensePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const agentId = searchParams.get('agentId') || '';
  const navigate = useNavigate();

  const [cashAmount, setCashAmount] = useState('');
  const [floatAmount, setFloatAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const total = (parseFloat(cashAmount) || 0) + (parseFloat(floatAmount) || 0);

  const handleDispense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (total <= 0) { setError('Enter at least one amount'); return; }
    setLoading(true);
    setError('');

    try {
      const res = await api.post('/rebalance/initiate', {
        agentId,
        cashAmount: parseFloat(cashAmount) || 0,
        floatAmount: parseFloat(floatAmount) || 0,
        gpsLat: -15.4167,
        gpsLng: 28.2833,
      });
      navigate(`/rebalancer/otp?requestId=${res.data.requestId}&cash=${parseFloat(cashAmount) || 0}&float=${parseFloat(floatAmount) || 0}`);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      setError(e.response?.data?.error || 'Failed to initiate dispense');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-sm mx-auto space-y-4">
      <h1 className="text-xl font-bold text-gray-900">💵 Dispense Amount</h1>

      <form onSubmit={handleDispense} className="card space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Cash Amount (ZMW)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            value={cashAmount}
            onChange={(e) => setCashAmount(e.target.value)}
            className="input text-xl text-center font-bold"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Float Amount (ZMW)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            value={floatAmount}
            onChange={(e) => setFloatAmount(e.target.value)}
            className="input text-xl text-center font-bold"
          />
        </div>

        {total > 0 && (
          <div className="bg-zamtel-green/10 rounded-xl p-3 text-center">
            <p className="text-xs text-gray-500">Total Dispense</p>
            <p className="text-2xl font-black text-zamtel-green">{formatCurrency(total)}</p>
          </div>
        )}

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button type="submit" disabled={loading || total <= 0} className="btn-primary w-full py-4 text-base">
          {loading ? 'Processing…' : '📲 Send OTP to Agent'}
        </button>
      </form>

      <p className="text-xs text-gray-400 text-center">
        An OTP will be sent to the agent's registered phone. Collect the OTP from the agent to complete dispensing.
      </p>
    </div>
  );
};
