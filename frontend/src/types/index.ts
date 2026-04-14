export type Role = 'SUPER_ADMIN' | 'TDE' | 'MASTER_AGENT' | 'REBALANCER' | 'AGENT';
export type AgentStatus = 'ACTIVE' | 'FLAGGED' | 'SUSPENDED';
export type IntegrationMode = 'standalone' | 'tier1' | 'tier3';
export type AlertLevel = 'GREEN' | 'YELLOW' | 'ORANGE' | 'RED';
export type LurStatus = 'GREEN' | 'AMBER' | 'ORANGE' | 'RED' | 'UNKNOWN' | 'PENDING_INTEGRATION';

export interface User {
  id: string;
  name: string;
  phone: string;
  role: Role;
  zone?: string;
}

export interface Agent {
  id: string;
  businessName: string;
  msisdn: string;
  gpsLat: number;
  gpsLng: number;
  geofenceRadiusM: number;
  qrCodeToken: string;
  floatBalance: number;
  cashBalance: number;
  lurScore?: number | null;
  casScore?: number | null;
  requestLocked: boolean;
  status: AgentStatus;
  lastRebalancedAt?: string | null;
  masterAgentId?: string | null;
  masterAgent?: { name: string; zone: string } | null;
}

export interface HeatmapPoint {
  agentId: string;
  agentName: string;
  gpsLat: number;
  gpsLng: number;
  geofenceRadiusM: number;
  lurScore: number | null;
  casScore: number | null;
  status: AgentStatus;
  colour: 'green' | 'amber' | 'orange' | 'red' | 'blue' | 'grey';
  hasBeenServiced: boolean;
  lastServicedAt: string | null;
  totalDistributed: number;
  burnPct: number | null;
  burnStatus: string | null;
  integrationMode: IntegrationMode;
}

export interface RebalanceRequest {
  id: string;
  agentId: string;
  rebalancerId?: string;
  amountRequested: number;
  amountApproved?: number;
  type: string;
  status: string;
  lurAtRequest?: number | null;
  createdAt: string;
  agent?: { businessName: string; msisdn: string; gpsLat: number; gpsLng: number };
}

export interface BurnDownTracker {
  id: string;
  txnId: string;
  agentId: string;
  initialAmount: number;
  currentUtilized: number;
  burnPct: number;
  alertLevel: AlertLevel;
  status: string;
  createdAt: string;
  updatedAt: string;
  hoursRemaining?: number;
  isOverdue?: boolean;
  agent?: { businessName: string; msisdn: string };
  transaction?: { dispensedAt: string; burnTargetDate: string };
}

export interface Commission {
  id: string;
  masterAgentId: string;
  periodStart: string;
  periodEnd: string;
  totalDistributed: number;
  lurAvg: number;
  baseFee: number;
  utilizationBonus: number;
  totalCommission: number;
  status: string;
  masterAgent?: { name: string; zone: string };
}

export interface DashboardStats {
  totalAgents: number;
  activeAgents: number;
  flaggedAgents: number;
  totalTxns: number;
  totalDistributed: number;
  redAlerts: number;
  integrationMode: IntegrationMode;
}
