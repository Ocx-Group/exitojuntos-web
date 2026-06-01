import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '@environments/environment';
import { AuthService } from '@app/core/service/authentication-service/auth.service';

export interface CheckoutSession {
  /** Id de la orden creada en el backend. */
  orderId: number;
  /** Identificador de la factura de CoinPayments. */
  txnId: string;
  /** URL hosted de CoinPayments a la que se redirige al usuario. */
  checkoutUrl: string;
  /** URL para consultar el estado de la factura. */
  statusUrl?: string;
  /** URL del código QR de pago. */
  qrCodeUrl?: string;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
}

/** Respuesta cruda del backend (`POST /coinpayments/checkout`). */
interface CheckoutSessionResult {
  orderId: number;
  transactionId: number;
  invoiceId: string;
  checkoutUrl: string;
  statusUrl: string;
  qrCodeUrl: string;
  amount: number;
  status: string;
  expiresAt: string;
}

interface CheckoutResponse {
  success: boolean;
  data: CheckoutSessionResult;
}

/** Estado de una orden devuelto por el backend. */
export interface OrderStatusResult {
  id: number;
  status: string;
}

interface OrderResponse {
  success: boolean;
  data: { id: number; status: string };
}

/** Datos de envío que se envían al backend (todos opcionales). */
export interface CheckoutShippingData {
  shippingEmail?: string;
  shippingName?: string;
  shippingAddress?: string;
  shippingCity?: string;
  shippingProvince?: string;
  shippingPostalCode?: string;
  shippingPhone?: string;
  shippingCost?: number;
  notes?: string;
}

@Injectable({ providedIn: 'root' })
export class CheckoutService {
  private readonly baseUrl = `${environment.apiUrl}/coinpayments`;
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);

  private get authHeaders(): HttpHeaders {
    const token =
      this.authService.currentUserAffiliateValue?.access_token ?? '';
    return new HttpHeaders(token ? { Authorization: `Bearer ${token}` } : {});
  }

  /**
   * Crea un checkout hosted de CoinPayments en el backend.
   *
   * El backend construye la factura a partir del carrito del usuario (el monto
   * se calcula en el servidor), llama a la API de CoinPayments y devuelve la URL
   * hosted a la que redirigimos. La clave/HMAC privada nunca vive en el frontend.
   *
   * @param shipping Datos de envío para crear la orden.
   * @param currency Moneda mostrada en la UI (la denominación real la define el backend).
   */
  createCoinpaymentsCheckout(
    shipping: CheckoutShippingData,
    currency = 'USD',
  ): Observable<CheckoutSession> {
    return this.http
      .post<CheckoutResponse>(
        `${this.baseUrl}/checkout`,
        shipping,
        { headers: this.authHeaders },
      )
      .pipe(
        map((response) => {
          const data = response.data;
          return {
            orderId: data.orderId,
            txnId: data.invoiceId,
            checkoutUrl: data.checkoutUrl,
            statusUrl: data.statusUrl,
            qrCodeUrl: data.qrCodeUrl,
            amount: data.amount,
            currency,
            status: data.status,
            createdAt: new Date().toISOString(),
          } satisfies CheckoutSession;
        }),
      );
  }

  /** Consulta el estado real de una orden propia (`GET /orders/my/:id`). */
  getOrderStatus(orderId: number): Observable<OrderStatusResult> {
    return this.http
      .get<OrderResponse>(`${environment.apiUrl}/orders/my/${orderId}`, {
        headers: this.authHeaders,
      })
      .pipe(map((response) => ({ id: response.data.id, status: response.data.status })));
  }
}
