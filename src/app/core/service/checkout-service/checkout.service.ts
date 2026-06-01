import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '@environments/environment';
import { AuthService } from '@app/core/service/authentication-service/auth.service';

export interface CheckoutSession {
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
   * @param currency Moneda mostrada en la UI (la denominación real la define el backend).
   */
  createCoinpaymentsCheckout(currency = 'USD'): Observable<CheckoutSession> {
    return this.http
      .post<CheckoutResponse>(
        `${this.baseUrl}/checkout`,
        {},
        { headers: this.authHeaders },
      )
      .pipe(
        map((response) => {
          const data = response.data;
          return {
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
}
