import {
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ToastrService } from 'ngx-toastr';
import { Product } from '@app/core/interfaces/product';
import { ProductsService } from '@app/core/service/products-service';
import { AuthService } from '@app/core/service/authentication-service/auth.service';
import { CartService } from '@app/core/service/cart-service';
import { PublicNavbarComponent } from '@app/shared/components/public-navbar/public-navbar.component';

@Component({
  selector: 'app-product-detail-page',
  standalone: true,
  imports: [CommonModule, RouterLink, PublicNavbarComponent],
  templateUrl: './product-detail-page.component.html',
  styleUrls: ['./product-detail-page.component.scss'],
})
export class ProductDetailPageComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly productsService = inject(ProductsService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toastr = inject(ToastrService);
  protected readonly authService = inject(AuthService);
  protected readonly cartService = inject(CartService);

  protected readonly navbarIcon = 'assets/exito-logo.svg';
  protected readonly product = signal<Product | null>(null);
  protected readonly categoryName = signal('');
  protected readonly loading = signal(true);
  protected readonly notFound = signal(false);
  protected readonly addingToCart = signal(false);

  protected readonly isAdmin = computed(
    () => this.authService.userAffiliate()?.role?.name?.toLowerCase() === 'admin',
  );

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) { this.notFound.set(true); this.loading.set(false); return; }

    this.productsService.getById(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: product => {
          this.product.set(product);
          this.loading.set(false);
          this.loadCategory(product.productCategoryId);
        },
        error: () => { this.notFound.set(true); this.loading.set(false); },
      });

  }

  private loadCategory(categoryId: number): void {
    this.productsService.getAllCategories(1, 100)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: res => {
          const cat = res.data?.find(c => c.id === categoryId);
          this.categoryName.set(cat?.name ?? '');
        },
      });
  }

  protected getDiscountedPrice(product: Product): number {
    if (!product.discountPercent) return product.price;
    return product.price * (1 - product.discountPercent / 100);
  }

  protected addToCart(): void {
    const p = this.product();
    if (!p) return;

    if (!this.authService.isLoggedIn()) {
      this.openSignin();
      return;
    }
    if (this.isAdmin()) return;
    if (this.addingToCart()) return;

    this.addingToCart.set(true);
    this.cartService
      .addItem(p.id, 1)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toastr.success(`${p.name} añadido al carrito`);
          this.addingToCart.set(false);
        },
        error: () => {
          this.toastr.error('No se pudo añadir al carrito', 'Error');
          this.addingToCart.set(false);
        },
      });
  }

  protected openSignin(): void { this.router.navigate(['/signin']); }
}
