export interface RequestsByStatus {
  pending: number;
  approved: number;
  rejected: number;
  completed: number;
}

export interface RequestsByGpu {
  gpuType: string;
  count: number;
}

export interface UserStats {
  total: number;
  active: number;
  admins: number;
  newThisWeek: number;
}

export interface NodesByGpu {
  gpuType: string;
  count: number;
  healthyCount: number;
  jailedCount: number;
  offlineCount: number;
}

export interface TopUserByNodes {
  id: string;
  email: string;
  name?: string;
  nodeCount: number;
}

export interface TopUserByEarnings {
  id: string;
  email: string;
  name?: string;
  totalEarnings: number;
}

export interface AdminAnalyticsDto {
  requestsByStatus: RequestsByStatus;
  requestsByGpu: RequestsByGpu[];
  userStats: UserStats;
  nodesByGpu: NodesByGpu[];
  topUsersByNodes: TopUserByNodes[];
  topUsersByEarnings: TopUserByEarnings[];
}
