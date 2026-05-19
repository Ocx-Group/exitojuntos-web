import { Component, OnInit, DestroyRef, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

// Servicios
import { LogsService } from '@app/core/service/logs-service/logs.service';
import { LogEntry, LogStats, GetLogsDto, PaginationMeta } from '@app/core/interfaces/logs';

// Componentes reutilizables
import { StatsCardComponent, StatsCardData } from '@app/shared/components';
import {
  TableColumn,
  TableAction,
  TableConfig,
} from '@app/shared/components/reusable-datatable/reusable-datatable.component';

// Servicios externos
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-logs-management',
  standalone: true,
  imports: [CommonModule, FormsModule, StatsCardComponent, TranslateModule],
  templateUrl: './logs-management.component.html',
  styleUrls: ['./logs-management.component.scss'],
})
export class LogsManagementComponent implements OnInit {
  private readonly logsService = inject(LogsService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly toastr = inject(ToastrService);
  private readonly translate = inject(TranslateService);

  // Signals
  protected readonly logs = signal<LogEntry[]>([]);
  protected readonly loading = signal<boolean>(false);
  protected readonly loadingStats = signal<boolean>(false);
  protected readonly meta = signal<PaginationMeta>({
    total: 0,
    page: 1,
    limit: 50,
    totalPages: 0,
  });
  protected readonly stats = signal<LogStats | null>(null);

  // Filtros
  protected filters: GetLogsDto = {
    page: 1,
    limit: 50,
    level: undefined,
    context: '',
    search: '',
  };

  // Niveles de log disponibles
  protected logLevels = [
    { value: '', label: 'Todos los niveles' },
    { value: 'ERROR', label: 'Error' },
    { value: 'WARN', label: 'Warning' },
    { value: 'LOG', label: 'Log' },
    { value: 'DEBUG', label: 'Debug' },
    { value: 'VERBOSE', label: 'Verbose' },
  ];

  // Stats cards
  protected statsCards: StatsCardData[] = [];

  // Configuración de la tabla
  protected columns: TableColumn[] = [
    {
      name: 'Timestamp',
      prop: 'timestamp',
      sortable: true,
      width: 180,
      pipe: 'date',
    },
    {
      name: 'Nivel',
      prop: 'level',
      sortable: true,
      width: 100,
    },
    {
      name: 'Contexto',
      prop: 'context',
      sortable: true,
      minWidth: 150,
    },
    {
      name: 'Mensaje',
      prop: 'message',
      sortable: false,
      minWidth: 300,
    },
    {
      name: 'PID',
      prop: 'pid',
      sortable: true,
      width: 80,
    },
  ];

  protected actions: TableAction[] = [];

  protected tableConfig: TableConfig = {
    rowHeight: 'auto',
    headerHeight: 50,
    footerHeight: 50,
    limit: 50,
  };

  // Exponer Math para usarlo en el template
  protected readonly Math = Math;

  ngOnInit(): void {
    this.loadStats();
    this.loadLogs();
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
    // Actualizar stats cards
    const statsData = this.stats();
    if (statsData) {
      this.updateStatsCards(statsData);
    }
  }

  /**
   * Cargar estadísticas de logs
   */
  private loadStats(): void {
    this.loadingStats.set(true);

    this.logsService
      .getStats()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: stats => {
          this.stats.set(stats);
          this.updateStatsCards(stats);
          this.loadingStats.set(false);
        },
        error: error => {
          console.error('Error al cargar estadísticas:', error);
          this.loadingStats.set(false);
        },
      });
  }

  /**
   * Actualizar cards de estadísticas
   */
  private updateStatsCards(stats: LogStats): void {
    this.statsCards = [
      {
        title: this.translate.instant(
          'MENUITEMS.LOGS-MANAGEMENT.STATS.TOTAL_LOGS.TITLE',
        ),
        value: (stats?.total ?? 0).toString(),
        icon: 'fas fa-list',
        subtitle: this.translate.instant(
          'MENUITEMS.LOGS-MANAGEMENT.STATS.TOTAL_LOGS.SUBTITLE',
        ),
        iconColor: 'blue',
        valueColor: 'primary',
      },
      {
        title: this.translate.instant(
          'MENUITEMS.LOGS-MANAGEMENT.STATS.ERRORS.TITLE',
        ),
        value: (stats?.byLevel?.ERROR ?? 0).toString(),
        icon: 'fas fa-exclamation-circle',
        subtitle: this.translate.instant(
          'MENUITEMS.LOGS-MANAGEMENT.STATS.ERRORS.SUBTITLE',
        ),
        iconColor: 'purple',
        valueColor: 'danger',
      },
      {
        title: this.translate.instant(
          'MENUITEMS.LOGS-MANAGEMENT.STATS.WARNINGS.TITLE',
        ),
        value: (stats?.byLevel?.WARN ?? 0).toString(),
        icon: 'fas fa-exclamation-triangle',
        subtitle: this.translate.instant(
          'MENUITEMS.LOGS-MANAGEMENT.STATS.WARNINGS.SUBTITLE',
        ),
        iconColor: 'orange',
        valueColor: 'warning',
      },
      {
        title: this.translate.instant(
          'MENUITEMS.LOGS-MANAGEMENT.STATS.INFO_LOGS.TITLE',
        ),
        value: (stats?.byLevel?.LOG ?? 0).toString(),
        icon: 'fas fa-info-circle',
        subtitle: this.translate.instant(
          'MENUITEMS.LOGS-MANAGEMENT.STATS.INFO_LOGS.SUBTITLE',
        ),
        iconColor: 'cyan',
        valueColor: 'info',
      },
    ];
  }
  /**
   * Cargar logs con filtros
   */
  protected loadLogs(): void {
    this.loading.set(true);

    // Limpiar filtros vacíos
    const params: GetLogsDto = {
      page: this.filters.page,
      limit: this.filters.limit,
    };

    if (this.filters.level) {
      params.level = this.filters.level;
    }
    if (this.filters.context?.trim()) {
      params.context = this.filters.context.trim();
    }
    if (this.filters.search?.trim()) {
      params.search = this.filters.search.trim();
    }

    this.logsService
      .getLogs(params)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: response => {
          this.logs.set(response.data);
          this.meta.set(response.meta);
          this.loading.set(false);
        },
        error: error => {
          console.error('Error al cargar logs:', error);
          this.logs.set([]);
          this.loading.set(false);
        },
      });
  }

  /**
   * Aplicar filtros
   */
  protected applyFilters(): void {
    this.filters.page = 1; // Resetear a la primera página
    this.loadLogs();
  }

  /**
   * Limpiar filtros
   */
  protected clearFilters(): void {
    this.filters = {
      page: 1,
      limit: 50,
      level: undefined,
      context: '',
      search: '',
    };
    this.loadLogs();
  }

  /**
   * Refrescar logs
   */
  protected refreshLogs(): void {
    this.loadStats();
    this.loadLogs();
    this.toastr.success(
      this.translate.instant(
        'MENUITEMS.LOGS-MANAGEMENT.MESSAGES.REFRESH_SUCCESS',
      ),
      this.translate.instant('COMMON.REFRESH.TEXT'),
    );
  }

  /**
   * Limpiar todos los logs
   */
  protected clearAllLogs(): void {
    Swal.fire({
      title: this.translate.instant(
        'MENUITEMS.LOGS-MANAGEMENT.MESSAGES.CLEAR_CONFIRM.TITLE',
      ),
      text: this.translate.instant(
        'MENUITEMS.LOGS-MANAGEMENT.MESSAGES.CLEAR_CONFIRM.TEXT',
      ),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: this.translate.instant(
        'MENUITEMS.LOGS-MANAGEMENT.MESSAGES.CLEAR_CONFIRM.CONFIRM',
      ),
      cancelButtonText: this.translate.instant(
        'MENUITEMS.LOGS-MANAGEMENT.MESSAGES.CLEAR_CONFIRM.CANCEL',
      ),
    }).then(result => {
      if (result.isConfirmed) {
        this.loading.set(true);

        this.logsService
          .clearLogs()
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: response => {
              this.toastr.success(
                response.message,
                this.translate.instant(
                  'MENUITEMS.LOGS-MANAGEMENT.MESSAGES.CLEAR_SUCCESS',
                ),
              );
              this.loadStats();
              this.loadLogs();
            },
            error: error => {
              console.error('Error al limpiar logs:', error);
              this.loading.set(false);
            },
          });
      }
    });
  }

  /**
   * Cambiar página
   */
  protected onPageChange(event: any): void {
    this.filters.page = event.offset + 1;
    this.loadLogs();
  }

  /**
   * Obtener clase CSS según el nivel del log
   */
  protected getLogLevelClass(level: string): string {
    switch (level) {
      case 'ERROR':
        return 'badge bg-danger';
      case 'WARN':
        return 'badge bg-warning';
      case 'LOG':
        return 'badge bg-info';
      case 'DEBUG':
        return 'badge bg-secondary';
      case 'VERBOSE':
        return 'badge bg-light text-dark';
      default:
        return 'badge bg-secondary';
    }
  }

  /**
   * Exportar logs a CSV
   */
  protected exportLogsToCSV(): void {
    if (this.logs().length === 0) {
      this.toastr.warning(
        this.translate.instant(
          'MENUITEMS.LOGS-MANAGEMENT.MESSAGES.EXPORT_WARNING',
        ),
        this.translate.instant('COMMON.EXPORT.TEXT'),
      );
      return;
    }

    const headers = [
      this.translate.instant(
        'MENUITEMS.LOGS-MANAGEMENT.TABLE.COLUMNS.TIMESTAMP',
      ),
      this.translate.instant('MENUITEMS.LOGS-MANAGEMENT.TABLE.COLUMNS.LEVEL'),
      this.translate.instant('MENUITEMS.LOGS-MANAGEMENT.TABLE.COLUMNS.CONTEXT'),
      this.translate.instant('MENUITEMS.LOGS-MANAGEMENT.TABLE.COLUMNS.MESSAGE'),
      this.translate.instant('MENUITEMS.LOGS-MANAGEMENT.TABLE.COLUMNS.PID'),
    ];
    const csvContent = [
      headers.join(','),
      ...this.logs().map(log =>
        [
          new Date(log.timestamp).toLocaleString('es-CO'),
          log.level,
          log.context,
          `"${log.message.split('"').join('""')}"`, // Escapar comillas
          log.pid,
        ].join(','),
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `logs_${new Date().toISOString().slice(0, 10)}.csv`,
    );
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    link.remove();

    this.toastr.success(
      this.translate.instant(
        'MENUITEMS.LOGS-MANAGEMENT.MESSAGES.EXPORT_SUCCESS',
      ),
      this.translate.instant('COMMON.EXPORT.TEXT'),
    );
  }
}
