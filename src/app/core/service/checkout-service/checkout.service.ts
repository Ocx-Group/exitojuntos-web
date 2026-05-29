import { Injectable } from '@angular/core';
import { Observable, delay, of } from 'rxjs';

export interface CheckoutSession {
  /** Identificador de la transacción CoinPayments. */
  txnId: string;
  /** URL hosted de CoinPayments a la que se redirige al usuario. */
  checkoutUrl: string;
  amount: number;
  currency: string;
  status: 'pending';
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class CheckoutService {
  /**
   * MODO DEMO — simula la creación de un checkout hosted de CoinPayments.
   *
   * La clave/HMAC privada de CoinPayments NUNCA debe vivir en el frontend, así
   * que en producción esto debe ser una llamada al backend. El backend crea la
   * transacción con la API de CoinPayments (cmd=create_transaction) y devuelve
   * la URL hosted a la que redirigimos.
   *
   * Para conectar el backend real, inyecta HttpClient + AuthService y reemplaza
   * el cuerpo por:
   *
   *   return this.http
   *     .post<{ data: CheckoutSession }>(
   *       `${environment.apiUrl}/checkout/coinpayments`,
   *       { currency },
   *       { headers: { Authorization: `Bearer ${token}` } },
   *     )
   *     .pipe(map(r => r.data));
   */
  createCoinpaymentsCheckout(
    amount: number,
    currency = 'USD',
  ): Observable<CheckoutSession> {
    const session: CheckoutSession = {
      txnId: this.fakeTxnId(),
      checkoutUrl: 'https://www.coinpayments.net/index.php?cmd=checkout&demo=1',
      amount: Math.round(amount * 100) / 100,
      currency,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    // Simula la latencia de la llamada al backend.
    return of(session).pipe(delay(1200));
  }

  private fakeTxnId(): string {
    return 'DEMO-' + Math.random().toString(36).slice(2, 10).toUpperCase();
  }
}
