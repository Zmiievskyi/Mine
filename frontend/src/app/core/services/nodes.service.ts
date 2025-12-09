import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, of } from 'rxjs';
import { Node, NodeDetail, NodeStats, DashboardData } from '../models/node.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class NodesService {
  private readonly apiUrl = `${environment.apiUrl}/nodes`;

  private nodesSignal = signal<Node[]>([]);
  private statsSignal = signal<NodeStats | null>(null);
  private loadingSignal = signal<boolean>(false);
  private errorSignal = signal<string | null>(null);

  readonly nodes = this.nodesSignal.asReadonly();
  readonly stats = this.statsSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();

  constructor(private http: HttpClient) {}

  getDashboardData(): Observable<DashboardData> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    return this.http.get<DashboardData>(`${this.apiUrl}/dashboard`).pipe(
      tap((data) => {
        this.nodesSignal.set(data.nodes);
        this.statsSignal.set(data.stats);
        this.loadingSignal.set(false);
      }),
      catchError((error) => {
        this.loadingSignal.set(false);
        this.errorSignal.set(error.error?.message || 'Failed to load dashboard');
        return of({
          stats: { totalNodes: 0, healthyNodes: 0, totalEarnings: 0, averageUptime: 0 },
          nodes: [],
          recentActivity: [],
        } as DashboardData);
      })
    );
  }

  getNodes(): Observable<Node[]> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    return this.http.get<Node[]>(this.apiUrl).pipe(
      tap((nodes) => {
        this.nodesSignal.set(nodes);
        this.loadingSignal.set(false);
      }),
      catchError((error) => {
        this.loadingSignal.set(false);
        this.errorSignal.set(error.error?.message || 'Failed to load nodes');
        return of([]);
      })
    );
  }

  getNode(address: string): Observable<NodeDetail | null> {
    return this.http.get<NodeDetail>(`${this.apiUrl}/${address}`).pipe(
      catchError(() => of(null))
    );
  }
}
