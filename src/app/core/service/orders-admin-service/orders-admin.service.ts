import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '@environments/environment';
import { AuthService } from '@app/core/service/authentication-service/auth.service';
import { PaginationMeta } from '@app/core/interfaces/pagination-request';

export type OrderStatus =
  | 'pending_payment'
  | 'paid'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending_payment: 'Pendiente de pago',
  paid: 'Pagada',
  processing: 'En preparación',
  shipped: 'Enviada',
  delivered: 'Entregada',
  cancelled: 'Cancelada',
  refunded: 'Reembolsada',
};

export const VALID_NEXT_STATUSES: Record<OrderStatus, OrderStatus[]> = {
  pending_payment: ['paid', 'cancelled'],
  paid: ['processing', 'cancelled', 'refunded'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: ['refunded'],
  cancelled: [],
  refunded: [],
};

export interface AdminOrderUser {
  id: number;
  name: string;
  lastName: string;
  email: string;
}

export interface AdminOrderDetail {
  id: number;
  productId: number;
  quantity: number;
  unitPrice: number;
  product?: { id: number; name: string; image?: string };
}

export interface AdminOrder {
  id: number;
  userId: number;
  status: OrderStatus;
  currency: string;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  shippingCost: number;
  total: number;
  notes: string | null;
  shippingEmail: string;
  shippingName: string;
  shippingAddress: string;
  shippingCity: string;
  shippingProvince: string;
  shippingPostalCode: string | null;
  shippingPhone: string | null;
  createdAt: string;
  updatedAt: string;
  user?: AdminOrderUser;
  details?: AdminOrderDetail[];
}

export interface PaginatedOrdersResponse {
  success: boolean;
  data: AdminOrder[];
  meta: PaginationMeta;
}

@Injectable({ providedIn: 'root' })
export class OrdersAdminService {
  private readonly baseUrl = `${environment.apiUrl}/orders`;
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);

  private get authHeaders(): HttpHeaders {
    const token =
      this.authService.currentUserAffiliateValue?.access_token ?? '';
    return new HttpHeaders(token ? { Authorization: `Bearer ${token}` } : {});
  }

  getAll(page = 1, limit = 15, status?: OrderStatus): Observable<PaginatedOrdersResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    if (status) params = params.set('status', status);
    return this.http.get<PaginatedOrdersResponse>(this.baseUrl, {
      params,
      headers: this.authHeaders,
    });
  }

  getById(id: number): Observable<AdminOrder> {
    return this.http
      .get<{ success: boolean; data: AdminOrder }>(`${this.baseUrl}/${id}`, {
        headers: this.authHeaders,
      })
      .pipe(map(r => r.data));
  }

  updateStatus(id: number, status: OrderStatus): Observable<AdminOrder> {
    return this.http
      .patch<{ success: boolean; data: AdminOrder }>(
        `${this.baseUrl}/${id}/status`,
        { status },
        { headers: this.authHeaders },
      )
      .pipe(map(r => r.data));
  }
}
