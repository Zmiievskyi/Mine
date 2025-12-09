import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { AdminUser, UserNode } from '../../../../core/models/admin.model';

@Component({
  selector: 'app-user-list-item',
  standalone: true,
  imports: [CommonModule, DatePipe],
  template: `
    <div class="bg-white rounded-lg shadow-sm border border-[var(--gcore-border)] overflow-hidden">
      <!-- User Header -->
      <div
        class="px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-gray-50"
        (click)="toggleExpanded()"
      >
        <div class="flex items-center gap-4">
          <div
            class="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
            [class]="user.role === 'admin' ? 'bg-purple-500' : 'bg-[var(--gcore-primary)]'"
          >
            {{ user.name?.charAt(0) || user.email.charAt(0) | uppercase }}
          </div>
          <div>
            <div class="font-medium text-[var(--gcore-text)]">
              {{ user.name || 'No Name' }}
              @if (user.role === 'admin') {
                <span class="ml-2 px-2 py-0.5 text-xs bg-purple-100 text-purple-800 rounded-full">Admin</span>
              }
              @if (!user.isActive) {
                <span class="ml-2 px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">Inactive</span>
              }
            </div>
            <div class="text-sm text-[var(--gcore-text-muted)]">{{ user.email }}</div>
          </div>
        </div>
        <div class="flex items-center gap-4">
          <div class="text-sm text-[var(--gcore-text-muted)]">
            {{ user.nodes.length }} node(s)
          </div>
          <span class="text-[var(--gcore-text-muted)]">
            {{ isExpanded ? '&#9650;' : '&#9660;' }}
          </span>
        </div>
      </div>

      <!-- Expanded Content -->
      @if (isExpanded) {
        <div class="border-t border-[var(--gcore-border)] px-6 py-4 bg-gray-50">
          <!-- User Actions -->
          <div class="flex gap-2 mb-4">
            <button
              (click)="roleToggle.emit()"
              class="px-3 py-1 text-sm border border-[var(--gcore-border)] rounded hover:bg-white"
            >
              {{ user.role === 'admin' ? 'Remove Admin' : 'Make Admin' }}
            </button>
            <button
              (click)="activeToggle.emit()"
              class="px-3 py-1 text-sm border border-[var(--gcore-border)] rounded hover:bg-white"
            >
              {{ user.isActive ? 'Deactivate' : 'Activate' }}
            </button>
            <button
              (click)="assignNode.emit()"
              class="px-3 py-1 text-sm bg-[var(--gcore-primary)] text-white rounded hover:opacity-90"
            >
              + Assign Node
            </button>
          </div>

          <!-- Nodes Table -->
          @if (user.nodes.length > 0) {
            <table class="min-w-full divide-y divide-[var(--gcore-border)]">
              <thead>
                <tr>
                  <th class="py-2 text-left text-xs font-medium text-[var(--gcore-text-muted)] uppercase">Node Address</th>
                  <th class="py-2 text-left text-xs font-medium text-[var(--gcore-text-muted)] uppercase">Label</th>
                  <th class="py-2 text-left text-xs font-medium text-[var(--gcore-text-muted)] uppercase">GPU</th>
                  <th class="py-2 text-left text-xs font-medium text-[var(--gcore-text-muted)] uppercase">Assigned</th>
                  <th class="py-2 text-right text-xs font-medium text-[var(--gcore-text-muted)] uppercase">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-[var(--gcore-border)] bg-white">
                @for (node of user.nodes; track node.id) {
                  <tr>
                    <td class="py-3 font-mono text-sm text-[var(--gcore-text)]">
                      {{ truncateAddress(node.nodeAddress) }}
                    </td>
                    <td class="py-3 text-[var(--gcore-text)]">{{ node.label || '-' }}</td>
                    <td class="py-3 text-[var(--gcore-text)]">{{ node.gpuType || '-' }}</td>
                    <td class="py-3 text-sm text-[var(--gcore-text-muted)]">
                      {{ node.createdAt | date: 'MMM d, y' }}
                    </td>
                    <td class="py-3 text-right">
                      <button
                        (click)="nodeRemove.emit(node)"
                        class="text-red-600 hover:text-red-800 text-sm"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          } @else {
            <p class="text-[var(--gcore-text-muted)] text-sm py-4">No nodes assigned yet</p>
          }
        </div>
      }
    </div>
  `,
})
export class UserListItemComponent {
  @Input() user!: AdminUser;
  @Input() isExpanded = false;

  @Output() expand = new EventEmitter<void>();
  @Output() roleToggle = new EventEmitter<void>();
  @Output() activeToggle = new EventEmitter<void>();
  @Output() assignNode = new EventEmitter<void>();
  @Output() nodeRemove = new EventEmitter<UserNode>();

  toggleExpanded(): void {
    this.expand.emit();
  }

  truncateAddress(address: string): string {
    if (address.length <= 20) return address;
    return `${address.slice(0, 12)}...${address.slice(-8)}`;
  }
}
