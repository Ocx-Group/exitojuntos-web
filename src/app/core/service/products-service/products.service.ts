import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '@environments/environment';
import { AuthService } from '@app/core/service/authentication-service/auth.service';
import {
  Product,
  ProductCategory,
  CreateProductPayload,
  CreateCategoryPayload,
} from '@app/core/interfaces/product';
import { PaginationMeta } from '@app/core/interfaces/pagination-request';

export interface PaginatedProductsResponse {
  success: boolean;
  data: Product[];
  meta: PaginationMeta;
}

export interface PaginatedCategoriesResponse {
  success: boolean;
  data: ProductCategory[];
  meta: PaginationMeta;
}

@Injectable({
  providedIn: 'root',
})
export class ProductsService {
  private readonly baseUrl = `${environment.apiUrl}/products`;
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);

  private get authHeaders(): HttpHeaders {
    const token =
      this.authService.currentUserAffiliateValue?.access_token ?? '';
    return new HttpHeaders(token ? { Authorization: `Bearer ${token}` } : {});
  }

  getById(id: number): Observable<Product> {
    return this.http
      .get<{ success: boolean; data: Product }>(`${this.baseUrl}/${id}`)
      .pipe(map(r => r.data));
  }

  getActive(page = 1, limit = 100): Observable<PaginatedProductsResponse> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    return this.http.get<PaginatedProductsResponse>(this.baseUrl, { params });
  }

  getAllAdmin(page = 1, limit = 10): Observable<PaginatedProductsResponse> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    return this.http.get<PaginatedProductsResponse>(`${this.baseUrl}/all`, {
      params,
      headers: this.authHeaders,
    });
  }

  create(payload: CreateProductPayload): Observable<Product> {
    return this.http
      .post<{ success: boolean; data: Product }>(this.baseUrl, payload, {
        headers: this.authHeaders,
      })
      .pipe(map(r => r.data));
  }

  update(
    id: number,
    payload: Partial<CreateProductPayload>,
  ): Observable<Product> {
    return this.http
      .patch<{ success: boolean; data: Product }>(
        `${this.baseUrl}/${id}`,
        payload,
        {
          headers: this.authHeaders,
        },
      )
      .pipe(map(r => r.data));
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`, {
      headers: this.authHeaders,
    });
  }

  getAllCategories(
    page = 1,
    limit = 100,
  ): Observable<PaginatedCategoriesResponse> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    return this.http.get<PaginatedCategoriesResponse>(
      `${this.baseUrl}/categories`,
      {
        params,
      },
    );
  }

  createCategory(payload: CreateCategoryPayload): Observable<ProductCategory> {
    return this.http
      .post<{
        success: boolean;
        data: ProductCategory;
      }>(`${this.baseUrl}/categories`, payload, { headers: this.authHeaders })
      .pipe(map(r => r.data));
  }

  updateCategory(
    id: number,
    payload: Partial<CreateCategoryPayload>,
  ): Observable<ProductCategory> {
    return this.http
      .patch<{
        success: boolean;
        data: ProductCategory;
      }>(`${this.baseUrl}/categories/${id}`, payload, {
        headers: this.authHeaders,
      })
      .pipe(map(r => r.data));
  }

  deleteCategory(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/categories/${id}`, {
      headers: this.authHeaders,
    });
  }
}
