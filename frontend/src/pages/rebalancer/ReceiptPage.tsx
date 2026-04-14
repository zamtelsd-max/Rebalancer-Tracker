import React from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { formatDate } from '../../utils/helpers';

export const ReceiptPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const txnId = searchParams.get('txnId');
  const rid = searchParams.get('rid');
  const deadline = searchParams.get('deadline');

  return (
    <div className="max-w-sm mx-auto">
      <div className="card text-center space-y-4">
        {/* Success icon */}
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
            <span className="text-4xl">✅</span>
          </div>
        </div>

        <div>
          <h1 className="text-2xl font-black text-zamtel-green">Dispense Complete!</h1>
          <p className="text-gray-500 text-sm mt-1">GPS verified · QR confirmed · OTP verified</p>
        </div>

        {/* Receipt details */}
        <div className="bg-gray-50 rounded-xl p-4 space-y-3 text-left">
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500">Receipt ID</span>
            <span className="font-bold font-mono text-zamtel-green text-sm">{rid}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500">Transaction ID</span>
            <span className="font-mono text-xs text-gray-700">{txnId?.slice(0, 16)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500">Burn Deadline</span>
            <span className="font-semibold text-sm text-orange-600">
              {formatDate(deadline)} (72h)
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500">Timestamp</span>
            <span className="text-xs text-gray-700">{new Date().toLocaleString('en-ZM')}</span>
          </div>
        </div>

        <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 text-sm text-orange-700">
          ⏱️ Agent must utilize dispensed funds within <strong>72 hours</strong> to maintain LUR score.
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 pt-2">
          <Link to="/rebalancer/route" className="btn-primary">
            Continue Route →
          </Link>
          <Link to="/rebalancer" className="btn-secondary">
            Return Home
          </Link>
        </div>
      </div>
    </div>
  );
};
