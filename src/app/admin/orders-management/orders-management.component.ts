import {
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { PaginationMeta } from '@app/core/interfaces/pagination-request';
import { StatsCardComponent, StatsCardData } from '@app/shared/components';
import {
  AdminOrder,
  OrderStatus,
  ORDER_STATUS_LABELS,
  VALID_NEXT_STATUSES,
  OrdersAdminService,
} from '@app/core/service/orders-admin-service';

@Component({
  selector: 'app-orders-management',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, StatsCardComponent],
  templateUrl: './orders-management.component.html',
  styleUrls: ['./orders-management.component.scss'],
})
export class OrdersManagementComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly ordersService = inject(OrdersAdminService);
  private readonly toastr = inject(ToastrService);

  protected readonly STATUS_LABELS = ORDER_STATUS_LABELS;
  protected readonly ALL_STATUSES = Object.keys(ORDER_STATUS_LABELS) as OrderStatus[];

  protected readonly orders = signal<AdminOrder[]>([]);
  protected readonly loading = signal(false);
  protected readonly savingId = signal<number | null>(null);
  protected readonly selectedOrder = signal<AdminOrder | null>(null);
  protected readonly statusFilter = signal<OrderStatus | ''>('');

  protected get statusFilterValue(): OrderStatus | '' {
    return this.statusFilter();
  }
  protected set statusFilterValue(v: OrderStatus | '') {
    this.statusFilter.set(v);
  }
  protected readonly pendingStatus = signal<Record<number, OrderStatus>>({});

  protected readonly meta = signal<PaginationMeta>({
    total: 0,
    page: 1,
    limit: 15,
    totalPages: 0,
  });

  protected readonly statsCards = signal<StatsCardData[]>([
    { title: 'Total Órdenes', value: '0', subtitle: 'Registradas', icon: 'shopping-cart', iconColor: 'blue', valueColor: 'primary' },
    { title: 'Pendientes', value: '0', subtitle: 'Por pagar', icon: 'clock', iconColor: 'orange', valueColor: 'warning' },
    { title: 'Pagadas', value: '0', subtitle: 'Completadas', icon: 'check-circle', iconColor: 'green', valueColor: 'success' },
    { title: 'Canceladas', value: '0', subtitle: 'No completadas', icon: 'x-circle', iconColor: 'orange', valueColor: 'danger' },
  ]);

  protected readonly pages = computed(() =>
    Array.from({ length: this.meta().totalPages }, (_, i) => i + 1),
  );

  ngOnInit(): void {
    this.loadOrders();
  }

  protected loadOrders(page = 1): void {
    this.loading.set(true);
    const status = this.statusFilter() || undefined;
    this.ordersService
      .getAll(page, this.meta().limit, status)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: response => {
          this.orders.set(response.data ?? []);
          this.meta.set(response.meta);
          this.updateStats(response.data ?? [], response.meta.total);
          this.loading.set(false);
        },
        error: () => {
          this.toastr.error('No se pudieron cargar las órdenes', 'Error');
          this.loading.set(false);
        },
      });
  }

  private updateStats(orders: AdminOrder[], total: number): void {
    const pending = orders.filter(o => o.status === 'pending_payment').length;
    const paid = orders.filter(o =>
      ['paid', 'processing', 'shipped', 'delivered'].includes(o.status),
    ).length;
    const cancelled = orders.filter(o =>
      ['cancelled', 'refunded'].includes(o.status),
    ).length;

    this.statsCards.update(cards => {
      cards[0].value = total.toString();
      cards[1].value = pending.toString();
      cards[2].value = paid.toString();
      cards[3].value = cancelled.toString();
      return [...cards];
    });
  }

  protected onFilterChange(): void {
    this.loadOrders(1);
  }

  protected selectOrder(order: AdminOrder): void {
    if (this.selectedOrder()?.id === order.id) {
      this.selectedOrder.set(null);
      return;
    }
    this.loading.set(true);
    this.ordersService
      .getById(order.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: detail => {
          this.selectedOrder.set(detail);
          this.loading.set(false);
        },
        error: () => {
          this.toastr.error('No se pudo cargar el detalle', 'Error');
          this.loading.set(false);
        },
      });
  }

  protected closeDetail(): void {
    this.selectedOrder.set(null);
  }

  protected nextStatuses(order: AdminOrder): OrderStatus[] {
    return VALID_NEXT_STATUSES[order.status] ?? [];
  }

  protected setPending(orderId: number, status: OrderStatus): void {
    this.pendingStatus.update(map => ({ ...map, [orderId]: status }));
  }

  protected getPending(orderId: number): OrderStatus | undefined {
    return this.pendingStatus()[orderId];
  }

  protected saveStatus(order: AdminOrder): void {
    const newStatus = this.getPending(order.id);
    if (!newStatus || this.savingId() !== null) return;

    this.savingId.set(order.id);
    this.ordersService
      .updateStatus(order.id, newStatus)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: updated => {
          this.orders.update(list =>
            list.map(o => (o.id === updated.id ? { ...o, status: updated.status } : o)),
          );
          if (this.selectedOrder()?.id === updated.id) {
            this.selectedOrder.update(o => (o ? { ...o, status: updated.status } : o));
          }
          this.pendingStatus.update(map => {
            const next = { ...map };
            delete next[order.id];
            return next;
          });
          this.toastr.success(`Orden #${updated.id} actualizada a "${ORDER_STATUS_LABELS[updated.status]}"`);
          this.savingId.set(null);
        },
        error: () => {
          this.toastr.error('No se pudo actualizar el estado', 'Error');
          this.savingId.set(null);
        },
      });
  }

  protected statusBadgeClass(status: OrderStatus): string {
    const map: Record<OrderStatus, string> = {
      pending_payment: 'badge-warning',
      paid: 'badge-success',
      processing: 'badge-info',
      shipped: 'badge-primary',
      delivered: 'badge-success',
      cancelled: 'badge-danger',
      refunded: 'badge-secondary',
    };
    return `badge ${map[status] ?? 'badge-secondary'}`;
  }

  protected onPageChange(page: number): void {
    this.loadOrders(page);
  }

  protected trackById(_i: number, item: { id: number }): number {
    return item.id;
  }
}
