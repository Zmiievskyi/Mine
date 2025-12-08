import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="p-6">
      <h1 class="text-2xl font-bold mb-4">Admin Panel</h1>
      <p class="text-gray-500">Admin dashboard - coming soon</p>
      <a routerLink="/dashboard" class="text-[var(--gcore-primary)] hover:underline">
        Back to Dashboard
      </a>
    </div>
  `,
})
export class AdminDashboardComponent {}
