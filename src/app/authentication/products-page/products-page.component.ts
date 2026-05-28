import {
  Component,
  DestroyRef,
  HostListener,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Product, ProductCategory } from '@app/core/interfaces/product';
import { ProductsService } from '@app/core/service/products-service';

@Component({
  selector: 'app-products-page',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './products-page.component.html',
  styleUrls: ['./products-page.component.scss'],
})
export class ProductsPageComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly productsService = inject(ProductsService);
  private readonly router = inject(Router);

  protected readonly navbarIcon = 'assets/exito-logo.svg';
  protected readonly allProducts = signal<Product[]>([]);
  protected readonly categories = signal<ProductCategory[]>([]);
  protected readonly loading = signal(true);
  protected readonly activeCategoryId = signal<number | null>(null);
  protected readonly searchTerm = signal('');
  protected isScrolled = false;

  protected readonly filteredProducts = computed(() => {
    let list = this.allProducts();
    const catId = this.activeCategoryId();
    const term = this.searchTerm().trim().toLowerCase();
    if (catId !== null) list = list.filter(p => p.productCategoryId === catId);
    if (term) list = list.filter(
      p => p.name.toLowerCase().includes(term) || p.description?.toLowerCase().includes(term),
    );
    return list;
  });

  ngOnInit(): void {
    this.loadCategories();
    this.loadProducts();
  }

  @HostListener('window:scroll')
  onScroll(): void {
    this.isScrolled = window.scrollY > 60;
  }

  private loadProducts(): void {
    this.loading.set(true);
    this.productsService
      .getActive(1, 100)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: res => { this.allProducts.set(res.data ?? []); this.loading.set(false); },
        error: () => this.loading.set(false),
      });
  }

  private loadCategories(): void {
    this.productsService
      .getAllCategories(1, 100)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: res => this.categories.set(res.data ?? []) });
  }

  protected setCategory(id: number | null): void { this.activeCategoryId.set(id); }
  protected onSearch(value: string): void { this.searchTerm.set(value); }

  protected goToProduct(id: number): void {
    this.router.navigate(['/products', id]);
  }

  protected getCategoryName(id: number): string {
    return this.categories().find(c => c.id === id)?.name ?? '';
  }

  protected getDiscountedPrice(product: Product): number {
    if (!product.discountPercent) return product.price;
    return product.price * (1 - product.discountPercent / 100);
  }

  protected getCategoryCount(categoryId: number): number {
    return this.allProducts().filter(p => p.productCategoryId === categoryId).length;
  }

  protected trackById(_i: number, item: { id: number }): number { return item.id; }
  protected openSignin(): void { window.open('/signin', '_blank'); }
  protected readonly skeletons = Array.from({ length: 8 });
}
