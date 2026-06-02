import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '@environments/environment';
import { AuthService } from '@app/core/service/authentication-service/auth.service';
import { PaginationMeta } from '@app/core/interfaces/pagination-request';

export type MyOrderStatus =
  | 'pending_payment'
  | 'paid'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

export const MY_ORDER_STATUS_LABELS: Record<MyOrderStatus, string> = {
  pending_payment: 'Pendiente de pago',
  paid: 'Pagada',
  processing: 'En preparación',
  shipped: 'Enviada',
  delivered: 'Entregada',
  cancelled: 'Cancelada',
  refunded: 'Reembolsada',
};

export interface MyOrderDetail {
  id: number;
  productId: number;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  taxPercent: number;
  product?: { id: number; name: string; image?: string };
}

export interface MyOrder {
  id: number;
  status: MyOrderStatus;
  currency: string;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  shippingCost: number;
  total: number;
  notes: string | null;
  shippingName: string;
  shippingEmail: string;
  shippingAddress: string;
  shippingCity: string;
  shippingProvince: string;
  shippingPostalCode: string | null;
  shippingPhone: string | null;
  createdAt: string;
  updatedAt: string;
  details?: MyOrderDetail[];
}

export interface MyOrdersResponse {
  success: boolean;
  data: MyOrder[];
  meta: PaginationMeta;
}

@Injectable({ providedIn: 'root' })
export class MyOrdersService {
  private readonly baseUrl = `${environment.apiUrl}/orders/my`;
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);

  private get authHeaders(): HttpHeaders {
    const token =
      this.authService.currentUserAffiliateValue?.access_token ?? '';
    return new HttpHeaders(token ? { Authorization: `Bearer ${token}` } : {});
  }

  getAll(page = 1, limit = 10): Observable<MyOrdersResponse> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    return this.http.get<MyOrdersResponse>(this.baseUrl, {
      params,
      headers: this.authHeaders,
    });
  }

  getById(id: number): Observable<MyOrder> {
    return this.http
      .get<{ success: boolean; data: MyOrder }>(`${this.baseUrl}/${id}`, {
        headers: this.authHeaders,
      })
      .pipe(map(r => r.data));
  }

  cancel(id: number): Observable<MyOrder> {
    return this.http
      .patch<{ success: boolean; data: MyOrder }>(
        `${this.baseUrl}/${id}/cancel`,
        {},
        { headers: this.authHeaders },
      )
      .pipe(map(r => r.data));
  }
}
