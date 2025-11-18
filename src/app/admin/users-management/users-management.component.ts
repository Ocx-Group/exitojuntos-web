import { Component, OnInit, DestroyRef, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink, Router } from '@angular/router';

// Servicios
import { AuthService } from '@app/core/service/authentication-service/auth.service';

// Componentes reutilizables
import { StatsCardComponent, StatsCardData } from '@app/shared/components';
import {
  ReusableDatatableComponent,
  TableColumn,
  TableAction,
  TableConfig,
} from '@app/shared/components/reusable-datatable/reusable-datatable.component';

interface UserData {
  id: number;
  name: string;
  lastName: string;
  email: string;
  phone: string;
  identification: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  imageProfileUrl: string;
  birtDate: string;
  father: any;
  createdAt: string;
  updatedAt: string;
  role: {
    id: number;
    name: string;
  };
}

interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Component({
  selector: 'app-users-management',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    StatsCardComponent,
    ReusableDatatableComponent,
  ],
  templateUrl: './users-management.component.html',
  styleUrls: ['./users-management.component.scss'],
})
export class UsersManagementComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);

  // Signals
  protected readonly users = signal<UserData[]>([]);
  protected readonly loading = signal<boolean>(false);
  protected readonly meta = signal<PaginationMeta>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  });

  // Stats cards
  protected statsCards: StatsCardData[] = [];

  // Configuración de la tabla
  protected columns: TableColumn[] = [
    {
      name: 'ID',
      prop: 'id',
      sortable: true,
      width: 70,
    },
    {
      name: 'Nombre',
      prop: 'name',
      sortable: true,
      minWidth: 150,
    },
    {
      name: 'Apellido',
      prop: 'lastName',
      sortable: true,
      minWidth: 150,
    },
    {
      name: 'Email',
      prop: 'email',
      sortable: true,
      minWidth: 200,
    },
    {
      name: 'Teléfono',
      prop: 'phone',
      sortable: true,
      width: 150,
    },
    {
      name: 'Identificación',
      prop: 'identification',
      sortable: true,
      width: 150,
    },
    {
      name: 'Ciudad',
      prop: 'city',
      sortable: true,
      width: 150,
    },
    {
      name: 'Rol',
      prop: 'role.name',
      sortable: true,
      width: 120,
    },
    {
      name: 'Fecha Creación',
      prop: 'createdAt',
      sortable: true,
      width: 150,
    },
  ];

  protected actions: TableAction[] = [
    {
      label: 'Ver Árbol',
      icon: 'fas fa-project-diagram',
      class: 'btn-sm btn-success',
      callback: (row: UserData) => this.viewUserTree(row),
    },
    {
      label: 'Ver Detalles',
      icon: 'fas fa-eye',
      class: 'btn-sm btn-info',
      callback: (row: UserData) => this.viewUserDetails(row),
    },
    {
      label: 'Editar',
      icon: 'fas fa-edit',
      class: 'btn-sm btn-warning',
      callback: (row: UserData) => this.editUser(row),
    },
    {
      label: 'Eliminar',
      icon: 'fas fa-trash',
      class: 'btn-sm btn-danger',
      callback: (row: UserData) => this.deleteUser(row),
    },
  ];

  protected tableConfig: TableConfig = {
    showSearch: true,
    showActions: true,
    showPagination: true,
    searchPlaceholder: 'Buscar usuarios...',
    headerHeight: 50,
    footerHeight: 50,
    rowHeight: 'auto',
    limit: 10,
    columnMode: 'force',
    reorderable: true,
    messages: {
      emptyMessage: 'No hay usuarios para mostrar',
      totalMessage: 'total',
      selectedMessage: 'seleccionado',
    },
  };

  ngOnInit(): void {
    this.initializeStatsCards();
    this.loadUsers();
  }

  private initializeStatsCards(): void {
    this.statsCards = [
      {
        title: 'Total Usuarios',
        value: '0',
        subtitle: 'Registrados en la plataforma',
        icon: 'users',
        iconColor: 'blue',
        valueColor: 'primary',
      },
      {
        title: 'Usuarios Activos',
        value: '0',
        subtitle: 'Con sesión reciente',
        icon: 'user-check',
        iconColor: 'green',
        valueColor: 'success',
      },
      {
        title: 'Página',
        value: '1 / 0',
        subtitle: 'Navegación',
        icon: 'file-text',
        iconColor: 'cyan',
        valueColor: 'info',
      },
      {
        title: 'Por Página',
        value: '10',
        subtitle: 'Registros mostrados',
        icon: 'list',
        iconColor: 'orange',
        valueColor: 'warning',
      },
    ];
  }

  private updateStatsCards(): void {
    const metaValue = this.meta();
    this.statsCards[0].value = metaValue.total.toString();
    this.statsCards[1].value = metaValue.total.toString();
    this.statsCards[2].value = `${metaValue.page} / ${metaValue.totalPages}`;
    this.statsCards[3].value = metaValue.limit.toString();
  }

  private loadUsers(page: number = 1, limit: number = 10): void {
    this.loading.set(true);
    this.authService
      .findAll(page, limit)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: response => {
          if (response.success) {
            this.users.set(response.data);
            this.meta.set(response.meta);
            this.updateStatsCards();
          }
          this.loading.set(false);
        },
        error: error => {
          console.error('Error al cargar usuarios:', error);
          this.loading.set(false);
        },
      });
  }

  protected onPageChange(page: number): void {
    this.loadUsers(page, this.meta().limit);
  }

  protected onRowClicked(row: UserData): void {
    console.log('Usuario seleccionado:', row);
    this.viewUserDetails(row);
  }

  private viewUserTree(user: UserData): void {
    console.log('Ver árbol del usuario:', user);
    // Navegar al componente del árbol con el userId como parámetro
    this.router.navigate(['/admin/unilevel-tree'], {
      queryParams: { userId: user.id },
    });
  }

  protected viewCompleteNetworkTree(): void {
    // Navegar al componente del árbol sin userId para ver toda la red
    this.router.navigate(['/admin/unilevel-tree']);
  }

  private viewUserDetails(user: UserData): void {
    console.log('Ver detalles del usuario:', user);
    // TODO: Implementar navegación o modal con detalles del usuario
  }

  private editUser(user: UserData): void {
    console.log('Editar usuario:', user);
    // TODO: Implementar navegación o modal de edición
  }

  private deleteUser(user: UserData): void {
    console.log('Eliminar usuario:', user);
    // TODO: Implementar confirmación y eliminación
  }

  protected refreshUsers(): void {
    this.loadUsers(this.meta().page, this.meta().limit);
  }
}
