export type UserRole = 'user' | 'admin';

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
  status: 'pending' | 'approved' | 'rejected' | 'completed';
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
  status?: 'pending' | 'approved' | 'rejected' | 'completed';
  adminNotes?: string;
}
