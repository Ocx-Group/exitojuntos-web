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

interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
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
      .getUnilevelTree()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: treeData => {
          const clientsData = this.flattenTreeToClients(treeData);
          this.clients.set(clientsData);
          this.filteredClients.set(clientsData);
          this.loading.set(false);
        },
        error: error => {
          console.error('Error al cargar clientes:', error);
          this.loading.set(false);
          // Mantener datos de prueba en caso de error
          const mockData: ClientData[] = [
            {
              id: 1,
              name: 'Juan',
              lastName: 'Pérez',
              email: 'juan.perez@example.com',
              phone: '+57 300 123 4567',
              identification: '123456789',
              address: 'Calle 123',
              city: 'Bogotá',
              state: 'Cundinamarca',
              imageProfileUrl: '',
              createdAt: '2024-01-15',
              level: 'direct',
              role: { id: 2, name: 'Cliente' },
            },
            {
              id: 2,
              name: 'María',
              lastName: 'González',
              email: 'maria.gonzalez@example.com',
              phone: '+57 310 987 6543',
              identification: '987654321',
              address: 'Carrera 45',
              city: 'Medellín',
              state: 'Antioquia',
              imageProfileUrl: '',
              createdAt: '2024-02-20',
              level: 'direct',
              role: { id: 2, name: 'Cliente' },
            },
            {
              id: 3,
              name: 'Carlos',
              lastName: 'Rodríguez',
              email: 'carlos.rodriguez@example.com',
              phone: '+57 320 555 8888',
              identification: '456789123',
              address: 'Avenida 20',
              city: 'Cali',
              state: 'Valle del Cauca',
              imageProfileUrl: '',
              createdAt: '2024-03-10',
              level: 'indirect',
              referredBy: 'Juan Pérez',
              role: { id: 2, name: 'Cliente' },
            },
          ];
          this.clients.set(mockData);
          this.filteredClients.set(mockData);
        },
      });
  }

  /**
   * Convierte el árbol unilevel a una lista plana de clientes
   */
  private flattenTreeToClients(
    node: any,
    level: 'direct' | 'indirect' = 'direct',
    parentName?: string,
  ): ClientData[] {
    if (!node) return [];

    const clients: ClientData[] = [];

    // Agregar nodo actual (excepto el nodo raíz que es el usuario actual)
    if (node.id && parentName !== undefined) {
      clients.push({
        id: node.id,
        name: node.name || '',
        lastName: node.lastName || '',
        email: node.email || '',
        phone: node.phone || '',
        identification: node.identification || '',
        address: node.address || '',
        city: node.city || '',
        state: node.state || '',
        imageProfileUrl: node.imageProfileUrl || '',
        createdAt: node.createdAt || '',
        level: level,
        referredBy: parentName,
        role: node.role || { id: 2, name: 'Cliente' },
      });
    }

    // Procesar hijos como directos si es el primer nivel, indirectos en adelante
    if (node.children && Array.isArray(node.children)) {
      const currentName = `${node.name || ''} ${node.lastName || ''}`.trim();
      const childLevel =
        level === 'direct' && !parentName ? 'direct' : 'indirect';

      for (const child of node.children) {
        const childClients = this.flattenTreeToClients(
          child,
          childLevel,
          currentName || parentName,
        );
        clients.push(...childClients);
      }
    }

    return clients;
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
