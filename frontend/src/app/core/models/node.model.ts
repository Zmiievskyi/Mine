export type NodeStatus = 'healthy' | 'unhealthy' | 'jailed' | 'offline';

export interface Node {
  id: string;
  address: string;
  alias?: string;
  gpuType: string;
  status: NodeStatus;
  isJailed: boolean;
  earnedCoins: number;
  tokensPerSecond: number;
  jobsCompleted: number;
  uptimePercent: number;
  currentModel?: string;
  lastSeen: Date;
  // Additional metrics for nodes list
  missedRate?: number;
  invalidationRate?: number;
  weight?: number;
}

export interface NodeDetail extends Node {
  models: string[];
  inferenceCount: number;
  missedCount: number;
  missedRate: number;
  invalidationRate: number;
  blocksClaimed: number;
  weight: number;
  isBlacklisted: boolean;
  inferenceUrl?: string;
}

export interface NodeStats {
  totalNodes: number;
  healthyNodes: number;
  totalEarnings: number;
  averageUptime: number;
}

export interface DashboardData {
  stats: NodeStats;
  nodes: Node[];
  recentActivity: ActivityItem[];
}

export interface ActivityItem {
  id: string;
  type: 'earnings' | 'status_change' | 'job_completed';
  nodeId: string;
  message: string;
  timestamp: Date;
}

// Public network stats for landing page (no auth required)
export interface NetworkStats {
  currentEpoch: number;
  currentBlock: number;
  totalParticipants: number;
  healthyParticipants: number;
  catchingUp: number;
  registeredModels: number;
  uniqueModels: string[];
  timeToNextEpoch: {
    hours: number;
    minutes: number;
    seconds: number;
    totalSeconds: number;
  };
  avgBlockTime: number;
  lastUpdated: Date;
}
