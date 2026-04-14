import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../utils/api';

export const ScanPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const agentId = searchParams.get('agentId');
  const navigate = useNavigate();
  const [qrToken, setQrToken] = useState('');
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');
  const [scanResult, setScanResult] = useState<{
    agentId: string; agentName: string; withinGeofence: boolean; distanceM: number;
  } | null>(null);

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setScanning(true);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await api.post('/rebalance/scan-agent', {
            qrToken,
            rebalancerLat: pos.coords.latitude,
            rebalancerLng: pos.coords.longitude,
          });
          setScanResult(res.data);
          if (res.data.withinGeofence) {
            setTimeout(() => navigate(`/rebalancer/dispense?agentId=${res.data.agentId}&qrToken=${qrToken}`), 1000);
          }
        } catch (err: unknown) {
          const e = err as { response?: { data?: { error?: string } } };
          setError(e.response?.data?.error || 'Scan failed');
        } finally {
          setScanning(false);
        }
      },
      () => {
        // Fallback: use default location for dev
        api.post('/rebalance/scan-agent', {
          qrToken,
          rebalancerLat: -15.4167,
          rebalancerLng: 28.2833,
        }).then((res) => {
          setScanResult(res.data);
          if (res.data.withinGeofence) {
            setTimeout(() => navigate(`/rebalancer/dispense?agentId=${res.data.agentId}&qrToken=${qrToken}`), 1000);
          }
        }).catch(() => setError('Scan failed'))
          .finally(() => setScanning(false));
      }
    );
  };

  return (
    <div className="max-w-sm mx-auto space-y-5">
      <h1 className="text-xl font-bold text-gray-900">📷 QR Code Scan</h1>

      {/* Camera placeholder + manual entry */}
      <div className="card">
        <div className="bg-gray-900 rounded-xl aspect-square flex items-center justify-center mb-4 relative overflow-hidden">
          <div className="text-center text-white">
            <div className="text-6xl mb-2">📷</div>
            <p className="text-sm text-gray-400">Camera QR scanning</p>
            <p className="text-xs text-gray-500 mt-1">(Use token input below)</p>
          </div>
          {/* Scanning animation */}
          <div className="absolute inset-0 border-2 border-zamtel-green/50 rounded-xl">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-zamtel-green animate-bounce" style={{ animationDuration: '2s' }} />
          </div>
        </div>

        <form onSubmit={handleScan} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              QR Token (manual entry)
            </label>
            <input
              type="text"
              placeholder="Enter agent QR token"
              value={qrToken}
              onChange={(e) => setQrToken(e.target.value)}
              className="input font-mono text-sm"
              required
            />
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button type="submit" disabled={scanning || !qrToken} className="btn-pink w-full">
            {scanning ? 'Verifying…' : 'Verify QR'}
          </button>
        </form>
      </div>

      {/* Scan result */}
      {scanResult && (
        <div className={`card border-2 ${scanResult.withinGeofence ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}`}>
          <div className="flex items-center gap-3">
            <span className="text-4xl">{scanResult.withinGeofence ? '✅' : '❌'}</span>
            <div>
              <p className="font-bold text-gray-900">{scanResult.agentName}</p>
              <p className={`text-sm font-medium ${scanResult.withinGeofence ? 'text-green-700' : 'text-red-700'}`}>
                {scanResult.withinGeofence ? `Within geofence (${scanResult.distanceM}m away)` : `Outside geofence (${scanResult.distanceM}m away)`}
              </p>
              {scanResult.withinGeofence && (
                <p className="text-xs text-green-600 mt-1">Redirecting to dispense…</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
