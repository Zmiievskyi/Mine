import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { NotificationService } from '../services/notification.service';

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

/**
 * Error interceptor that shows user-friendly error notifications.
 * Note: 401 errors are handled by authInterceptor with silent refresh.
 * This interceptor only shows the notification AFTER refresh has failed.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const notificationService = inject(NotificationService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      const isAuthEndpoint = req.url.includes('/auth/');

      // For 401 errors:
      // - Auth endpoints (login/register): Show backend error message
      // - Other endpoints: Show session expired (this runs after authInterceptor refresh fails)
      if (error.status === 401) {
        if (!isAuthEndpoint) {
          notificationService.error(ERROR_MESSAGES[401]);
        }
        return throwError(() => error);
      }

      // Get user-friendly message
      const message = getErrorMessage(error);

      // Show notification for all non-401 errors
      // Don't show for some auth endpoints (e.g., login validation errors are shown in forms)
      if (!isAuthEndpoint || ![400].includes(error.status)) {
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
