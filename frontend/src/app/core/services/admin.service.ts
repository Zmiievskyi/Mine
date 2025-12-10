import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { buildUrlWithQuery } from '../../shared/utils';
import {
  AdminUser,
  AdminUserWithStats,
  AdminDashboardStats,
  AssignNodeDto,
  UpdateUserDto,
  UserNode,
  AdminRequest,
  UpdateRequestDto,
  AdminNodeWithUser,
  AdminNodesQuery,
  NetworkHealthOverview,
  PaginatedResponse,
  AdminUsersQuery,
  AdminRequestsQuery,
  AdminAnalytics,
  PricingConfig,
  UpdatePricingDto,
} from '../models/admin.model';

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/admin`;
  private requestsUrl = `${environment.apiUrl}/requests`;

  getDashboardStats(): Observable<AdminDashboardStats> {
    return this.http.get<AdminDashboardStats>(`${this.apiUrl}/dashboard`);
  }

  getUsers(query: AdminUsersQuery = {}): Observable<PaginatedResponse<AdminUser>> {
    const url = buildUrlWithQuery(`${this.apiUrl}/users`, query);
    return this.http.get<PaginatedResponse<AdminUser>>(url);
  }

  getUser(id: string): Observable<AdminUserWithStats> {
    return this.http.get<AdminUserWithStats>(`${this.apiUrl}/users/${id}`);
  }

  updateUser(id: string, data: UpdateUserDto): Observable<AdminUser> {
    return this.http.put<AdminUser>(`${this.apiUrl}/users/${id}`, data);
  }

  assignNode(userId: string, data: AssignNodeDto): Observable<UserNode> {
    return this.http.post<UserNode>(`${this.apiUrl}/users/${userId}/nodes`, data);
  }

  removeNode(userId: string, nodeId: string): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(
      `${this.apiUrl}/users/${userId}/nodes/${nodeId}`
    );
  }

  getAllRequests(query: AdminRequestsQuery = {}): Observable<PaginatedResponse<AdminRequest>> {
    const url = buildUrlWithQuery(this.requestsUrl, query);
    return this.http.get<PaginatedResponse<AdminRequest>>(url);
  }

  getRequestStats(): Observable<{ pending: number; approved: number; completed: number }> {
    return this.http.get<{ pending: number; approved: number; completed: number }>(
      `${this.requestsUrl}/stats`
    );
  }

  updateRequest(id: string, data: UpdateRequestDto): Observable<AdminRequest> {
    return this.http.put<AdminRequest>(`${this.requestsUrl}/${id}`, data);
  }

  getAllNodes(query: AdminNodesQuery = {}): Observable<PaginatedResponse<AdminNodeWithUser>> {
    const url = buildUrlWithQuery(`${this.apiUrl}/nodes`, query);
    return this.http.get<PaginatedResponse<AdminNodeWithUser>>(url);
  }

  getNetworkHealth(): Observable<NetworkHealthOverview> {
    return this.http.get<NetworkHealthOverview>(`${this.apiUrl}/nodes/health`);
  }

  getAnalytics(): Observable<AdminAnalytics> {
    return this.http.get<AdminAnalytics>(`${this.apiUrl}/analytics`);
  }

  exportUsers(): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/users/export`, {
      responseType: 'blob',
    });
  }

  exportNodes(): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/nodes/export`, {
      responseType: 'blob',
    });
  }

  exportRequests(): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/requests/export`, {
      responseType: 'blob',
    });
  }

  // Pricing Management
  getPricing(): Observable<PricingConfig[]> {
    return this.http.get<PricingConfig[]>(`${this.apiUrl}/pricing`);
  }

  updatePricing(gpuType: string, data: UpdatePricingDto): Observable<PricingConfig> {
    return this.http.put<PricingConfig>(`${this.apiUrl}/pricing/${gpuType}`, data);
  }
}
