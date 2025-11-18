import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../service/authentication-service/auth.service';
import { JWT_CONFIG } from '../config/jwt.config';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Verificar si la URL está en la lista blanca (no requiere autenticación)
  const isWhiteListed = JWT_CONFIG.WHITE_LIST.some(url =>
    req.url.includes(url),
  );

  // Si la ruta está en la lista blanca, continuar sin agregar token
  if (isWhiteListed) {
    return next(req).pipe(
      catchError((error: HttpErrorResponse) => {
        return throwError(() => error);
      }),
    );
  }

  // Obtener el token del usuario actual
  const currentUser = authService.currentUserAffiliateValue;
  const token = currentUser?.access_token;

  // Si existe un token, agregarlo al header Authorization
  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `${JWT_CONFIG.HEADER_PREFIX} ${token}`,
      },
    });
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Si el error es 401 (No autorizado), redirigir al login
      if (error.status === 401) {
        authService.logoutUser();
        router.navigate(['/signin']);
      }

      return throwError(() => error);
    }),
  );
};
