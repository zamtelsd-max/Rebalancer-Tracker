import React, { useEffect, useState, useRef } from 'react';
import api from '../../utils/api';
import { IntegrationMode } from '../../types';

interface IntegrationStatus {
  mode: IntegrationMode;
  features: Record<string, boolean>;
  webhookUrl: string | null;
}

interface ImportResult {
  processed: number;
  errors: number;
  notFound: number;
  total: number;
  message: string;
}

const FEATURE_LABELS: Record<string, string> = {
  gpsVerification: '📍 GPS Verification',
  qrOtpDispense: '📷 QR + OTP Dispense',
  auditTrail: '📋 Audit Trail',
  routeManagement: '🗺️ Route Management',
  observationReports: '👁️ Observation Reports',
  lurCalculation: '📊 LUR Calculation',
  burnDownTracking: '🔥 Burn-Down Tracking',
  fraudDetection: '🚨 Fraud Detection',
  commissionCalculation: '💰 Commission Calculation',
  csvImport: '📁 CSV Import',
  webhookSync: '🔗 Webhook Sync',
  realTimeCore: '⚡ Real-Time Core',
};

export const IntegrationPage: React.FC = () => {
  const [status, setStatus] = useState<IntegrationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMode, setSelectedMode] = useState<IntegrationMode>('standalone');
  const [saving, setSaving] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.get<IntegrationStatus>('/admin/integration-status')
      .then((r) => {
        setStatus(r.data);
        setSelectedMode(r.data.mode);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.patch('/admin/config', { key: 'INTEGRATION_MODE', value: selectedMode });
      setStatus((s) => s ? { ...s, mode: selectedMode } : s);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleCsvImport = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const form = new FormData();
      form.append('csv', file);
      const res = await api.post<ImportResult>('/trn/batch-validate', form);
      setImportResult(res.data);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      setImportResult({ processed: 0, errors: 0, notFound: 0, total: 0, message: e.response?.data?.error || 'Import failed' });
    } finally {
      setImporting(false);
    }
  };

  if (loading) return <div className="text-center py-12 text-gray-400">Loading…</div>;

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900">Integration Settings</h1>

      {/* Mode selector */}
      <div className="card">
        <h2 className="font-semibold text-gray-900 mb-4">Integration Mode</h2>
        <div className="space-y-3">
          {(['standalone', 'tier1', 'tier3'] as IntegrationMode[]).map((m) => (
            <label key={m} className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
              selectedMode === m ? 'border-zamtel-green bg-green-50' : 'border-gray-200 hover:border-gray-300'
            }`}>
              <input
                type="radio"
                name="mode"
                value={m}
                checked={selectedMode === m}
                onChange={() => setSelectedMode(m)}
                className="mt-1 accent-zamtel-green"
              />
              <div>
                <p className="font-semibold text-gray-900">
                  {m === 'standalone' ? '⚠️ Standalone (Tier 0)' :
                    m === 'tier1' ? '📦 Batch Mode (Tier 1 — Daily CSV)' :
                    '⚡ Live Integration (Tier 3 — Webhook)'}
                </p>
                <p className="text-sm text-gray-500 mt-0.5">
                  {m === 'standalone' ? 'GPS + QR + OTP verification. No LUR. Manual TRN submission.' :
                    m === 'tier1' ? 'Upload daily CSV from Core. LUR calculated from import data.' :
                    'Real-time Core webhook. Full LUR, fraud detection, commissions.'}
                </p>
              </div>
            </label>
          ))}
        </div>
        <button
          onClick={handleSave}
          disabled={saving || selectedMode === status?.mode}
          className="btn-primary mt-4"
        >
          {saving ? 'Saving…' : 'Save Mode'}
        </button>
        {selectedMode === status?.mode && (
          <p className="text-xs text-gray-400 mt-2">Current active mode: <strong>{status?.mode}</strong></p>
        )}
      </div>

      {/* Tier 1 CSV import */}
      {(selectedMode === 'tier1' || selectedMode === 'tier3') && (
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-3">📁 CSV Batch Import</h2>
          <p className="text-xs text-gray-500 mb-3">
            Required columns: <code className="bg-gray-100 px-1 rounded">msisdn, amount, type (CASH_IN/CASH_OUT), ref, timestamp</code>
          </p>
          <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-zamtel-green transition-colors">
            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              onChange={handleCsvImport}
              className="hidden"
              id="csv-upload"
            />
            <label htmlFor="csv-upload" className="cursor-pointer">
              <div className="text-4xl mb-2">📁</div>
              <p className="text-sm font-medium text-gray-700">Drop CSV or click to upload</p>
              <p className="text-xs text-gray-400 mt-1">.csv files only</p>
            </label>
          </div>

          {importing && <p className="text-sm text-zamtel-green mt-3">Importing…</p>}
          {importResult && (
            <div className={`mt-3 p-4 rounded-xl border ${importResult.errors === 0 ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
              <p className="font-medium text-gray-900 text-sm">{importResult.message}</p>
              <div className="flex gap-4 mt-2 text-xs text-gray-600">
                <span>✅ Processed: {importResult.processed}</span>
                <span>❌ Errors: {importResult.errors}</span>
                <span>❓ Not found: {importResult.notFound}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tier 3 webhook */}
      {selectedMode === 'tier3' && status?.webhookUrl && (
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-3">🔗 Webhook Endpoint</h2>
          <div className="bg-gray-900 rounded-xl p-4 font-mono text-sm text-green-400">
            POST {status.webhookUrl}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Set header <code className="bg-gray-100 px-1 rounded">X-Webhook-Secret: [your secret]</code>
            and POST JSON: <code className="bg-gray-100 px-1 rounded">{`{ transactions: [...] }`}</code>
          </p>
        </div>
      )}

      {/* Feature matrix */}
      <div className="card">
        <h2 className="font-semibold text-gray-900 mb-4">Feature Matrix</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-2 pr-4 font-semibold text-gray-600">Feature</th>
                <th className="text-center py-2 px-3 font-semibold text-orange-600">Standalone</th>
                <th className="text-center py-2 px-3 font-semibold text-yellow-600">Tier 1</th>
                <th className="text-center py-2 px-3 font-semibold text-green-600">Tier 3</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {status && Object.entries(FEATURE_LABELS).map(([key, label]) => {
                const standalone = ['gpsVerification', 'qrOtpDispense', 'auditTrail', 'routeManagement', 'observationReports'].includes(key);
                const tier1 = standalone || ['lurCalculation', 'burnDownTracking', 'fraudDetection', 'commissionCalculation', 'csvImport'].includes(key);
                const tier3 = true;
                return (
                  <tr key={key}>
                    <td className="py-2 pr-4 text-gray-700">{label}</td>
                    <td className="text-center py-2 px-3">{standalone ? '✅' : '—'}</td>
                    <td className="text-center py-2 px-3">{tier1 ? '✅' : '—'}</td>
                    <td className="text-center py-2 px-3">{tier3 ? '✅' : '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
