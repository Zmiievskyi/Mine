import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';
import { Node, NodeDetail, DashboardData, NetworkStats } from '../models/node.model';
import { environment } from '../../../environments/environment';

/**
 * Pure RxJS service for node data operations
 * No internal state - consumers manage their own state with signals
 */
@Injectable({
  providedIn: 'root',
})
export class NodesService {
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/nodes`;

  getDashboardData(): Observable<DashboardData> {
    return this.http.get<DashboardData>(`${this.apiUrl}/dashboard`);
  }

  getNodes(): Observable<Node[]> {
    return this.http.get<Node[]>(this.apiUrl);
  }

  getNode(address: string): Observable<NodeDetail | null> {
    return this.http.get<NodeDetail>(`${this.apiUrl}/${address}`).pipe(
      catchError(() => of(null))
    );
  }

  getPublicNetworkStats(): Observable<NetworkStats | null> {
    return this.http.get<NetworkStats>(`${this.apiUrl}/public/stats`).pipe(
      catchError((error) => {
        console.error('Failed to fetch network stats:', error);
        return of(null);
      })
    );
  }
}
