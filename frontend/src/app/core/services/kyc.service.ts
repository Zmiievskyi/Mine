import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { KycStatusResponse, SubmitKycDto, FileUploadResponse } from '../models/kyc.model';

@Injectable({
  providedIn: 'root',
})
export class KycService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/users/kyc`;
  private readonly uploadsUrl = `${environment.apiUrl}/uploads/kyc`;

  public getKycStatus(): Observable<KycStatusResponse> {
    return this.http.get<KycStatusResponse>(this.apiUrl);
  }

  public submitKyc(data: SubmitKycDto): Observable<KycStatusResponse> {
    return this.http.post<KycStatusResponse>(this.apiUrl, data);
  }

  public uploadDocument(file: File): Observable<FileUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<FileUploadResponse>(this.uploadsUrl, formData);
  }
}
