import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../utils/api';

export const OtpPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const requestId = searchParams.get('requestId') || '';
  const cashAmount = parseFloat(searchParams.get('cash') || '0');
  const floatAmount = parseFloat(searchParams.get('float') || '0');
  const navigate = useNavigate();

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timeLeft, setTimeLeft] = useState(300);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) { clearInterval(timer); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  const handleDigit = (idx: number, val: string) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp];
    next[idx] = val;
    setOtp(next);
    if (val && idx < 5) inputRefs.current[idx + 1]?.focus();
  };

  const handleKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpStr = otp.join('');
    if (otpStr.length !== 6) return;
    setLoading(true);
    setError('');

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await api.post('/rebalance/confirm-dispense', {
            requestId,
            otp: otpStr,
            gpsLat: pos.coords.latitude,
            gpsLng: pos.coords.longitude,
            cashAmount,
            floatAmount,
          });
          navigate(`/rebalancer/receipt?txnId=${res.data.transactionId}&rid=${res.data.receiptId}&deadline=${res.data.burnTargetDate}`);
        } catch (err: unknown) {
          const e = err as { response?: { data?: { error?: string } } };
          setError(e.response?.data?.error || 'OTP verification failed');
        } finally {
          setLoading(false);
        }
      },
      async () => {
        try {
          const res = await api.post('/rebalance/confirm-dispense', {
            requestId, otp: otpStr,
            gpsLat: -15.4167, gpsLng: 28.2833,
            cashAmount, floatAmount,
          });
          navigate(`/rebalancer/receipt?txnId=${res.data.transactionId}&rid=${res.data.receiptId}&deadline=${res.data.burnTargetDate}`);
        } catch (err: unknown) {
          const e = err as { response?: { data?: { error?: string } } };
          setError(e.response?.data?.error || 'OTP verification failed');
        } finally {
          setLoading(false);
        }
      }
    );
  };

  return (
    <div className="max-w-sm mx-auto space-y-5">
      <div className="text-center">
        <div className="text-5xl mb-2">🔐</div>
        <h1 className="text-xl font-bold text-gray-900">Enter Agent OTP</h1>
        <p className="text-sm text-gray-500 mt-1">Collect the 6-digit code from the agent's phone</p>
      </div>

      {/* Countdown */}
      <div className={`text-center py-3 rounded-xl ${timeLeft < 60 ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
        <p className="text-xs font-medium mb-1">Time remaining</p>
        <p className="text-3xl font-black font-mono">{formatTime(timeLeft)}</p>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-5">
        <div className="flex justify-center gap-2">
          {otp.map((digit, i) => (
            <input
              key={i}
              ref={(el) => { inputRefs.current[i] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleDigit(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              className="w-12 h-14 text-center text-2xl font-black border-2 rounded-xl focus:border-zamtel-green focus:outline-none transition-colors"
              style={{ borderColor: digit ? '#00843D' : '#d1d5db' }}
            />
          ))}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm text-center">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || otp.join('').length !== 6 || timeLeft === 0}
          className="btn-primary w-full py-4 text-base"
        >
          {loading ? 'Verifying…' : '✅ Confirm Dispense'}
        </button>

        {timeLeft === 0 && (
          <p className="text-center text-red-600 text-sm font-medium">OTP expired. Go back and restart.</p>
        )}
      </form>
    </div>
  );
};
