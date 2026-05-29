import {
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ToastrService } from 'ngx-toastr';
import { CartItem } from '@app/core/interfaces/cart';
import { AuthService } from '@app/core/service/authentication-service/auth.service';
import { CartService } from '@app/core/service/cart-service';
import {
  CheckoutService,
  CheckoutSession,
} from '@app/core/service/checkout-service';
import { PublicNavbarComponent } from '@app/shared/components/public-navbar/public-navbar.component';

@Component({
  selector: 'app-checkout-page',
  standalone: true,
  imports: [CommonModule, RouterLink, PublicNavbarComponent],
  templateUrl: './checkout-page.component.html',
  styleUrls: ['./checkout-page.component.scss'],
})
export class CheckoutPageComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly toastr = inject(ToastrService);
  private readonly checkoutService = inject(CheckoutService);
  protected readonly authService = inject(AuthService);
  protected readonly cartService = inject(CartService);

  protected readonly navbarIcon = 'assets/exito-logo.svg';
  protected readonly currency = 'USD';
  protected readonly loading = signal(true);
  protected readonly processing = signal(false);
  protected readonly updatingItemId = signal<number | null>(null);
  protected readonly session = signal<CheckoutSession | null>(null);

  protected readonly items = computed(
    () => this.cartService.cart()?.items ?? [],
  );

  protected readonly subtotal = computed(() =>
    this.items().reduce((sum, i) => sum + i.unitPrice * i.quantity, 0),
  );

  protected readonly tax = computed(() =>
    this.items().reduce(
      (sum, i) =>
        sum + (i.unitPrice * i.quantity * (i.product?.taxPercent ?? 0)) / 100,
      0,
    ),
  );

  protected readonly total = computed(() => this.subtotal() + this.tax());

  protected readonly totalPoints = computed(() =>
    this.items().reduce(
      (sum, i) => sum + (i.product?.valuePoints ?? 0) * i.quantity,
      0,
    ),
  );

  ngOnInit(): void {
    this.cartService
      .loadCart()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.loading.set(false),
        error: () => this.loading.set(false),
      });
  }

  protected lineTotal(item: CartItem): number {
    return item.unitPrice * item.quantity;
  }

  protected increment(item: CartItem): void {
    this.changeQuantity(item, item.quantity + 1);
  }

  protected decrement(item: CartItem): void {
    if (item.quantity <= 1) {
      this.removeItem(item);
      return;
    }
    this.changeQuantity(item, item.quantity - 1);
  }

  private changeQuantity(item: CartItem, quantity: number): void {
    if (this.updatingItemId() !== null) return;
    this.updatingItemId.set(item.id);
    this.cartService
      .updateItem(item.id, quantity)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.updatingItemId.set(null),
        error: () => {
          this.toastr.error('No se pudo actualizar la cantidad', 'Error');
          this.updatingItemId.set(null);
        },
      });
  }

  protected removeItem(item: CartItem): void {
    if (this.updatingItemId() !== null) return;
    this.updatingItemId.set(item.id);
    this.cartService
      .removeItem(item.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toastr.success(`${item.product?.name ?? 'Producto'} eliminado`);
          this.updatingItemId.set(null);
        },
        error: () => {
          this.toastr.error('No se pudo eliminar el producto', 'Error');
          this.updatingItemId.set(null);
        },
      });
  }

  protected pay(): void {
    if (this.processing() || this.items().length === 0) return;

    this.processing.set(true);
    this.checkoutService
      .createCoinpaymentsCheckout(this.total(), this.currency)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: session => {
          this.session.set(session);
          this.processing.set(false);
          this.toastr.success('Pago creado con CoinPayments');
        },
        error: () => {
          this.toastr.error('No se pudo iniciar el pago', 'Error');
          this.processing.set(false);
        },
      });
  }

  protected goToCoinpayments(): void {
    const url = this.session()?.checkoutUrl;
    if (url) window.open(url, '_blank', 'noopener');
  }

  protected backToProducts(): void {
    this.router.navigate(['/products']);
  }

  protected trackById(_i: number, item: CartItem): number {
    return item.id;
  }
}
