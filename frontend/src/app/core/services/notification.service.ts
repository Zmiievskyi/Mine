import { Injectable } from '@angular/core';
import { toast } from 'ngx-sonner';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  success(message: string, duration = 5000): void {
    toast.success(message, { duration });
  }

  error(message: string, duration = 7000): void {
    toast.error(message, { duration });
  }

  warning(message: string, duration = 5000): void {
    toast.warning(message, { duration });
  }

  info(message: string, duration = 5000): void {
    toast.info(message, { duration });
  }
}
