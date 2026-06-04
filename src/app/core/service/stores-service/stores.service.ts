import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '@environments/environment';
import { AuthService } from '@app/core/service/authentication-service/auth.service';
import {
  FeatureProductPayload,
  Store,
  StoreCatalogItem,
  StoreFeaturedProduct,
  UpdateStorePayload,
} from '@app/core/interfaces/store';
import { PaginationMeta } from '@app/core/interfaces/pagination-request';

interface StoreResponse {
  success: boolean;
  data: Store;
}

interface FeaturedListResponse {
  success: boolean;
  data: StoreFeaturedProduct[];
}

export interface PaginatedStoreCatalogResponse {
  success: boolean;
  data: StoreCatalogItem[];
  meta: PaginationMeta;
}

@Injectable({ providedIn: 'root' })
export class StoresService {
  private readonly baseUrl = `${environment.apiUrl}/stores`;
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);

  private get authHeaders(): HttpHeaders {
    const token =
      this.authService.currentUserAffiliateValue?.access_token ?? '';
    return new HttpHeaders(token ? { Authorization: `Bearer ${token}` } : {});
  }

  // ─── Dueño ───────────────────────────────────────────────────────

  getMyStore(): Observable<Store> {
    return this.http
      .get<StoreResponse>(`${this.baseUrl}/me`, { headers: this.authHeaders })
      .pipe(map(r => r.data));
  }

  updateMyStore(payload: UpdateStorePayload): Observable<Store> {
    return this.http
      .patch<StoreResponse>(`${this.baseUrl}/me`, payload, {
        headers: this.authHeaders,
      })
      .pipe(map(r => r.data));
  }

  listFeatured(): Observable<StoreFeaturedProduct[]> {
    return this.http
      .get<FeaturedListResponse>(`${this.baseUrl}/me/products`, {
        headers: this.authHeaders,
      })
      .pipe(map(r => r.data));
  }

  featureProduct(
    payload: FeatureProductPayload,
  ): Observable<StoreFeaturedProduct> {
    return this.http
      .post<{ success: boolean; data: StoreFeaturedProduct }>(
        `${this.baseUrl}/me/products`,
        payload,
        { headers: this.authHeaders },
      )
      .pipe(map(r => r.data));
  }

  unfeatureProduct(productId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/me/products/${productId}`, {
      headers: this.authHeaders,
    });
  }

  /** Activa o desactiva el botón externo (enlace global de la tienda) para un producto. */
  setExternalEnabled(
    productId: number,
    enabled: boolean,
  ): Observable<StoreFeaturedProduct> {
    return this.http
      .patch<{ success: boolean; data: StoreFeaturedProduct }>(
        `${this.baseUrl}/me/products/${productId}/external`,
        { enabled },
        { headers: this.authHeaders },
      )
      .pipe(map(r => r.data));
  }

  // ─── Público (por token) ─────────────────────────────────────────

  getByToken(token: string): Observable<Store> {
    return this.http
      .get<StoreResponse>(`${this.baseUrl}/t/${token}`)
      .pipe(map(r => r.data));
  }

  getCatalog(
    token: string,
    page = 1,
    limit = 100,
  ): Observable<PaginatedStoreCatalogResponse> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    return this.http.get<PaginatedStoreCatalogResponse>(
      `${this.baseUrl}/t/${token}/products`,
      { params },
    );
  }

  /** Construye el enlace público compartible de una tienda. */
  buildShareUrl(token: string): string {
    return `${window.location.origin}/t/${token}`;
  }
}
