import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { retry, timer } from 'rxjs';

const RETRY_COUNT = 2;
const RETRY_DELAY_MS = 1000;
const RETRYABLE_STATUS_CODES = [0, 502, 503, 504];

export const retryInterceptor: HttpInterceptorFn = (req, next) => {
  // Only retry GET requests (idempotent)
  if (req.method !== 'GET') {
    return next(req);
  }

  // Skip retry for auth endpoints
  if (req.url.includes('/auth/')) {
    return next(req);
  }

  return next(req).pipe(
    retry({
      count: RETRY_COUNT,
      delay: (error: HttpErrorResponse, retryCount: number) => {
        // Only retry for network errors and specific server errors
        if (!RETRYABLE_STATUS_CODES.includes(error.status)) {
          throw error;
        }

        // Exponential backoff: 1s, 2s
        const delay = RETRY_DELAY_MS * Math.pow(2, retryCount - 1);
        return timer(delay);
      },
    })
  );
};
