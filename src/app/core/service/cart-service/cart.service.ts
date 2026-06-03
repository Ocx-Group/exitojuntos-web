import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map, tap } from 'rxjs';
import { environment } from '@environments/environment';
import { AuthService } from '@app/core/service/authentication-service/auth.service';
import { ReferralService } from '@app/core/service/referral-service';
import { Cart } from '@app/core/interfaces/cart';

interface CartResponse {
  success: boolean;
  data: Cart;
}

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly baseUrl = `${environment.apiUrl}/cart`;
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly referralService = inject(ReferralService);

  private readonly _cart = signal<Cart | null>(null);
  public readonly cart = this._cart.asReadonly();
  public readonly itemCount = computed(
    () => this._cart()?.items?.reduce((sum, i) => sum + i.quantity, 0) ?? 0,
  );

  private get authHeaders(): HttpHeaders {
    const token = this.authService.currentUserAffiliateValue?.access_token ?? '';
    return new HttpHeaders(token ? { Authorization: `Bearer ${token}` } : {});
  }

  loadCart(): Observable<Cart> {
    return this.http
      .get<CartResponse>(this.baseUrl, { headers: this.authHeaders })
      .pipe(
        map(r => r.data),
        tap(cart => this._cart.set(cart)),
      );
  }

  addItem(productId: number, quantity = 1): Observable<Cart> {
    const storeToken = this.referralService.getToken();
    const body: { productId: number; quantity: number; storeToken?: string } = {
      productId,
      quantity,
    };
    if (storeToken) body.storeToken = storeToken;
    return this.http
      .post<CartResponse>(`${this.baseUrl}/items`, body, {
        headers: this.authHeaders,
      })
      .pipe(
        map(r => r.data),
        tap(cart => this._cart.set(cart)),
      );
  }

  updateItem(itemId: number, quantity: number): Observable<Cart> {
    return this.http
      .patch<CartResponse>(
        `${this.baseUrl}/items/${itemId}`,
        { quantity },
        { headers: this.authHeaders },
      )
      .pipe(
        map(r => r.data),
        tap(cart => this._cart.set(cart)),
      );
  }

  removeItem(itemId: number): Observable<Cart> {
    return this.http
      .delete<CartResponse>(`${this.baseUrl}/items/${itemId}`, {
        headers: this.authHeaders,
      })
      .pipe(
        map(r => r.data),
        tap(cart => this._cart.set(cart)),
      );
  }

  clearCart(): Observable<void> {
    return this.http
      .delete<void>(this.baseUrl, { headers: this.authHeaders })
      .pipe(tap(() => this._cart.set(null)));
  }

  reset(): void {
    this._cart.set(null);
  }
}
