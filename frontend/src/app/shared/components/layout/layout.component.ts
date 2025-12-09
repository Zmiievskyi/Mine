import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
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
            <button
              (click)="logout()"
              class="text-sm text-[var(--gcore-primary)] hover:underline"
            >
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
                  routerLinkActive="bg-[var(--gcore-primary)] text-white"
                  [routerLinkActiveOptions]="{ exact: true }"
                  class="block px-4 py-2 rounded text-[var(--gcore-text)] hover:bg-gray-100"
                  [class.hover:bg-gray-100]="!isActive('/dashboard')"
                >
                  Dashboard
                </a>
              </li>
              <li>
                <a
                  routerLink="/nodes"
                  routerLinkActive="bg-[var(--gcore-primary)] text-white"
                  [routerLinkActiveOptions]="{ exact: true }"
                  class="block px-4 py-2 rounded text-[var(--gcore-text)] hover:bg-gray-100"
                >
                  My Nodes
                </a>
              </li>
              <li>
                <a
                  routerLink="/nodes/request"
                  routerLinkActive="bg-[var(--gcore-primary)] text-white"
                  class="block px-4 py-2 rounded text-[var(--gcore-text)] hover:bg-gray-100"
                >
                  Request Node
                </a>
              </li>
              <li>
                <a
                  routerLink="/requests"
                  routerLinkActive="bg-[var(--gcore-primary)] text-white"
                  class="block px-4 py-2 rounded text-[var(--gcore-text)] hover:bg-gray-100"
                >
                  My Requests
                </a>
              </li>
              @if (authService.isAdmin()) {
                <li class="pt-4 border-t border-[var(--gcore-border)] mt-4">
                  <a
                    routerLink="/admin"
                    routerLinkActive="bg-[var(--gcore-primary)] text-white"
                    class="block px-4 py-2 rounded text-[var(--gcore-text)] hover:bg-gray-100"
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
