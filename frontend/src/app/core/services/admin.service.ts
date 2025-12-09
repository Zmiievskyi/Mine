import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AdminUser,
  AdminDashboardStats,
  AssignNodeDto,
  UpdateUserDto,
  UserNode,
  AdminRequest,
  UpdateRequestDto,
} from '../models/admin.model';

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  private apiUrl = `${environment.apiUrl}/admin`;
  private requestsUrl = `${environment.apiUrl}/requests`;

  constructor(private http: HttpClient) {}

  getDashboardStats(): Observable<AdminDashboardStats> {
    return this.http.get<AdminDashboardStats>(`${this.apiUrl}/dashboard`);
  }

  getUsers(): Observable<AdminUser[]> {
    return this.http.get<AdminUser[]>(`${this.apiUrl}/users`);
  }

  getUser(id: string): Observable<AdminUser> {
    return this.http.get<AdminUser>(`${this.apiUrl}/users/${id}`);
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

  updateNode(
    userId: string,
    nodeId: string,
    data: Partial<AssignNodeDto>
  ): Observable<UserNode> {
    return this.http.put<UserNode>(
      `${this.apiUrl}/users/${userId}/nodes/${nodeId}`,
      data
    );
  }

  getAllRequests(): Observable<AdminRequest[]> {
    return this.http.get<AdminRequest[]>(this.requestsUrl);
  }

  getRequestStats(): Observable<{ pending: number; approved: number; completed: number }> {
    return this.http.get<{ pending: number; approved: number; completed: number }>(
      `${this.requestsUrl}/stats`
    );
  }

  updateRequest(id: string, data: UpdateRequestDto): Observable<AdminRequest> {
    return this.http.put<AdminRequest>(`${this.requestsUrl}/${id}`, data);
  }
}
