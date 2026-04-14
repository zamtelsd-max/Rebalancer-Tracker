import React, { useEffect, useState } from 'react';
import api from '../../utils/api';

type ConfigMap = Record<string, string>;

const CONFIG_DESCRIPTIONS: Record<string, string> = {
  INTEGRATION_MODE: 'Integration mode (standalone | tier1 | tier3)',
  OTP_EXPIRY_SECONDS: 'OTP expiry time in seconds (default: 300)',
  GEOFENCE_RADIUS_M: 'Default geofence radius in meters (default: 100)',
  BURN_TARGET_HOURS: 'Burn-down target window in hours (default: 72)',
  LUR_GREEN_THRESHOLD: 'LUR Green threshold (e.g. 0.80)',
  LUR_AMBER_THRESHOLD: 'LUR Amber threshold (e.g. 0.50)',
  LUR_ORANGE_THRESHOLD: 'LUR Orange threshold (e.g. 0.30)',
};

export const AdminConfig: React.FC = () => {
  const [config, setConfig] = useState<ConfigMap>({});
  const [editing, setEditing] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get<ConfigMap>('/admin/config')
      .then((r) => setConfig(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleEdit = (key: string) => {
    setEditing(key);
    setEditValue(config[key] || '');
  };

  const handleSave = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      await api.patch('/admin/config', { key: editing, value: editValue });
      setConfig((prev) => ({ ...prev, [editing]: editValue }));
      setEditing(null);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-center py-12 text-gray-400">Loading…</div>;

  return (
    <div className="space-y-4 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900">System Configuration</h1>
      <p className="text-sm text-gray-500">
        Changes take effect immediately. Some values may require restart if overriding environment variables.
      </p>

      <div className="space-y-3">
        {Object.entries(config).map(([key, value]) => (
          <div key={key} className="card">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="font-mono text-sm font-semibold text-zamtel-green">{key}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {CONFIG_DESCRIPTIONS[key] || 'System configuration value'}
                </p>
                {editing === key ? (
                  <div className="mt-2 flex gap-2">
                    <input
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="input flex-1 text-sm"
                    />
                    <button onClick={handleSave} disabled={saving} className="btn-primary text-sm px-3">
                      {saving ? '…' : '✓'}
                    </button>
                    <button onClick={() => setEditing(null)} className="btn-secondary text-sm px-3">✕</button>
                  </div>
                ) : (
                  <p className="mt-1 font-mono text-sm text-gray-900 bg-gray-50 px-3 py-1.5 rounded-lg inline-block">
                    {value}
                  </p>
                )}
              </div>
              {editing !== key && (
                <button
                  onClick={() => handleEdit(key)}
                  className="text-xs text-zamtel-green hover:underline ml-3"
                >
                  Edit
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-800">
        ⚠️ <strong>Warning:</strong> Changing INTEGRATION_MODE here updates the database config. The server's
        <code className="bg-yellow-100 px-1 rounded mx-1">INTEGRATION_MODE</code> environment variable takes precedence on restart.
      </div>
    </div>
  );
};
