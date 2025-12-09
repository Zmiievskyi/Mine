import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container">
      @for (notification of notificationService.notifications(); track notification.id) {
        <div
          class="toast"
          [class]="'toast--' + notification.type"
          (click)="notificationService.dismiss(notification.id)"
        >
          <span class="toast__icon">
            @switch (notification.type) {
              @case ('success') { &#10003; }
              @case ('error') { &#10007; }
              @case ('warning') { &#9888; }
              @case ('info') { &#8505; }
            }
          </span>
          <span class="toast__message">{{ notification.message }}</span>
          <button
            class="toast__close"
            (click)="notificationService.dismiss(notification.id); $event.stopPropagation()"
          >
            &times;
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      top: 1rem;
      right: 1rem;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      max-width: 400px;
    }

    .toast {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem 1.25rem;
      border-radius: 8px;
      background: var(--bg-secondary, #1a1a2e);
      border: 1px solid var(--border-color, #2a2a3e);
      color: var(--text-primary, #fff);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      cursor: pointer;
      animation: slideIn 0.3s ease-out;
    }

    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    .toast--success {
      border-left: 4px solid #22c55e;
    }

    .toast--success .toast__icon {
      color: #22c55e;
    }

    .toast--error {
      border-left: 4px solid #ef4444;
    }

    .toast--error .toast__icon {
      color: #ef4444;
    }

    .toast--warning {
      border-left: 4px solid #f59e0b;
    }

    .toast--warning .toast__icon {
      color: #f59e0b;
    }

    .toast--info {
      border-left: 4px solid #3b82f6;
    }

    .toast--info .toast__icon {
      color: #3b82f6;
    }

    .toast__icon {
      font-size: 1.25rem;
      flex-shrink: 0;
    }

    .toast__message {
      flex: 1;
      font-size: 0.875rem;
      line-height: 1.4;
    }

    .toast__close {
      background: none;
      border: none;
      color: var(--text-secondary, #888);
      font-size: 1.25rem;
      cursor: pointer;
      padding: 0;
      line-height: 1;
      transition: color 0.2s;
    }

    .toast__close:hover {
      color: var(--text-primary, #fff);
    }
  `],
})
export class ToastComponent {
  notificationService = inject(NotificationService);
}
