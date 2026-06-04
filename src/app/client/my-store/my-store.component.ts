import { CommonModule } from '@angular/common';
import {
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { Product } from '@app/core/interfaces/product';
import {
  Store,
  StoreFeaturedProduct,
  UpdateStorePayload,
} from '@app/core/interfaces/store';
import { ProductsService } from '@app/core/service/products-service';
import { StoresService } from '@app/core/service/stores-service';
import { StorageService } from '@app/core/service/storage-service/storage.service';
import { ImageCropperDialogComponent } from '@app/shared/components/image-cropper/image-cropper-dialog.component';
import {
  MY_ORDER_STATUS_LABELS,
  MyOrder,
  MyOrderStatus,
  MyOrdersService,
} from '@app/core/service/my-orders-service';
import { PaginationMeta } from '@app/core/interfaces/pagination-request';

type Tab = 'share' | 'products' | 'sales';

@Component({
  selector: 'app-my-store',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, ImageCropperDialogComponent, TranslateModule],
  templateUrl: './my-store.component.html',
  styleUrls: ['./my-store.component.scss'],
})
export class MyStoreComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly storesService = inject(StoresService);
  private readonly productsService = inject(ProductsService);
  private readonly ordersService = inject(MyOrdersService);
  private readonly storageService = inject(StorageService);
  private readonly toastr = inject(ToastrService);

  protected readonly STATUS_LABELS = MY_ORDER_STATUS_LABELS;

  protected readonly tab = signal<Tab>('share');
  protected readonly store = signal<Store | null>(null);
  protected readonly loading = signal(true);
  protected readonly saving = signal(false);

  // Branding editable
  protected readonly form = signal<UpdateStorePayload>({});
  protected readonly uploadingLogo = signal(false);
  protected readonly uploadingBanner = signal(false);

  // Recorte: imagen seleccionada y campo destino mientras está abierto el diálogo.
  protected readonly cropSrc = signal<string | null>(null);
  protected readonly cropField = signal<'logoUrl' | 'bannerUrl'>('logoUrl');

  // Config de recorte por tipo: logo cuadrado/redondo, banner panorámico 3:1.
  protected readonly CROP_CONFIG = {
    logoUrl: { aspect: 1, outputWidth: 256, round: true, title: 'MY-STORE-PAGE.CROP.LOGO' },
    bannerUrl: {
      aspect: 3,
      outputWidth: 1200,
      round: false,
      title: 'MY-STORE-PAGE.CROP.BANNER',
    },
  } as const;

  protected get cropConfig() {
    return this.CROP_CONFIG[this.cropField()];
  }

  // Productos
  protected readonly products = signal<Product[]>([]);
  protected readonly featuredIds = signal<Set<number>>(new Set());
  protected readonly togglingId = signal<number | null>(null);
  protected readonly productsLoading = signal(false);

  // Productos con el botón externo activado.
  protected readonly externalEnabledIds = signal<Set<number>>(new Set());
  protected readonly togglingExternalId = signal<number | null>(null);

  // Si el dueño aún no configuró el enlace global, el toggle no sirve.
  protected readonly hasGlobalLink = computed(
    () => !!this.store()?.externalUrl,
  );

  // Ventas
  protected readonly sales = signal<MyOrder[]>([]);
  protected readonly salesLoading = signal(false);
  protected readonly salesMeta = signal<PaginationMeta>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  });

  protected readonly shareUrl = computed(() => {
    const token = this.store()?.publicToken;
    return token ? this.storesService.buildShareUrl(token) : '';
  });

  protected readonly featuredCount = computed(() => this.featuredIds().size);

  protected readonly salesPages = computed(() =>
    Array.from({ length: this.salesMeta().totalPages }, (_, i) => i + 1),
  );

  ngOnInit(): void {
    this.loadStore();
  }

  private loadStore(): void {
    this.loading.set(true);
    this.storesService
      .getMyStore()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: store => {
          this.store.set(store);
          this.form.set({
            name: store.name ?? '',
            tagline: store.tagline ?? '',
            logoUrl: store.logoUrl ?? '',
            bannerUrl: store.bannerUrl ?? '',
            externalUrl: store.externalUrl ?? '',
            externalLabel: store.externalLabel ?? '',
            status: store.status,
          });
          this.loading.set(false);
        },
        error: () => {
          this.toastr.error('No se pudo cargar tu tienda', 'Error');
          this.loading.set(false);
        },
      });
  }

  protected setTab(tab: Tab): void {
    this.tab.set(tab);
    if (tab === 'products' && this.products().length === 0) this.loadProducts();
    if (tab === 'sales' && this.sales().length === 0) this.loadSales();
  }

  // ─── Branding ────────────────────────────────────────────────────

  protected updateField<K extends keyof UpdateStorePayload>(
    key: K,
    value: UpdateStorePayload[K],
  ): void {
    this.form.update(f => ({ ...f, [key]: value }));
  }

  protected saveBranding(): void {
    this.saving.set(true);
    this.storesService
      .updateMyStore(this.form())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: store => {
          this.store.set(store);
          this.toastr.success('Tienda actualizada');
          this.saving.set(false);
        },
        error: () => {
          this.toastr.error('No se pudo guardar', 'Error');
          this.saving.set(false);
        },
      });
  }

  protected copyLink(): void {
    const url = this.shareUrl();
    if (!url) return;
    navigator.clipboard?.writeText(url).then(
      () => this.toastr.success('Enlace copiado'),
      () => this.toastr.error('No se pudo copiar'),
    );
  }

  protected onLogoSelected(event: Event): void {
    this.openCropper(event, 'logoUrl');
  }

  protected onBannerSelected(event: Event): void {
    this.openCropper(event, 'bannerUrl');
  }

  protected clearImage(field: 'logoUrl' | 'bannerUrl'): void {
    this.updateField(field, '');
  }

  /** Valida el archivo y abre el diálogo de recorte. */
  private openCropper(event: Event, field: 'logoUrl' | 'bannerUrl'): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowed.includes(file.type)) {
      this.toastr.error('Solo JPEG, PNG, WebP o GIF', 'Formato inválido');
      input.value = '';
      return;
    }
    // Límite generoso para el origen; el recorte reduce el peso final.
    if (file.size > 15 * 1024 * 1024) {
      this.toastr.error('La imagen no debe superar 15 MB', 'Archivo muy grande');
      input.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = e => {
      this.cropField.set(field);
      this.cropSrc.set(e.target?.result as string);
    };
    reader.readAsDataURL(file);
    input.value = '';
  }

  protected onCropCancelled(): void {
    this.cropSrc.set(null);
  }

  /** Recibe el recorte (Blob), lo sube y guarda la URL en el formulario. */
  protected onCropped(blob: Blob): void {
    const field = this.cropField();
    this.cropSrc.set(null);

    const uploading =
      field === 'logoUrl' ? this.uploadingLogo : this.uploadingBanner;
    const file = new File([blob], `${field}-${Date.now()}.jpg`, {
      type: 'image/jpeg',
    });

    uploading.set(true);
    this.storageService
      .uploadStoreAsset(file)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: url => {
          this.updateField(field, url);
          uploading.set(false);
          this.toastr.success('Imagen subida');
        },
        error: () => {
          this.toastr.error('No se pudo subir la imagen', 'Error');
          uploading.set(false);
        },
      });
  }

  // ─── Productos destacados ────────────────────────────────────────

  private loadProducts(): void {
    this.productsLoading.set(true);
    this.productsService
      .getActive(1, 100)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: res => {
          this.products.set(res.data ?? []);
          this.loadFeatured();
        },
        error: () => {
          this.toastr.error('No se pudieron cargar los productos', 'Error');
          this.productsLoading.set(false);
        },
      });
  }

  private loadFeatured(): void {
    this.storesService
      .listFeatured()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: list => {
          this.featuredIds.set(
            new Set(list.filter(f => f.featured).map(f => f.productId)),
          );
          this.externalEnabledIds.set(
            new Set(list.filter(f => f.externalEnabled).map(f => f.productId)),
          );
          this.productsLoading.set(false);
        },
        error: () => this.productsLoading.set(false),
      });
  }

  protected isFeatured(productId: number): boolean {
    return this.featuredIds().has(productId);
  }

  protected toggleFeature(product: Product): void {
    if (this.togglingId() === product.id) return;
    this.togglingId.set(product.id);
    const featured = this.isFeatured(product.id);

    const request$: Observable<unknown> = featured
      ? this.storesService.unfeatureProduct(product.id)
      : this.storesService.featureProduct({ productId: product.id });

    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.featuredIds.update(set => {
          const next = new Set(set);
          if (featured) next.delete(product.id);
          else next.add(product.id);
          return next;
        });
        this.togglingId.set(null);
      },
      error: () => {
        this.toastr.error('No se pudo actualizar el destacado', 'Error');
        this.togglingId.set(null);
      },
    });
  }

  // ─── Botón externo por producto ──────────────────────────────────

  protected isExternalEnabled(productId: number): boolean {
    return this.externalEnabledIds().has(productId);
  }

  protected toggleExternal(product: Product, enabled: boolean): void {
    if (this.togglingExternalId() === product.id) return;
    this.togglingExternalId.set(product.id);
    this.storesService
      .setExternalEnabled(product.id, enabled)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.externalEnabledIds.update(set => {
            const next = new Set(set);
            if (enabled) next.add(product.id);
            else next.delete(product.id);
            return next;
          });
          this.togglingExternalId.set(null);
        },
        error: () => {
          this.toastr.error('No se pudo actualizar el botón externo', 'Error');
          this.togglingExternalId.set(null);
        },
      });
  }

  // ─── Ventas atribuidas ───────────────────────────────────────────

  protected loadSales(page = 1): void {
    this.salesLoading.set(true);
    this.ordersService
      .getStoreSales(page, this.salesMeta().limit)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: res => {
          this.sales.set(res.data ?? []);
          this.salesMeta.set(res.meta);
          this.salesLoading.set(false);
        },
        error: () => {
          this.toastr.error('No se pudieron cargar las ventas', 'Error');
          this.salesLoading.set(false);
        },
      });
  }

  protected statusLabel(status: MyOrderStatus): string {
    return this.STATUS_LABELS[status] ?? status;
  }

  protected statusClass(status: MyOrderStatus): string {
    return `status-${status}`;
  }

  protected trackById(_i: number, item: { id: number }): number {
    return item.id;
  }
}
