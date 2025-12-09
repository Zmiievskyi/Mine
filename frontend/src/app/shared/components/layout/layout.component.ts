import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { HlmButton } from '@spartan-ng/helm/button';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, HlmButton],
  styles: `
    .nav-link {
      display: block;
      padding: 0.5rem 1rem;
      border-radius: 0.25rem;
      color: var(--gcore-text);
      transition: background-color 0.15s ease;
    }
    .nav-link:hover:not(.active-link) {
      background-color: #f3f4f6;
    }
    .nav-link.active-link {
      background-color: var(--gcore-primary);
      color: white;
    }
    .nav-link.active-link:hover {
      background-color: var(--gcore-primary);
      opacity: 0.9;
    }
  `,
  template: `
    <div class="min-h-screen bg-[var(--gcore-bg)]">
      <!-- Header -->
      <header class="bg-white border-b border-[var(--gcore-border)] px-6 py-4">
        <div class="flex items-center justify-between">
          <h1 class="text-xl font-bold text-[var(--gcore-text)]">MineGNK</h1>
          <div class="flex items-center gap-4">
            <span class="text-sm text-[var(--gcore-text-muted)]">
              {{ authService.currentUser()?.email }}
            </span>
            <button hlmBtn variant="ghost" size="sm" (click)="logout()">
              Logout
            </button>
          </div>
        </div>
      </header>

      <div class="flex">
        <!-- Sidebar -->
        <aside class="w-64 bg-white border-r border-[var(--gcore-border)] min-h-[calc(100vh-65px)]">
          <nav class="p-4">
            <ul class="space-y-2">
              <li>
                <a
                  routerLink="/dashboard"
                  routerLinkActive="active-link"
                  [routerLinkActiveOptions]="{ exact: true }"
                  class="nav-link"
                >
                  Dashboard
                </a>
              </li>
              <li>
                <a
                  routerLink="/nodes"
                  routerLinkActive="active-link"
                  [routerLinkActiveOptions]="{ exact: true }"
                  class="nav-link"
                >
                  My Nodes
                </a>
              </li>
              <li>
                <a
                  routerLink="/nodes/request"
                  routerLinkActive="active-link"
                  class="nav-link"
                >
                  Request Node
                </a>
              </li>
              <li>
                <a
                  routerLink="/requests"
                  routerLinkActive="active-link"
                  class="nav-link"
                >
                  My Requests
                </a>
              </li>
              @if (authService.isAdmin()) {
                <li class="pt-4 border-t border-[var(--gcore-border)] mt-4">
                  <a
                    routerLink="/admin"
                    routerLinkActive="active-link"
                    class="nav-link"
                  >
                    Admin Panel
                  </a>
                </li>
              }
            </ul>
          </nav>
        </aside>

        <!-- Main Content -->
        <main class="flex-1 p-6">
          <ng-content></ng-content>
        </main>
      </div>
    </div>
  `,
})
export class LayoutComponent {
  @Input() pageTitle = '';

  authService = inject(AuthService);
  private router = inject(Router);

  logout(): void {
    this.authService.logout();
  }

  isActive(route: string): boolean {
    return this.router.url === route;
  }
}
