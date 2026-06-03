import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '@environments/environment';
import { AuthService } from '@app/core/service/authentication-service/auth.service';

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  private readonly baseUrl = `${environment.apiUrl}/storage`;
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);

  private get authHeaders(): HttpHeaders {
    const token =
      this.authService.currentUserAffiliateValue?.access_token ?? '';
    return new HttpHeaders(token ? { Authorization: `Bearer ${token}` } : {});
  }

  uploadImage(file: File, folder = 'products'): Observable<string> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http
      .post<{
        success: boolean;
        data: { url: string };
      }>(`${this.baseUrl}/upload?folder=${folder}`, formData, {
        headers: this.authHeaders,
      })
      .pipe(map(r => r.data.url));
  }

  /** Subida permitida a cualquier usuario autenticado (logo/banner de tienda). */
  uploadStoreAsset(file: File): Observable<string> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http
      .post<{
        success: boolean;
        data: { url: string };
      }>(`${this.baseUrl}/store-asset`, formData, {
        headers: this.authHeaders,
      })
      .pipe(map(r => r.data.url));
  }
}
