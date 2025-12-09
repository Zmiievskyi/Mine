import { Injectable } from '@angular/core';
import { toast } from 'ngx-sonner';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

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

  show(type: NotificationType, message: string, duration = 5000): void {
    switch (type) {
      case 'success':
        this.success(message, duration);
        break;
      case 'error':
        this.error(message, duration);
        break;
      case 'warning':
        this.warning(message, duration);
        break;
      case 'info':
        this.info(message, duration);
        break;
    }
  }

  dismissAll(): void {
    toast.dismiss();
  }
}
