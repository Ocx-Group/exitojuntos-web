import { Component, OnInit, DestroyRef, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ClipboardService } from 'ngx-clipboard';
import { ToastrService } from 'ngx-toastr';

// Servicios
import { AuthService } from '@app/core/service/authentication-service/auth.service';

// Componentes reutilizables
import {
  ReusableDatatableComponent,
  TableColumn,
  TableAction,
  TableConfig,
} from '@app/shared/components/reusable-datatable/reusable-datatable.component';

interface ClientData {
  id: number;
  name: string;
  lastName: string;
  email: string;
  phone: string;
  identification: string;
  address: string;
  city: string;
  state: string;
  imageProfileUrl: string;
  createdAt: string;
  level: number;
  referredBy?: string;
  role: {
    id: number;
    name: string;
  };
}

@Component({
  selector: 'app-my-network',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    ReusableDatatableComponent,
  ],
  templateUrl: './my-network.component.html',
  styleUrls: ['./my-network.component.scss'],
})
export class MyNetworkComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly translate = inject(TranslateService);
  private readonly clipboardService = inject(ClipboardService);
  private readonly toastr = inject(ToastrService);

  constructor() {
    this.setupLocalizedResources();
    this.translate.onLangChange
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.setupLocalizedResources());
  }

  // Signals
  protected readonly clients = signal<ClientData[]>([]);
  protected readonly filteredClients = signal<ClientData[]>([]);
  protected readonly loading = signal<boolean>(false);

  // Filtro unificado
  protected searchTerm: string = '';

  // Configuración de la tabla
  protected columns: TableColumn[] = [];
  protected actions: TableAction[] = [];
  protected tableConfig: TableConfig = {};

  ngOnInit(): void {
    this.loadClients();
  }

  private setupLocalizedResources(): void {
    this.columns = [
      {
        name: this.translate.instant('MY-NETWORK-PAGE.TABLE.COLUMNS.ID'),
        prop: 'id',
        sortable: true,
        width: 70,
      },
      {
        name: this.translate.instant('MY-NETWORK-PAGE.TABLE.COLUMNS.NAME'),
        prop: 'name',
        sortable: true,
        minWidth: 150,
      },
      {
        name: this.translate.instant('MY-NETWORK-PAGE.TABLE.COLUMNS.LAST-NAME'),
        prop: 'lastName',
        sortable: true,
        minWidth: 150,
      },
      {
        name: this.translate.instant('MY-NETWORK-PAGE.TABLE.COLUMNS.EMAIL'),
        prop: 'email',
        sortable: true,
        minWidth: 200,
      },
      {
        name: this.translate.instant('MY-NETWORK-PAGE.TABLE.COLUMNS.PHONE'),
        prop: 'phone',
        sortable: true,
        width: 150,
      },
      {
        name: this.translate.instant('MY-NETWORK-PAGE.TABLE.COLUMNS.CITY'),
        prop: 'city',
        sortable: true,
        width: 150,
      },
      {
        name: this.translate.instant('MY-NETWORK-PAGE.TABLE.COLUMNS.LEVEL'),
        prop: 'level',
        sortable: true,
        width: 100,
      },
      {
        name: this.translate.instant(
          'MY-NETWORK-PAGE.TABLE.COLUMNS.REGISTERED-AT',
        ),
        prop: 'createdAt',
        sortable: true,
        width: 150,
      },
    ];

    this.actions = [
      {
        label: this.translate.instant(
          'MY-NETWORK-PAGE.TABLE.ACTIONS.VIEW-PROFILE',
        ),
        icon: 'fas fa-user',
        class: 'btn-sm btn-info',
        callback: (row: ClientData) => this.viewClientProfile(row),
      },
    ];

    this.tableConfig = {
      columnMode: 'force',
      headerHeight: 50,
      footerHeight: 50,
      rowHeight: 'auto',
      limit: 10,
      reorderable: false,
      showSearch: false,
      showActions: false,
      searchPlaceholder: this.translate.instant(
        'MY-NETWORK-PAGE.TABLE.SEARCH-PLACEHOLDER',
      ),
      messages: {
        emptyMessage: this.translate.instant(
          'MY-NETWORK-PAGE.TABLE.MESSAGES.EMPTY',
        ),
        totalMessage: this.translate.instant(
          'MY-NETWORK-PAGE.TABLE.MESSAGES.TOTAL',
        ),
        selectedMessage: this.translate.instant(
          'MY-NETWORK-PAGE.TABLE.MESSAGES.SELECTED',
        ),
      },
    };
  }

  /**
   * Carga la lista de clientes directos e indirectos
   */
  private loadClients(): void {
    this.loading.set(true);

    this.authService
      .getPersonalNetwork()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: response => {
          const clientsData = this.mapNetworkToClients(response.network);
          this.clients.set(clientsData);
          this.filteredClients.set(clientsData);
          this.loading.set(false);
        },
        error: error => {
          console.error('Error al cargar clientes:', error);
          this.loading.set(false);
          this.clients.set([]);
          this.filteredClients.set([]);
        },
      });
  }

  /**
   * Mapea los datos de la red personal al formato ClientData
   */
  private mapNetworkToClients(network: any[]): ClientData[] {
    if (!network || !Array.isArray(network)) return [];

    return network.map(user => ({
      id: user.id,
      name: user.full_name?.split(' ')[0] || '',
      lastName: user.full_name?.split(' ').slice(1).join(' ') || '',
      email: user.email || '',
      phone: user.phone || '',
      identification: '',
      address: '',
      city: user.country_name || '',
      state: '',
      imageProfileUrl: '',
      createdAt: user.created_at || '',
      level: Number(user.level) || 0,
      role: { id: 2, name: 'Cliente' },
    }));
  }

  /**
   * Aplica el filtro unificado contra nombre, apellido, email y teléfono
   */
  protected applyFilters(): void {
    const term = this.searchTerm.toLowerCase().trim();

    if (!term) {
      this.filteredClients.set(this.clients());
      return;
    }

    const filtered = this.clients().filter(client => {
      const fullName = `${client.name} ${client.lastName}`.toLowerCase();
      return (
        fullName.includes(term) ||
        client.email.toLowerCase().includes(term) ||
        client.phone.toLowerCase().includes(term)
      );
    });

    this.filteredClients.set(filtered);
  }

  /**
   * Limpia el filtro de búsqueda
   */
  protected clearFilters(): void {
    this.searchTerm = '';
    this.filteredClients.set(this.clients());
  }

  /**
   * Actualiza la lista de clientes
   */
  protected refreshClients(): void {
    this.clearFilters();
    this.loadClients();
  }

  /**
   * Navega al perfil del cliente seleccionado
   */
  protected viewClientProfile(client: ClientData): void {
    console.log('Ver perfil de cliente:', client);
    // Implementación futura: navegación a perfil del cliente
  }

  /**
   * Maneja el evento de clic en una fila
   */
  protected onRowClicked(event: any): void {
    console.log('Fila clickeada:', event);
  }

  /**
   * Obtiene el número de clientes directos (nivel 1)
   */
  protected getDirectClientsCount(): number {
    return this.filteredClients().filter(c => c.level === 1).length;
  }

  /**
   * Obtiene el número de clientes indirectos (nivel > 1)
   */
  protected getIndirectClientsCount(): number {
    return this.filteredClients().filter(c => c.level > 1).length;
  }

  /**
   * Copia los datos de la tabla al portapapeles
   */
  protected copyTableData(): void {
    const data = this.filteredClients();
    const csvContent = this.convertToCSV(data);
    navigator.clipboard.writeText(csvContent).then(() => {
      console.log('Datos copiados al portapapeles');
    });
  }

  /**
   * Exporta los datos de la tabla a CSV
   */
  protected exportToCSV(): void {
    const data = this.filteredClients();
    const csvContent = this.convertToCSV(data);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `red_clientes_${Date.now()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  /**
   * Convierte los datos a formato CSV
   */
  private convertToCSV(data: ClientData[]): string {
    const headers = [
      this.translate.instant('MY-NETWORK-PAGE.TABLE.COLUMNS.ID'),
      this.translate.instant('MY-NETWORK-PAGE.TABLE.COLUMNS.NAME'),
      this.translate.instant('MY-NETWORK-PAGE.TABLE.COLUMNS.LAST-NAME'),
      this.translate.instant('MY-NETWORK-PAGE.TABLE.COLUMNS.EMAIL'),
      this.translate.instant('MY-NETWORK-PAGE.TABLE.COLUMNS.PHONE'),
      this.translate.instant('MY-NETWORK-PAGE.TABLE.COLUMNS.CITY'),
      this.translate.instant('MY-NETWORK-PAGE.TABLE.COLUMNS.LEVEL'),
      this.translate.instant('MY-NETWORK-PAGE.TABLE.COLUMNS.REGISTERED-AT'),
    ];
    const rows = data.map(client => [
      client.id,
      client.name,
      client.lastName,
      client.email,
      client.phone,
      client.city,
      client.level,
      client.createdAt,
    ]);

    const csvRows = [headers, ...rows];
    return csvRows.map(row => row.join(',')).join('\n');
  }

  /**
   * Obtiene el enlace de referido del usuario
   */
  protected getReferralLink(): string {
    const currentUser = this.authService.currentUserAffiliateValue;
    if (!currentUser?.username) {
      return '';
    }
    return `exitojuntos.com/signup/${currentUser.username}`;
  }

  /**
   * Copia el enlace de referido al portapapeles
   */
  protected copyReferralLink(): void {
    const referralUrl = this.getReferralLink();

    if (!referralUrl) {
      this.toastr.error(
        this.translate.instant('MY-NETWORK-PAGE.VIEW.SHARE.ERROR'),
      );
      return;
    }

    this.clipboardService.copyFromContent(referralUrl);
    this.toastr.success(
      this.translate.instant('MY-NETWORK-PAGE.VIEW.SHARE.SUCCESS'),
    );
  }
}
