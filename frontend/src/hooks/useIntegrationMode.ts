import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import api from '../utils/api';
import { IntegrationMode } from '../types';

export function useIntegrationMode(): IntegrationMode {
  const { integrationMode, setIntegrationMode } = useAuthStore();

  useEffect(() => {
    api.get<{ mode: IntegrationMode }>('/auth/integration-mode')
      .then((res) => setIntegrationMode(res.data.mode))
      .catch(() => setIntegrationMode('standalone'));
  }, [setIntegrationMode]);

  return integrationMode;
}
