import { UserRole } from './user.model';
import { RequestStatus } from './request.model';

export type { UserRole } from './user.model';

export interface UserNode {
  id: string;
  nodeAddress: string;
  label?: string;
  gpuType?: string;
  gcoreInstanceId?: string;
  notes?: string;
  isActive: boolean;
  createdAt: Date;
}

export interface AdminUser {
  id: string;
  email: string;
  name?: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  nodes: UserNode[];
}

export interface AdminDashboardStats {
  totalUsers: number;
  totalNodes: number;
  pendingRequests: number;
  approvedRequests: number;
}

export interface AssignNodeDto {
  nodeAddress: string;
  label?: string;
  gpuType?: string;
  gcoreInstanceId?: string;
  notes?: string;
}

export interface UpdateUserDto {
  role?: UserRole;
  isActive?: boolean;
}

export interface AdminRequest {
  id: string;
  gpuType: string;
  gpuCount: number;
  region?: string;
  message?: string;
  status: RequestStatus;
  adminNotes?: string;
  createdAt: Date;
  updatedAt: Date;
  processedAt?: Date;
  user?: {
    id: string;
    email: string;
    name?: string;
  };
}

export interface UpdateRequestDto {
  status?: RequestStatus;
  adminNotes?: string;
}

// Re-export NodeStatus from node.model for backwards compatibility
import { NodeStatus } from './node.model';
export type { NodeStatus } from './node.model';

export interface UserNodeWithStats extends UserNode {
  status: NodeStatus;
  earnings: number;
  inferenceCount: number;
  missedRate: number;
  uptime: number;
}

export interface AdminUserWithStats extends Omit<AdminUser, 'nodes'> {
  nodes: UserNodeWithStats[];
}

export interface AdminNodeWithUser {
  id: string;
  nodeAddress: string;
  label?: string;
  gpuType?: string;
  isActive: boolean;
  createdAt: Date;
  user: {
    id: string;
    email: string;
    name?: string;
  } | null;
  status: NodeStatus;
  earnings: number;
  inferenceCount: number;
  missedRate: number;
  weight: number;
  models: string[];
}

export interface AdminNodesQuery {
  page?: number;
  limit?: number;
  status?: 'healthy' | 'jailed' | 'offline' | 'all';
  gpuType?: string;
  userId?: string;
  search?: string;
  sortBy?: 'earnings' | 'uptime' | 'user' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface NetworkHealthOverview {
  totalNodes: number;
  healthyNodes: number;
  jailedNodes: number;
  offlineNodes: number;
  unknownNodes: number;
  totalEarnings: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AdminUsersQuery {
  page?: number;
  limit?: number;
  search?: string;
  role?: 'user' | 'admin' | 'all';
  isActive?: boolean;
  sortBy?: 'nodeCount' | 'createdAt' | 'email';
  sortOrder?: 'asc' | 'desc';
}

export interface AdminRequestsQuery {
  page?: number;
  limit?: number;
  status?: RequestStatus | 'all';
  gpuType?: string;
  userEmail?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: 'createdAt' | 'status' | 'gpuType';
  sortOrder?: 'asc' | 'desc';
}

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

export interface AdminAnalytics {
  requestsByStatus: RequestsByStatus;
  requestsByGpu: RequestsByGpu[];
  userStats: UserStats;
  nodesByGpu: NodesByGpu[];
  topUsersByNodes: TopUserByNodes[];
  topUsersByEarnings: TopUserByEarnings[];
}
