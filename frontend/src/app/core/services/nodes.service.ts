import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Node, NodeStats, DashboardData } from '../models/node.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class NodesService {
  private readonly apiUrl = `${environment.apiUrl}/nodes`;

  private nodesSignal = signal<Node[]>([]);
  private statsSignal = signal<NodeStats | null>(null);
  private loadingSignal = signal<boolean>(false);

  readonly nodes = this.nodesSignal.asReadonly();
  readonly stats = this.statsSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();

  constructor(private http: HttpClient) {}

  getDashboardData(): Observable<DashboardData> {
    this.loadingSignal.set(true);
    return this.http.get<DashboardData>(`${this.apiUrl}/dashboard`).pipe(
      tap((data) => {
        this.nodesSignal.set(data.nodes);
        this.statsSignal.set(data.stats);
        this.loadingSignal.set(false);
      })
    );
  }

  getNodes(): Observable<Node[]> {
    this.loadingSignal.set(true);
    return this.http.get<Node[]>(this.apiUrl).pipe(
      tap((nodes) => {
        this.nodesSignal.set(nodes);
        this.loadingSignal.set(false);
      })
    );
  }

  getNode(id: string): Observable<Node> {
    return this.http.get<Node>(`${this.apiUrl}/${id}`);
  }

  refreshNode(id: string): Observable<Node> {
    return this.http.post<Node>(`${this.apiUrl}/${id}/refresh`, {});
  }
}
