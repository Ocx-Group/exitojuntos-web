import {
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';
import { PaginationMeta } from '@app/core/interfaces/pagination-request';
import {
  MyOrder,
  MyOrderStatus,
  MY_ORDER_STATUS_LABELS,
  MyOrdersService,
} from '@app/core/service/my-orders-service';

@Component({
  selector: 'app-my-orders',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './my-orders.component.html',
  styleUrls: ['./my-orders.component.scss'],
})
export class MyOrdersComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly ordersService = inject(MyOrdersService);
  private readonly toastr = inject(ToastrService);

  protected readonly STATUS_LABELS = MY_ORDER_STATUS_LABELS;
  protected readonly ALL_STATUSES = Object.keys(
    MY_ORDER_STATUS_LABELS,
  ) as MyOrderStatus[];

  protected readonly orders = signal<MyOrder[]>([]);
  protected readonly loading = signal(true);
  protected readonly cancellingId = signal<number | null>(null);
  protected readonly selectedOrder = signal<MyOrder | null>(null);
  protected readonly loadingDetail = signal(false);

  protected readonly meta = signal<PaginationMeta>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  });

  protected readonly pages = computed(() =>
    Array.from({ length: this.meta().totalPages }, (_, i) => i + 1),
  );

  ngOnInit(): void {
    this.load();
  }

  protected load(page = 1): void {
    this.loading.set(true);
    this.ordersService
      .getAll(page, this.meta().limit)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: res => {
          this.orders.set(res.data ?? []);
          this.meta.set(res.meta);
          this.loading.set(false);
        },
        error: () => {
          this.toastr.error('No se pudieron cargar tus órdenes', 'Error');
          this.loading.set(false);
        },
      });
  }

  protected viewDetail(order: MyOrder): void {
    if (this.selectedOrder()?.id === order.id) {
      this.selectedOrder.set(null);
      return;
    }
    this.loadingDetail.set(true);
    this.ordersService
      .getById(order.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: detail => {
          this.selectedOrder.set(detail);
          this.loadingDetail.set(false);
        },
        error: () => {
          this.toastr.error('No se pudo cargar el detalle', 'Error');
          this.loadingDetail.set(false);
        },
      });
  }

  protected closeDetail(): void {
    this.selectedOrder.set(null);
  }

  protected canCancel(order: MyOrder): boolean {
    return ['pending_payment', 'paid'].includes(order.status);
  }

  protected cancelOrder(order: MyOrder): void {
    Swal.fire({
      title: '¿Cancelar orden?',
      text: `Se cancelará la orden #${order.id}. Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, cancelar',
      cancelButtonText: 'No',
    }).then(result => {
      if (!result.isConfirmed) return;
      this.cancellingId.set(order.id);
      this.ordersService
        .cancel(order.id)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: updated => {
            this.orders.update(list =>
              list.map(o =>
                o.id === updated.id ? { ...o, status: updated.status } : o,
              ),
            );
            if (this.selectedOrder()?.id === updated.id) {
              this.selectedOrder.update(o =>
                o ? { ...o, status: updated.status } : o,
              );
            }
            this.toastr.success(`Orden #${updated.id} cancelada`);
            this.cancellingId.set(null);
          },
          error: () => {
            this.toastr.error('No se pudo cancelar la orden', 'Error');
            this.cancellingId.set(null);
          },
        });
    });
  }

  protected statusClass(status: MyOrderStatus): string {
    const map: Record<MyOrderStatus, string> = {
      pending_payment: 'status-pending_payment',
      paid: 'status-paid',
      processing: 'status-processing',
      shipped: 'status-shipped',
      delivered: 'status-delivered',
      cancelled: 'status-cancelled',
      refunded: 'status-refunded',
    };
    return map[status] ?? '';
  }

  protected lineTotal(d: { unitPrice: number; quantity: number }): number {
    return d.unitPrice * d.quantity;
  }

  protected onPageChange(page: number): void {
    this.load(page);
  }

  protected trackById(_i: number, item: { id: number }): number {
    return item.id;
  }
}
