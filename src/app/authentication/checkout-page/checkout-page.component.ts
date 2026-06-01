import {
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  catchError,
  distinctUntilChanged,
  filter,
  interval,
  map,
  of,
  startWith,
  switchMap,
  take,
  takeWhile,
} from 'rxjs';
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
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    PublicNavbarComponent,
  ],
  templateUrl: './checkout-page.component.html',
  styleUrls: ['./checkout-page.component.scss'],
})
export class CheckoutPageComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly toastr = inject(ToastrService);
  private readonly fb = inject(FormBuilder);
  private readonly checkoutService = inject(CheckoutService);
  protected readonly authService = inject(AuthService);
  protected readonly cartService = inject(CartService);

  protected readonly shippingForm = this.fb.nonNullable.group({
    shippingName: ['', [Validators.required, Validators.maxLength(255)]],
    shippingEmail: ['', [Validators.required, Validators.email]],
    shippingAddress: ['', [Validators.required, Validators.maxLength(500)]],
    shippingCity: ['', [Validators.required, Validators.maxLength(100)]],
    shippingProvince: ['', [Validators.required, Validators.maxLength(100)]],
    shippingPostalCode: ['', [Validators.maxLength(20)]],
    shippingPhone: ['', [Validators.maxLength(20)]],
    notes: ['', [Validators.maxLength(1000)]],
  });

  protected readonly navbarIcon = 'assets/exito-logo.svg';
  protected readonly currency = 'USD';
  protected readonly loading = signal(true);
  protected readonly processing = signal(false);
  protected readonly updatingItemId = signal<number | null>(null);
  protected readonly session = signal<CheckoutSession | null>(null);
  protected readonly orderStatus = signal<string>('pending_payment');
  protected readonly checkingStatus = signal(false);

  protected readonly statusLabel = computed(() =>
    this.labelForStatus(this.orderStatus()),
  );
  protected readonly isPaid = computed(() =>
    this.isPaidStatus(this.orderStatus()),
  );
  protected readonly isCancelled = computed(() =>
    ['cancelled', 'refunded'].includes(this.orderStatus()),
  );

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
    this.prefillShipping();
    this.cartService
      .loadCart()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.loading.set(false),
        error: () => this.loading.set(false),
      });
  }

  /** Prellena el formulario con los datos del perfil del usuario autenticado. */
  private prefillShipping(): void {
    const user = this.authService.currentUserAffiliateValue;
    if (!user) return;
    this.shippingForm.patchValue({
      shippingName: `${user.name ?? ''} ${user.lastName ?? ''}`.trim(),
      shippingEmail: user.email ?? '',
      shippingAddress: user.address ?? '',
      shippingCity: user.city ?? '',
      shippingProvince: user.state ?? '',
      shippingPostalCode: user.zipCode ?? '',
      shippingPhone: user.phone ?? '',
    });
  }

  protected isInvalid(controlName: string): boolean {
    const control = this.shippingForm.get(controlName);
    return !!control && control.invalid && (control.touched || control.dirty);
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

    if (this.shippingForm.invalid) {
      this.shippingForm.markAllAsTouched();
      this.toastr.error('Completa los datos de envío', 'Faltan datos');
      return;
    }

    this.processing.set(true);
    this.checkoutService
      .createCoinpaymentsCheckout(this.shippingForm.getRawValue(), this.currency)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: session => {
          this.session.set(session);
          this.orderStatus.set('pending_payment');
          this.processing.set(false);
          this.toastr.success('Pago creado con CoinPayments');
          this.pollOrderStatus(session.orderId);
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

  /** Consulta el estado de la orden una sola vez (botón "Actualizar estado"). */
  protected refreshStatus(): void {
    const orderId = this.session()?.orderId;
    if (!orderId || this.checkingStatus()) return;
    this.checkingStatus.set(true);
    this.checkoutService
      .getOrderStatus(orderId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: result => {
          this.orderStatus.set(result.status);
          this.checkingStatus.set(false);
        },
        error: () => {
          this.checkingStatus.set(false);
          this.toastr.error('No se pudo consultar el estado', 'Error');
        },
      });
  }

  /**
   * Sondea el estado de la orden cada 5s (hasta ~5 min) hasta que el webhook de
   * CoinPayments la actualice (deja de estar en `pending_payment`).
   */
  private pollOrderStatus(orderId: number): void {
    this.checkingStatus.set(true);
    interval(5000)
      .pipe(
        startWith(0),
        take(60),
        switchMap(() =>
          this.checkoutService
            .getOrderStatus(orderId)
            .pipe(catchError(() => of(null))),
        ),
        map(result => result?.status),
        filter((status): status is string => !!status),
        distinctUntilChanged(),
        takeWhile(status => status === 'pending_payment', true),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: status => {
          this.orderStatus.set(status);
          if (status !== 'pending_payment') {
            this.checkingStatus.set(false);
            if (this.isPaidStatus(status)) {
              this.toastr.success('¡Pago confirmado!', 'Orden pagada');
            }
          }
        },
        complete: () => this.checkingStatus.set(false),
      });
  }

  private isPaidStatus(status: string): boolean {
    return ['paid', 'processing', 'shipped', 'delivered'].includes(status);
  }

  private labelForStatus(status: string): string {
    const labels: Record<string, string> = {
      pending_payment: 'Pendiente de pago',
      paid: 'Pagada',
      processing: 'En preparación',
      shipped: 'Enviada',
      delivered: 'Entregada',
      cancelled: 'Cancelada',
      refunded: 'Reembolsada',
    };
    return labels[status] ?? status;
  }

  protected backToProducts(): void {
    this.router.navigate(['/products']);
  }

  protected trackById(_i: number, item: CartItem): number {
    return item.id;
  }
}
