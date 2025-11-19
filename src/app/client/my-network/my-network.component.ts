import { Component, OnInit, DestroyRef, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

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
  level: 'direct' | 'indirect';
  referredBy?: string;
  role: {
    id: number;
    name: string;
  };
}

@Component({
  selector: 'app-my-network',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, ReusableDatatableComponent],
  templateUrl: './my-network.component.html',
  styleUrls: ['./my-network.component.scss'],
})
export class MyNetworkComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);

  // Signals
  protected readonly clients = signal<ClientData[]>([]);
  protected readonly filteredClients = signal<ClientData[]>([]);
  protected readonly loading = signal<boolean>(false);

  // Filtros
  protected searchEmail: string = '';
  protected searchPhone: string = '';

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
      name: 'Ciudad',
      prop: 'city',
      sortable: true,
      width: 150,
    },
    {
      name: 'Tipo',
      prop: 'level',
      sortable: true,
      width: 120,
    },
    {
      name: 'Fecha Registro',
      prop: 'createdAt',
      sortable: true,
      width: 150,
    },
  ];

  protected actions: TableAction[] = [
    {
      label: 'Ver Red',
      icon: 'fas fa-project-diagram',
      class: 'btn-sm btn-success',
      callback: (row: ClientData) => this.viewClientNetwork(row),
    },
    {
      label: 'Ver Perfil',
      icon: 'fas fa-user',
      class: 'btn-sm btn-info',
      callback: (row: ClientData) => this.viewClientProfile(row),
    },
  ];

  protected tableConfig: TableConfig = {
    columnMode: 'force',
    headerHeight: 50,
    footerHeight: 50,
    rowHeight: 'auto',
    limit: 10,
    reorderable: false,
    showSearch: false,
    showActions: false,
  };

  ngOnInit(): void {
    this.loadClients();
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

    const currentUserId = this.authService.currentUserAffiliateValue?.id;

    return network.map(user => {
      // Determinar si es directo o indirecto comparando el padre con el usuario actual
      const isDirect = user.father === currentUserId;

      return {
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
        level: isDirect ? 'direct' : 'indirect',
        role: { id: 2, name: 'Cliente' },
      };
    });
  }

  /**
   * Aplica filtros de búsqueda por email y teléfono
   */
  protected applyFilters(): void {
    const emailFilter = this.searchEmail.toLowerCase().trim();
    const phoneFilter = this.searchPhone.toLowerCase().trim();

    if (!emailFilter && !phoneFilter) {
      this.filteredClients.set(this.clients());
      return;
    }

    const filtered = this.clients().filter(client => {
      const emailMatch =
        !emailFilter || client.email.toLowerCase().includes(emailFilter);
      const phoneMatch =
        !phoneFilter || client.phone.toLowerCase().includes(phoneFilter);
      return emailMatch && phoneMatch;
    });

    this.filteredClients.set(filtered);
  }

  /**
   * Limpia los filtros de búsqueda
   */
  protected clearFilters(): void {
    this.searchEmail = '';
    this.searchPhone = '';
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
   * Navega a la vista de red del cliente seleccionado
   */
  protected viewClientNetwork(client: ClientData): void {
    console.log('Ver red de cliente:', client);
    // Implementación futura: navegación a vista detallada de red
  }

  /**
   * Navega al perfil del cliente seleccionado
   */
  protected viewClientProfile(client: ClientData): void {
    console.log('Ver perfil de cliente:', client);
    // Implementación futura: navegación a perfil del cliente
  }

  /**
   * Navega a la vista completa de la red
   */
  protected viewCompleteNetwork(): void {
    this.router.navigate(['/app/network-tree']);
  }

  /**
   * Maneja el evento de clic en una fila
   */
  protected onRowClicked(event: any): void {
    console.log('Fila clickeada:', event);
  }

  /**
   * Obtiene la clase CSS para el badge según el nivel
   */
  protected getLevelBadgeClass(level: string): string {
    return level === 'direct' ? 'badge bg-success' : 'badge bg-info';
  }

  /**
   * Obtiene el texto del badge según el nivel
   */
  protected getLevelBadgeText(level: string): string {
    return level === 'direct' ? 'Directo' : 'Indirecto';
  }

  /**
   * Obtiene el número de clientes directos
   */
  protected getDirectClientsCount(): number {
    return this.filteredClients().filter(c => c.level === 'direct').length;
  }

  /**
   * Obtiene el número de clientes indirectos
   */
  protected getIndirectClientsCount(): number {
    return this.filteredClients().filter(c => c.level === 'indirect').length;
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
      'ID',
      'Nombre',
      'Apellido',
      'Email',
      'Teléfono',
      'Ciudad',
      'Tipo',
      'Fecha Registro',
    ];
    const rows = data.map(client => [
      client.id,
      client.name,
      client.lastName,
      client.email,
      client.phone,
      client.city,
      client.level === 'direct' ? 'Directo' : 'Indirecto',
      client.createdAt,
    ]);

    const csvRows = [headers, ...rows];
    return csvRows.map(row => row.join(',')).join('\n');
  }
}
