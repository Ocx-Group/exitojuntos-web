import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';
import { environment } from '@environments/environment';
import { ToastrService } from 'ngx-toastr';
import {
  ClearLogsResponse,
  GetLogsDto,
  LogsResponse,
  LogStats,
} from '@app/core/interfaces/logs';

const httpOptions = {
  headers: new HttpHeaders({
    'Content-Type': 'application/json',
  }),
};

@Injectable({
  providedIn: 'root',
})
export class LogsService {
  private readonly urlApi: string;
  private readonly baseUrl: string;

  constructor(
    private readonly http: HttpClient,
    private readonly toastr: ToastrService,
  ) {
    this.urlApi = environment.apiUrl;
    // Remover /v1 de la URL para usar VERSION_NEUTRAL del backend
    this.baseUrl = this.urlApi.replace(/\/v1\/?$/, '');
  }

  /**
   * Obtener logs de la aplicación
   * @param params Parámetros de filtrado y paginación
   * @returns Observable con la lista de logs paginada
   */
  getLogs(params: GetLogsDto = {}): Observable<LogsResponse> {
    let httpParams = new HttpParams();

    if (params.page) {
      httpParams = httpParams.set('page', params.page.toString());
    }
    if (params.limit) {
      httpParams = httpParams.set('limit', params.limit.toString());
    }
    if (params.level) {
      httpParams = httpParams.set('level', params.level);
    }
    if (params.context) {
      httpParams = httpParams.set('context', params.context);
    }
    if (params.search) {
      httpParams = httpParams.set('search', params.search);
    }

    return this.http
      .get<any>(`${this.baseUrl}/logs`, {
        ...httpOptions,
        params: httpParams,
      })
      .pipe(
        tap(response => console.log('Respuesta de logs:', response)),
        map(response => ({
          data: response.data || [],
          meta: response.meta || {
            total: 0,
            page: 1,
            limit: 50,
            totalPages: 0,
          },
        })),
        catchError(error => {
          this.handleError('Error al obtener los logs', error);
          return throwError(() => error);
        }),
      );
  }

  /**
   * Obtener estadísticas de logs
   * @returns Observable con las estadísticas de logs
   */
  getStats(): Observable<LogStats> {
    return this.http.get<any>(`${this.baseUrl}/logs/stats`, httpOptions).pipe(
      tap(response => console.log('Respuesta de stats:', response)),
      map(
        response =>
          response.data || {
            total: 0,
            byLevel: { LOG: 0, ERROR: 0, WARN: 0, DEBUG: 0, VERBOSE: 0 },
            oldestLog: null,
            newestLog: null,
          },
      ),
      catchError(error => {
        this.handleError('Error al obtener las estadísticas', error);
        return throwError(() => error);
      }),
    );
  }

  /**
   * Limpiar todos los logs
   * @returns Observable con el mensaje de confirmación
   */
  clearLogs(): Observable<ClearLogsResponse> {
    return this.http.delete<any>(`${this.baseUrl}/logs`, httpOptions).pipe(
      map(response => ({
        message: response.message || 'Logs eliminados correctamente',
      })),
      catchError(error => {
        this.handleError('Error al limpiar los logs', error);
        return throwError(() => error);
      }),
    );
  }

  /**
   * Manejo de errores HTTP
   * @param message Mensaje personalizado de error
   * @param error Error capturado
   */
  private handleError(message: string, error: any): void {
    console.error(message, error);

    let errorMessage = message;

    if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.status === 401) {
      errorMessage = 'No autorizado. Por favor, inicia sesión nuevamente.';
    } else if (error.status === 403) {
      errorMessage =
        'Acceso denegado. Solo administradores pueden acceder a los logs.';
    } else if (error.status === 0) {
      errorMessage = 'Error de conexión. Verifica tu conexión a internet.';
    }

    this.toastr.error(errorMessage, 'Error');
  }
}
