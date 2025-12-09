import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { NodeRequest, CreateRequestDto } from '../models/request.model';

@Injectable({
  providedIn: 'root',
})
export class RequestsService {
  private apiUrl = `${environment.apiUrl}/requests`;

  constructor(private http: HttpClient) {}

  create(request: CreateRequestDto): Observable<NodeRequest> {
    return this.http.post<NodeRequest>(this.apiUrl, request);
  }

  getMyRequests(): Observable<NodeRequest[]> {
    return this.http.get<NodeRequest[]>(`${this.apiUrl}/my`);
  }

  getRequest(id: string): Observable<NodeRequest> {
    return this.http.get<NodeRequest>(`${this.apiUrl}/${id}`);
  }

  cancelRequest(id: string): Observable<NodeRequest> {
    return this.http.delete<NodeRequest>(`${this.apiUrl}/${id}`);
  }
}
