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
