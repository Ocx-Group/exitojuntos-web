import { CommonModule } from '@angular/common';
import {
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '@app/core/service/authentication-service/auth.service';
import { CartService } from '@app/core/service/cart-service';
import { ReferralService } from '@app/core/service/referral-service';
import { StoresService } from '@app/core/service/stores-service';
import { Store, StoreCatalogItem } from '@app/core/interfaces/store';
import { PublicNavbarComponent } from '@app/shared/components/public-navbar/public-navbar.component';

@Component({
  selector: 'app-storefront',
  standalone: true,
  imports: [CommonModule, RouterLink, PublicNavbarComponent],
  templateUrl: './storefront.component.html',
  styleUrls: ['./storefront.component.scss'],
})
export class StorefrontComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly storesService = inject(StoresService);
  private readonly referralService = inject(ReferralService);
  private readonly toastr = inject(ToastrService);
  protected readonly authService = inject(AuthService);
  protected readonly cartService = inject(CartService);

  protected readonly store = signal<Store | null>(null);
  protected readonly products = signal<StoreCatalogItem[]>([]);
  protected readonly loading = signal(true);
  protected readonly notFound = signal(false);
  protected readonly addingToCart = signal<number | null>(null);
  protected readonly skeletons = Array.from({ length: 8 });

  protected readonly isAdmin = computed(
    () =>
      this.authService.userAffiliate()?.role?.name?.toLowerCase() === 'admin',
  );

  ngOnInit(): void {
    const token = this.route.snapshot.paramMap.get('token');
    if (!token) {
      this.notFound.set(true);
      this.loading.set(false);
      return;
    }
    // Atribución: cualquiera que abra el escaparate queda referido a esta tienda.
    this.referralService.capture(token);
    this.loadStore(token);
  }

  private loadStore(token: string): void {
    this.loading.set(true);
    this.storesService
      .getByToken(token)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: store => {
          this.store.set(store);
          this.loadCatalog(token);
        },
        error: () => {
          this.notFound.set(true);
          this.loading.set(false);
        },
      });
  }

  private loadCatalog(token: string): void {
    this.storesService
      .getCatalog(token, 1, 100)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: res => {
          this.products.set(res.data ?? []);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  protected getDiscountedPrice(product: StoreCatalogItem): number {
    if (!product.discountPercent) return product.price;
    return product.price * (1 - product.discountPercent / 100);
  }

  protected addToCart(product: StoreCatalogItem, event?: Event): void {
    event?.stopPropagation();
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/signin']);
      return;
    }
    if (this.isAdmin()) return;
    if (this.addingToCart() === product.id) return;

    this.addingToCart.set(product.id);
    this.cartService
      .addItem(product.id, 1)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toastr.success(`${product.name} añadido al carrito`);
          this.addingToCart.set(null);
        },
        error: () => {
          this.toastr.error('No se pudo añadir al carrito', 'Error');
          this.addingToCart.set(null);
        },
      });
  }

  protected goToProduct(id: number): void {
    this.router.navigate(['/products', id]);
  }

  protected trackById(_i: number, item: { id: number }): number {
    return item.id;
  }
}
