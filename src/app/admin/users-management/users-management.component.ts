import { Component, OnInit, DestroyRef, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink, Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

// Servicios
import { AuthService } from '@app/core/service/authentication-service/auth.service';

// Interfaces
import { UserData } from '@app/core/interfaces/user';
import { PaginationMeta } from '@app/core/interfaces/pagination-request';

// Componentes reutilizables
import { StatsCardComponent, StatsCardData } from '@app/shared/components';
import {
  ReusableDatatableComponent,
  TableColumn,
  TableAction,
  TableConfig,
} from '@app/shared/components/reusable-datatable/reusable-datatable.component';

// Data
import { USERS_TABLE_CONFIG } from './users-management.data';

@Component({
  selector: 'app-users-management',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    StatsCardComponent,
    ReusableDatatableComponent,
    TranslateModule,
  ],
  templateUrl: './users-management.component.html',
  styleUrls: ['./users-management.component.scss'],
})
export class UsersManagementComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);

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
    // {
    //   label: 'Ver Árbol',
    //   icon: 'fas fa-project-diagram',
    //   class: 'btn-sm btn-success',
    //   callback: (row: UserData) => this.viewUserTree(row),
    // },
    // {
    //   label: 'Ver Detalles',
    //   icon: 'fas fa-eye',
    //   class: 'btn-sm btn-info',
    //   callback: (row: UserData) => this.viewUserDetails(row),
    // },
    // {
    //   label: 'Editar',
    //   icon: 'fas fa-edit',
    //   class: 'btn-sm btn-warning',
    //   callback: (row: UserData) => this.editUser(row),
    // },
    // {
    //   label: 'Eliminar',
    //   icon: 'fas fa-trash',
    //   class: 'btn-sm btn-danger',
    //   callback: (row: UserData) => this.deleteUser(row),
    // },
  ];

  protected tableConfig: TableConfig = { ...USERS_TABLE_CONFIG };

  ngOnInit(): void {
    this.initializeStatsCards();
    this.loadUsers();
    this.setupTranslations();

    // Suscribirse a cambios de idioma
    this.translate.onLangChange
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.updateTranslations();
      });
  }

  private setupTranslations(): void {
    this.updateTranslations();
  }

  private updateTranslations(): void {
    // Actualizar columnas
    this.columns = [
      {
        name: this.translate.instant(
          'MENUITEMS.USERS-MANAGEMENT.TABLE.COLUMNS.ID',
        ),
        prop: 'id',
        sortable: true,
        width: 70,
      },
      {
        name: this.translate.instant(
          'MENUITEMS.USERS-MANAGEMENT.TABLE.COLUMNS.NAME',
        ),
        prop: 'name',
        sortable: true,
        minWidth: 150,
      },
      {
        name: this.translate.instant(
          'MENUITEMS.USERS-MANAGEMENT.TABLE.COLUMNS.LASTNAME',
        ),
        prop: 'lastName',
        sortable: true,
        minWidth: 150,
      },
      {
        name: this.translate.instant(
          'MENUITEMS.USERS-MANAGEMENT.TABLE.COLUMNS.EMAIL',
        ),
        prop: 'email',
        sortable: true,
        minWidth: 200,
      },
      {
        name: this.translate.instant(
          'MENUITEMS.USERS-MANAGEMENT.TABLE.COLUMNS.PHONE',
        ),
        prop: 'phone',
        sortable: true,
        width: 150,
      },
      {
        name: this.translate.instant(
          'MENUITEMS.USERS-MANAGEMENT.TABLE.COLUMNS.IDENTIFICATION',
        ),
        prop: 'identification',
        sortable: true,
        width: 150,
      },
      {
        name: this.translate.instant(
          'MENUITEMS.USERS-MANAGEMENT.TABLE.COLUMNS.CITY',
        ),
        prop: 'city',
        sortable: true,
        width: 150,
      },
      {
        name: this.translate.instant(
          'MENUITEMS.USERS-MANAGEMENT.TABLE.COLUMNS.ROLE',
        ),
        prop: 'role.name',
        sortable: true,
        width: 120,
      },
      {
        name: this.translate.instant(
          'MENUITEMS.USERS-MANAGEMENT.TABLE.COLUMNS.CREATED_AT',
        ),
        prop: 'createdAt',
        sortable: true,
        width: 150,
      },
    ];

    // Actualizar acciones
    this.actions = [
      {
        label: this.translate.instant(
          'MENUITEMS.USERS-MANAGEMENT.ACTIONS.VIEW_TREE',
        ),
        icon: 'fas fa-project-diagram',
        class: 'btn-sm btn-success',
        callback: (row: UserData) => this.viewUserTree(row),
      },
      {
        label: this.translate.instant(
          'MENUITEMS.USERS-MANAGEMENT.ACTIONS.VIEW_DETAILS',
        ),
        icon: 'fas fa-eye',
        class: 'btn-sm btn-info',
        callback: (row: UserData) => this.viewUserDetails(row),
      },
      {
        label: this.translate.instant(
          'MENUITEMS.USERS-MANAGEMENT.ACTIONS.EDIT',
        ),
        icon: 'fas fa-edit',
        class: 'btn-sm btn-warning',
        callback: (row: UserData) => this.editUser(row),
      },
      {
        label: this.translate.instant(
          'MENUITEMS.USERS-MANAGEMENT.ACTIONS.DELETE',
        ),
        icon: 'fas fa-trash',
        class: 'btn-sm btn-danger',
        callback: (row: UserData) => this.deleteUser(row),
      },
    ];

    // Actualizar configuración de tabla
    this.tableConfig = {
      ...this.tableConfig,
      searchPlaceholder: this.translate.instant(
        'MENUITEMS.USERS-MANAGEMENT.TABLE.SEARCH_PLACEHOLDER',
      ),
      messages: {
        emptyMessage: this.translate.instant(
          'MENUITEMS.USERS-MANAGEMENT.TABLE.EMPTY_MESSAGE',
        ),
        totalMessage: this.translate.instant(
          'MENUITEMS.USERS-MANAGEMENT.TABLE.TOTAL_MESSAGE',
        ),
        selectedMessage: this.translate.instant(
          'MENUITEMS.USERS-MANAGEMENT.TABLE.SELECTED_MESSAGE',
        ),
      },
    };

    // Actualizar stats cards
    this.initializeStatsCards();
  }

  private initializeStatsCards(): void {
    this.statsCards = [
      {
        title: this.translate.instant(
          'MENUITEMS.USERS-MANAGEMENT.STATS.TOTAL_USERS.TITLE',
        ),
        value: '0',
        subtitle: this.translate.instant(
          'MENUITEMS.USERS-MANAGEMENT.STATS.TOTAL_USERS.SUBTITLE',
        ),
        icon: 'users',
        iconColor: 'blue',
        valueColor: 'primary',
      },
      {
        title: this.translate.instant(
          'MENUITEMS.USERS-MANAGEMENT.STATS.ACTIVE_USERS.TITLE',
        ),
        value: '0',
        subtitle: this.translate.instant(
          'MENUITEMS.USERS-MANAGEMENT.STATS.ACTIVE_USERS.SUBTITLE',
        ),
        icon: 'user-check',
        iconColor: 'green',
        valueColor: 'success',
      },
      {
        title: this.translate.instant(
          'MENUITEMS.USERS-MANAGEMENT.STATS.PAGE.TITLE',
        ),
        value: '1 / 0',
        subtitle: this.translate.instant(
          'MENUITEMS.USERS-MANAGEMENT.STATS.PAGE.SUBTITLE',
        ),
        icon: 'file-text',
        iconColor: 'cyan',
        valueColor: 'info',
      },
      {
        title: this.translate.instant(
          'MENUITEMS.USERS-MANAGEMENT.STATS.PER_PAGE.TITLE',
        ),
        value: '10',
        subtitle: this.translate.instant(
          'MENUITEMS.USERS-MANAGEMENT.STATS.PER_PAGE.SUBTITLE',
        ),
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

  protected onPageChange(event: { offset: number; limit: number }): void {
    // offset es 0-based, pero el API espera page 1-based
    const page = event.offset + 1;
    this.loadUsers(page, event.limit);
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
    // Implementar navegación o modal con detalles del usuario
  }

  private editUser(user: UserData): void {
    console.log('Editar usuario:', user);
    // Implementar navegación o modal de edición
  }

  private deleteUser(user: UserData): void {
    console.log('Eliminar usuario:', user);
    // Implementar confirmación y eliminación
  }

  protected refreshUsers(): void {
    this.loadUsers(this.meta().page, this.meta().limit);
  }
}
