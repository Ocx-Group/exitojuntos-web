import { Injectable, signal, computed, effect } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Signin } from '@app/core/models/signin-model/signin.model';

import { UserAffiliate } from '@app/core/models/user-affiliate-model/user.affiliate.model';
import { environment } from '@environments/environment';
import { Response } from '@app/core/models/response-model/response.model';
import { ToastrService } from 'ngx-toastr';
import { JwtHelperService } from '../jwt-helper/jwt-helper.service';
import { UpdateProfileDto } from '@app/core/interfaces/update-profile';

const httpOptions = {
  headers: new HttpHeaders({
    'Content-Type': 'application/json',
  }),
};
@Injectable({
  providedIn: 'root',
})
export class AuthService {
  // Signals para el estado del usuario
  private readonly currentUserAffiliate = signal<UserAffiliate | null>(null);

  // Computed signals para acceso reactivo
  public userAffiliate = this.currentUserAffiliate.asReadonly();

  // Computed signals para verificar si está logueado
  public isLoggedIn = computed(() => this.currentUserAffiliate() !== null);

  // Mantener BehaviorSubjects para compatibilidad (deprecated)
  private readonly currentUserAffiliateSubject: BehaviorSubject<UserAffiliate>;
  public currentUserAffiliateObs: Observable<UserAffiliate>;
  private readonly urlApi: string;

  constructor(
    private readonly http: HttpClient,
    private readonly toastr: ToastrService,
    private readonly jwtHelper: JwtHelperService,
  ) {
    // Inicializar desde localStorage
    const storedAffiliate = this.getFromLocalStorage('currentUserAffiliate');

    this.currentUserAffiliate.set(storedAffiliate);

    // Mantener BehaviorSubjects para compatibilidad
    this.currentUserAffiliateSubject = new BehaviorSubject<UserAffiliate>(
      storedAffiliate,
    );
    this.currentUserAffiliateObs =
      this.currentUserAffiliateSubject.asObservable();
    this.urlApi = environment.apis.exitojuntosService;

    // Escuchar cambios en localStorage desde otras pestañas
    this.setupStorageListener();

    // Effect para sincronizar signals con BehaviorSubjects
    effect(() => {
      this.currentUserAffiliateSubject.next(this.currentUserAffiliate());
    });
  }

  // Compatibilidad con código existente
  public get currentUserAffiliateValue(): UserAffiliate {
    return this.currentUserAffiliate();
  }

  private getFromLocalStorage(key: string): any {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error(`Error parsing localStorage key "${key}":`, error);
      return null;
    }
  }

  private setupStorageListener(): void {
    // Escuchar cambios en localStorage desde otras pestañas
    globalThis.addEventListener('storage', (event: StorageEvent) => {
      if (event.key === 'currentUserAffiliate') {
        const newValue = event.newValue ? JSON.parse(event.newValue) : null;
        this.currentUserAffiliate.set(newValue);
      }
    });
  }

  /**
   * Verifica si el token actual es válido
   */
  isTokenValid(): boolean {
    const token = this.currentUserAffiliateValue?.access_token;

    if (!token) {
      return false;
    }

    return !this.jwtHelper.isTokenExpired(token);
  }

  /**
   * Obtiene el ID del usuario desde el token
   */
  getUserIdFromToken(): string | null {
    const token = this.currentUserAffiliateValue?.access_token;

    if (!token) {
      return null;
    }

    return this.jwtHelper.getUserIdFromToken(token);
  }

  loginUser(userCredentials: Signin) {
    return this.http
      .post<Response>(
        this.urlApi.concat('/auth/login'),
        userCredentials,
        httpOptions,
      )
      .pipe(
        map((response: Response) => {
          if (response.success && response.data?.user) {
            this.validateUserType(response);
          }
          return response;
        }),
      );
  }

  validateUserType(response: Response) {
    const userData = response.data.user;
    const accessToken = response.data.access_token;

    // Todos los usuarios usan el modelo UserAffiliate unificado
    const affiliateUser: UserAffiliate = {
      ...userData,
      access_token: accessToken,
    };
    this.setUserAffiliateValue(affiliateUser);
  }

  UserAffiliateEmailConfirmation(userName: string) {
    console.log(httpOptions);
    return this.http
      .put(
        this.urlApi.concat('/useraffiliateinfo/email_confirmation/', userName),
        {},
        httpOptions,
      )
      .pipe(
        map(data => {
          return data;
        }),
        catchError(error => {
          return throwError(() => error);
        }),
      );
  }

  logoutUser() {
    localStorage.removeItem('currentUserAffiliate');

    // Actualizar signals
    this.currentUserAffiliate.set(null);

    this.toastr.clear();

    return of({ success: false });
  }

  public setUserAffiliateValue(user: UserAffiliate) {
    localStorage.setItem('currentUserAffiliate', JSON.stringify(user));

    // Actualizar signal
    this.currentUserAffiliate.set(user);
  }

  getLoginMovementsByAffiliatedId(affiliateId: number) {
    return this.http
      .get<Response>(
        `${this.urlApi}/auth/login_movements/${affiliateId}`,
        httpOptions,
      )
      .pipe(
        map(response => {
          return response.data;
        }),
      );
  }

  fetchIpAddress(): Observable<string> {
    return this.http
      .get<{ ip: string }>('https://api.ipify.org?format=json')
      .pipe(map(data => data.ip));
  }

  /**
   * Obtiene todos los usuarios con paginación
   * @param page Número de página (default: 1)
   * @param limit Cantidad de registros por página (default: 10)
   */
  findAll(page: number = 1, limit: number = 10): Observable<any> {
    const params = { page: page.toString(), limit: limit.toString() };
    const token = this.currentUserAffiliateValue?.access_token ?? '';
    const headers = token
      ? httpOptions.headers.set('Authorization', `Bearer ${token}`)
      : httpOptions.headers;
    return this.http
      .get<Response>(`${this.urlApi}/auth/users`, { params, headers })
      .pipe(
        map(response => {
          return response;
        }),
        catchError(error => {
          this.toastr.error('Error al obtener usuarios', 'Error');
          return throwError(() => error);
        }),
      );
  }

  /**
   * Obtiene el árbol unilevel del usuario
   * @param userId ID del usuario raíz del árbol (opcional, solo para administradores)
   * @param maxLevel Nivel máximo de profundidad del árbol (1-20)
   * @returns Observable con el árbol unilevel
   */
  getUnilevelTree(userId?: number, maxLevel?: number): Observable<any> {
    const token = this.currentUserAffiliateValue?.access_token ?? '';
    const headers = token
      ? httpOptions.headers.set('Authorization', `Bearer ${token}`)
      : httpOptions.headers;

    let params: any = {};
    if (userId !== undefined && userId !== null) {
      params.userId = userId.toString();
    }
    if (maxLevel !== undefined && maxLevel !== null) {
      params.maxLevel = maxLevel.toString();
    }

    return this.http
      .get<Response>(`${this.urlApi}/auth/unilevel-tree`, { params, headers })
      .pipe(
        map(response => {
          if (response.success) {
            return response.data;
          }
          throw new Error(
            response.message || 'Error al obtener árbol unilevel',
          );
        }),
        catchError(error => {
          this.toastr.error(
            error.error?.message || 'Error al obtener árbol unilevel',
            'Error',
          );
          return throwError(() => error);
        }),
      );
  }

  /**
   * Obtiene la red personal del usuario (todos los niveles descendientes)
   * @param userId ID del usuario raíz de la red (opcional, solo para administradores)
   * @returns Observable con la red personal
   */
  getPersonalNetwork(userId?: number): Observable<any> {
    const token = this.currentUserAffiliateValue?.access_token ?? '';
    const headers = token
      ? httpOptions.headers.set('Authorization', `Bearer ${token}`)
      : httpOptions.headers;

    let params: any = {};
    if (userId !== undefined && userId !== null) {
      params.userId = userId.toString();
    }

    return this.http
      .get<Response>(`${this.urlApi}/auth/personal-network`, {
        params,
        headers,
      })
      .pipe(
        map(response => {
          if (response.success) {
            return response.data;
          }
          throw new Error(response.message || 'Error al obtener red personal');
        }),
        catchError(error => {
          this.toastr.error(
            error.error?.message || 'Error al obtener red personal',
            'Error',
          );
          return throwError(() => error);
        }),
      );
  }

  /**
   * Actualiza el perfil del usuario autenticado
   * @param updateProfileDto Datos del perfil a actualizar
   * @returns Observable con los datos actualizados del usuario
   */
  updateProfile(updateProfileDto: UpdateProfileDto): Observable<any> {
    const token = this.currentUserAffiliateValue?.access_token ?? '';
    const headers = token
      ? httpOptions.headers.set('Authorization', `Bearer ${token}`)
      : httpOptions.headers;

    return this.http
      .patch<Response>(`${this.urlApi}/auth/profile`, updateProfileDto, {
        headers,
      })
      .pipe(
        map(response => {
          // Actualizar el usuario en el localStorage y signals si es necesario
          if (response.success && response.data) {
            const currentUser = this.currentUserAffiliateValue;
            if (currentUser) {
              const updatedUser = { ...currentUser, ...response.data };
              this.setUserAffiliateValue(updatedUser);
            }
          }
          return response;
        }),
        catchError(error => {
          return throwError(() => error);
        }),
      );
  }
}
