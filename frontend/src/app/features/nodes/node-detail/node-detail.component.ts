import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-node-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="p-6">
      <h1 class="text-2xl font-bold mb-4">Node Details</h1>
      <p class="text-gray-500">Node detail view - coming soon</p>
      <a routerLink="/nodes" class="text-[var(--gcore-primary)] hover:underline">
        Back to Nodes
      </a>
    </div>
  `,
})
export class NodeDetailComponent {}
