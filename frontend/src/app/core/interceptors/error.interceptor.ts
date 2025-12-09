import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { NotificationService } from '../services/notification.service';
import { AuthService } from '../services/auth.service';

const ERROR_MESSAGES: Record<number, string> = {
  0: 'Unable to connect to server. Please check your internet connection.',
  400: 'Invalid request. Please check your input.',
  401: 'Your session has expired. Please log in again.',
  403: 'You do not have permission to perform this action.',
  404: 'The requested resource was not found.',
  409: 'This resource already exists.',
  429: 'Too many requests. Please wait a moment and try again.',
  500: 'An unexpected error occurred. Please try again later.',
  502: 'Server is temporarily unavailable. Please try again later.',
  503: 'Service temporarily unavailable. Please try again later.',
  504: 'Request timed out. Please try again.',
};

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const notificationService = inject(NotificationService);
  const authService = inject(AuthService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Don't show error for 401 on auth endpoints (handled separately)
      const isAuthEndpoint = req.url.includes('/auth/');

      if (error.status === 401) {
        authService.logout();
        if (!isAuthEndpoint) {
          notificationService.error(ERROR_MESSAGES[401]);
        }
        return throwError(() => error);
      }

      // Get user-friendly message
      const message = getErrorMessage(error);

      // Only show notification for non-auth errors or failed logins
      if (!isAuthEndpoint || error.status !== 401) {
        notificationService.error(message);
      }

      return throwError(() => error);
    })
  );
};

function getErrorMessage(error: HttpErrorResponse): string {
  // Check for backend error message first
  if (error.error?.message) {
    return typeof error.error.message === 'string'
      ? error.error.message
      : error.error.message[0];
  }

  // Fallback to predefined messages
  return ERROR_MESSAGES[error.status] || 'An unexpected error occurred.';
}
