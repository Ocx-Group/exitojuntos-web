import {
  Component,
  DestroyRef,
  HostListener,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Product } from '@app/core/interfaces/product';
import { ProductsService } from '@app/core/service/products-service';

@Component({
  selector: 'app-product-detail-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './product-detail-page.component.html',
  styleUrls: ['./product-detail-page.component.scss'],
})
export class ProductDetailPageComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly productsService = inject(ProductsService);
  private readonly route = inject(ActivatedRoute);

  protected readonly navbarIcon = 'assets/exito-logo.svg';
  protected readonly product = signal<Product | null>(null);
  protected readonly categoryName = signal('');
  protected readonly loading = signal(true);
  protected readonly notFound = signal(false);
  protected isScrolled = false;

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

  @HostListener('window:scroll')
  onScroll(): void { this.isScrolled = window.scrollY > 60; }

  protected getDiscountedPrice(product: Product): number {
    if (!product.discountPercent) return product.price;
    return product.price * (1 - product.discountPercent / 100);
  }

  protected openSignin(): void { window.open('/signin', '_blank'); }
}
