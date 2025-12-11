import { HttpInterceptorFn, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { from, switchMap, catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

/**
 * Auth interceptor that:
 * 1. Attaches access token to requests
 * 2. Includes credentials (cookies) with all requests
 * 3. Handles 401 errors with silent token refresh
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  // Skip adding token for refresh endpoint (it uses cookie-only auth)
  if (req.url.includes('/auth/refresh')) {
    return next(req.clone({ withCredentials: true }));
  }

  const token = authService.getToken();
  let authReq = addTokenAndCredentials(req, token);

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Handle 401 (token expired) with silent refresh
      // Don't refresh for auth endpoints (login/register failures should just fail)
      if (error.status === 401 && !req.url.includes('/auth/')) {
        return from(authService.refreshToken()).pipe(
          switchMap((newToken) => {
            // Retry the original request with the new token
            return next(addTokenAndCredentials(req, newToken));
          }),
          catchError((refreshError) => {
            // Refresh failed - authService.refreshToken() already clears state
            return throwError(() => refreshError);
          })
        );
      }

      return throwError(() => error);
    })
  );
};

/**
 * Clone request with Authorization header and withCredentials.
 */
function addTokenAndCredentials(
  req: HttpRequest<unknown>,
  token: string | null
): HttpRequest<unknown> {
  if (token) {
    return req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
      withCredentials: true,
    });
  }

  return req.clone({ withCredentials: true });
}
