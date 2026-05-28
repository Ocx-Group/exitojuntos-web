import { Component, DestroyRef, ElementRef, OnInit, ViewChild, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';

import { Product, ProductCategory } from '@app/core/interfaces/product';
import { PaginationMeta } from '@app/core/interfaces/pagination-request';
import { ProductsService } from '@app/core/service/products-service';
import { StorageService } from '@app/core/service/storage-service/storage.service';
import { StatsCardComponent, StatsCardData } from '@app/shared/components';

@Component({
  selector: 'app-products-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, StatsCardComponent],
  templateUrl: './products-management.component.html',
  styleUrls: ['./products-management.component.scss'],
})
export class ProductsManagementComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly productsService = inject(ProductsService);
  private readonly storageService = inject(StorageService);
  private readonly toastr = inject(ToastrService);

  @ViewChild('fileInput') fileInputRef!: ElementRef<HTMLInputElement>;

  protected readonly activeTab = signal<'products' | 'categories'>('products');

  // ─── Products state ────────────────────────────────────────────────
  protected readonly products = signal<Product[]>([]);
  protected readonly loadingProducts = signal(false);
  protected readonly savingProduct = signal(false);
  protected readonly uploadingImage = signal(false);
  protected readonly imagePreview = signal<string | null>(null);
  protected readonly editingProductId = signal<number | null>(null);
  protected readonly productsMeta = signal<PaginationMeta>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  });

  // ─── Categories state ──────────────────────────────────────────────
  protected readonly categories = signal<ProductCategory[]>([]);
  protected readonly loadingCategories = signal(false);
  protected readonly savingCategory = signal(false);
  protected readonly editingCategoryId = signal<number | null>(null);

  // ─── Stats ─────────────────────────────────────────────────────────
  protected statsCards: StatsCardData[] = [];

  // ─── Product form ──────────────────────────────────────────────────
  protected readonly productForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(255)]],
    price: [0, [Validators.required, Validators.min(0.01)]],
    description: [''],
    image: [''],
    state: [true],
    offers: [false],
    taxPercent: [0, [Validators.min(0)]],
    valuePoints: [0, [Validators.min(0)]],
    discountPercent: [0, [Validators.min(0)]],
    productCategoryId: [0, [Validators.required, Validators.min(1)]],
  });

  // ─── Category form ─────────────────────────────────────────────────
  protected readonly categoryForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(255)]],
    description: [''],
  });

  ngOnInit(): void {
    this.loadCategories();
    this.loadProducts();
    this.initStatsCards();
  }

  // ─── Tab ────────────────────────────────────────────────────────────
  protected setTab(tab: 'products' | 'categories'): void {
    this.activeTab.set(tab);
  }

  // ─── Stats ──────────────────────────────────────────────────────────
  private initStatsCards(): void {
    this.statsCards = [
      {
        title: 'Total Productos',
        value: '0',
        subtitle: 'Registrados en el catálogo',
        icon: 'package',
        iconColor: 'blue',
        valueColor: 'primary',
      },
      {
        title: 'Productos Activos',
        value: '0',
        subtitle: 'Visibles en la tienda',
        icon: 'check-circle',
        iconColor: 'green',
        valueColor: 'success',
      },
      {
        title: 'En Oferta',
        value: '0',
        subtitle: 'Con descuento especial',
        icon: 'tag',
        iconColor: 'orange',
        valueColor: 'warning',
      },
      {
        title: 'Categorías',
        value: '0',
        subtitle: 'Grupos de productos',
        icon: 'grid',
        iconColor: 'cyan',
        valueColor: 'info',
      },
    ];
  }

  private updateStatsCards(): void {
    const meta = this.productsMeta();
    const prods = this.products();
    const activeCount = prods.filter(p => p.state).length;
    const offersCount = prods.filter(p => p.offers).length;

    this.statsCards[0].value = meta.total.toString();
    this.statsCards[1].value = activeCount.toString();
    this.statsCards[2].value = offersCount.toString();
    this.statsCards[3].value = this.categories().length.toString();
  }

  // ─── Products ────────────────────────────────────────────────────────
  protected loadProducts(page = 1, limit = 10): void {
    this.loadingProducts.set(true);
    this.productsService
      .getAllAdmin(page, limit)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: response => {
          this.products.set(response.data ?? []);
          if (response.meta) this.productsMeta.set(response.meta);
          this.updateStatsCards();
          this.loadingProducts.set(false);
        },
        error: () => {
          this.toastr.error('No se pudieron cargar los productos', 'Error');
          this.loadingProducts.set(false);
        },
      });
  }

  protected saveProduct(): void {
    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      return;
    }

    const value = this.productForm.getRawValue();
    const payload = {
      name: value.name.trim(),
      price: Number(value.price),
      description: value.description.trim() || undefined,
      image: value.image.trim() || undefined,
      state: value.state,
      offers: value.offers,
      taxPercent: Number(value.taxPercent),
      valuePoints: Number(value.valuePoints),
      discountPercent: Number(value.discountPercent),
      productCategoryId: Number(value.productCategoryId),
    };

    const editingId = this.editingProductId();
    const request$ = editingId
      ? this.productsService.update(editingId, payload)
      : this.productsService.create(payload);

    this.savingProduct.set(true);
    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.toastr.success(
          editingId ? 'Producto actualizado' : 'Producto creado correctamente',
        );
        this.resetProductForm();
        this.loadProducts(this.productsMeta().page, this.productsMeta().limit);
        this.savingProduct.set(false);
      },
      error: () => {
        this.toastr.error('No se pudo guardar el producto', 'Error');
        this.savingProduct.set(false);
      },
    });
  }

  protected editProduct(product: Product): void {
    this.editingProductId.set(product.id);
    this.imagePreview.set(product.image ?? null);
    this.productForm.patchValue({
      name: product.name,
      price: product.price,
      description: product.description ?? '',
      image: product.image ?? '',
      state: product.state,
      offers: product.offers,
      taxPercent: product.taxPercent,
      valuePoints: product.valuePoints,
      discountPercent: product.discountPercent,
      productCategoryId: product.productCategoryId,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  protected onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!ALLOWED.includes(file.type)) {
      this.toastr.error('Solo se permiten imágenes JPEG, PNG, WebP o GIF', 'Formato inválido');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      this.toastr.error('La imagen no debe superar 5 MB', 'Archivo muy grande');
      return;
    }

    // Mostrar preview local inmediatamente
    const reader = new FileReader();
    reader.onload = e => this.imagePreview.set(e.target?.result as string);
    reader.readAsDataURL(file);

    // Subir al bucket
    this.uploadingImage.set(true);
    this.storageService
      .uploadImage(file)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: url => {
          this.productForm.patchValue({ image: url });
          this.uploadingImage.set(false);
          this.toastr.success('Imagen subida correctamente');
        },
        error: () => {
          this.imagePreview.set(this.productForm.value.image ?? null);
          this.toastr.error('No se pudo subir la imagen', 'Error');
          this.uploadingImage.set(false);
        },
      });

    // Limpiar el input para permitir volver a seleccionar el mismo archivo
    input.value = '';
  }

  protected clearImage(): void {
    this.imagePreview.set(null);
    this.productForm.patchValue({ image: '' });
    if (this.fileInputRef?.nativeElement) {
      this.fileInputRef.nativeElement.value = '';
    }
  }

  protected deleteProduct(product: Product): void {
    Swal.fire({
      title: '¿Eliminar producto?',
      text: `Se eliminará "${product.name}" del catálogo.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    }).then(result => {
      if (!result.isConfirmed) return;
      this.loadingProducts.set(true);
      this.productsService
        .delete(product.id)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.toastr.success('Producto eliminado');
            this.loadProducts(
              this.productsMeta().page,
              this.productsMeta().limit,
            );
          },
          error: () => {
            this.toastr.error('No se pudo eliminar el producto', 'Error');
            this.loadingProducts.set(false);
          },
        });
    });
  }

  protected resetProductForm(): void {
    this.editingProductId.set(null);
    this.imagePreview.set(null);
    if (this.fileInputRef?.nativeElement) {
      this.fileInputRef.nativeElement.value = '';
    }
    this.productForm.reset({
      name: '',
      price: 0,
      description: '',
      image: '',
      state: true,
      offers: false,
      taxPercent: 0,
      valuePoints: 0,
      discountPercent: 0,
      productCategoryId: 0,
    });
  }

  protected onProductsPageChange(page: number): void {
    this.loadProducts(page, this.productsMeta().limit);
  }

  protected get productPages(): number[] {
    return Array.from(
      { length: this.productsMeta().totalPages },
      (_, i) => i + 1,
    );
  }

  // ─── Categories ───────────────────────────────────────────────────────
  protected loadCategories(): void {
    this.loadingCategories.set(true);
    this.productsService
      .getAllCategories()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: response => {
          this.categories.set(response.data ?? []);
          this.updateStatsCards();
          this.loadingCategories.set(false);
        },
        error: () => {
          this.toastr.error('No se pudieron cargar las categorías', 'Error');
          this.loadingCategories.set(false);
        },
      });
  }

  protected saveCategory(): void {
    if (this.categoryForm.invalid) {
      this.categoryForm.markAllAsTouched();
      return;
    }

    const value = this.categoryForm.getRawValue();
    const payload = {
      name: value.name.trim(),
      description: value.description.trim() || undefined,
    };

    const editingId = this.editingCategoryId();
    const request$ = editingId
      ? this.productsService.updateCategory(editingId, payload)
      : this.productsService.createCategory(payload);

    this.savingCategory.set(true);
    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.toastr.success(
          editingId
            ? 'Categoría actualizada'
            : 'Categoría creada correctamente',
        );
        this.resetCategoryForm();
        this.loadCategories();
        this.savingCategory.set(false);
      },
      error: () => {
        this.toastr.error('No se pudo guardar la categoría', 'Error');
        this.savingCategory.set(false);
      },
    });
  }

  protected editCategory(category: ProductCategory): void {
    this.editingCategoryId.set(category.id);
    this.categoryForm.patchValue({
      name: category.name,
      description: category.description ?? '',
    });
  }

  protected deleteCategory(category: ProductCategory): void {
    Swal.fire({
      title: '¿Eliminar categoría?',
      text: `Se eliminará la categoría "${category.name}". Los productos asociados perderán su categoría.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    }).then(result => {
      if (!result.isConfirmed) return;
      this.loadingCategories.set(true);
      this.productsService
        .deleteCategory(category.id)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.toastr.success('Categoría eliminada');
            this.loadCategories();
          },
          error: () => {
            this.toastr.error('No se pudo eliminar la categoría', 'Error');
            this.loadingCategories.set(false);
          },
        });
    });
  }

  protected resetCategoryForm(): void {
    this.editingCategoryId.set(null);
    this.categoryForm.reset({ name: '', description: '' });
  }

  protected trackById(_i: number, item: { id: number }): number {
    return item.id;
  }

  protected getCategoryName(id: number): string {
    return this.categories().find(c => c.id === id)?.name ?? '—';
  }

  protected getProductCountForCategory(categoryId: number): number {
    return this.products().filter(p => p.productCategoryId === categoryId)
      .length;
  }
}
