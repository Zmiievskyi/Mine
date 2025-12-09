import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminUser, AdminUserWithStats, UserNode, UserNodeWithStats, NodeStatus } from '../../../../core/models/admin.model';
import { getNodeStatusVariant } from '../../../../shared/utils/node-status.util';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmTableImports } from '@spartan-ng/helm/table';
import { HlmBadge } from '@spartan-ng/helm/badge';
import { HlmButton } from '@spartan-ng/helm/button';

@Component({
  selector: 'app-user-list-item',
  standalone: true,
  imports: [CommonModule, HlmCardImports, HlmTableImports, HlmBadge, HlmButton],
  template: `
    <section hlmCard class="overflow-hidden">
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
                <span hlmBadge class="ml-2 bg-purple-100 text-purple-800">Admin</span>
              }
              @if (!user.isActive) {
                <span hlmBadge variant="secondary" class="ml-2">Inactive</span>
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
            <button hlmBtn variant="outline" size="sm" (click)="roleToggle.emit()">
              {{ user.role === 'admin' ? 'Remove Admin' : 'Make Admin' }}
            </button>
            <button hlmBtn variant="outline" size="sm" (click)="activeToggle.emit()">
              {{ user.isActive ? 'Deactivate' : 'Activate' }}
            </button>
            <button hlmBtn size="sm" (click)="assignNode.emit()">
              + Assign Node
            </button>
          </div>

          <!-- Loading state -->
          @if (expandedLoading) {
            <div class="py-4 text-center text-[var(--gcore-text-muted)]">
              Loading nodes...
            </div>
          }

          <!-- Nodes Table with Live Stats -->
          @if (!expandedLoading && expandedData && expandedData.nodes.length > 0) {
            <div hlmTableContainer>
              <table hlmTable>
                <thead hlmThead>
                  <tr hlmTr>
                    <th hlmTh>Node Address</th>
                    <th hlmTh>GPU</th>
                    <th hlmTh class="text-center">Status</th>
                    <th hlmTh class="text-right">Earnings</th>
                    <th hlmTh class="text-right">Uptime</th>
                    <th hlmTh class="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody hlmTbody>
                  @for (node of expandedData.nodes; track node.id) {
                    <tr hlmTr>
                      <td hlmTd>
                        <div class="font-mono text-sm text-[var(--gcore-text)]">
                          {{ truncateAddress(node.nodeAddress) }}
                        </div>
                        @if (node.label) {
                          <div class="text-xs text-[var(--gcore-text-muted)]">{{ node.label }}</div>
                        }
                      </td>
                      <td hlmTd>
                        <span hlmBadge variant="secondary">{{ node.gpuType || '-' }}</span>
                      </td>
                      <td hlmTd class="text-center">
                        <span hlmBadge [variant]="getStatusVariant(node.status)">{{ node.status }}</span>
                      </td>
                      <td hlmTd class="text-right font-medium text-[var(--gcore-text)]">
                        {{ node.earnings.toFixed(2) }} GNK
                      </td>
                      <td hlmTd class="text-right">
                        <span [class]="node.uptime >= 95 ? 'text-green-600' : node.uptime >= 80 ? 'text-yellow-600' : 'text-red-600'">
                          {{ node.uptime.toFixed(1) }}%
                        </span>
                      </td>
                      <td hlmTd class="text-right">
                        <button hlmBtn variant="destructive" size="sm" (click)="nodeRemove.emit(node)">
                          Remove
                        </button>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          } @else if (!expandedLoading && (!expandedData || expandedData.nodes.length === 0)) {
            <p class="text-[var(--gcore-text-muted)] text-sm py-4">No nodes assigned yet</p>
          }
        </div>
      }
    </section>
  `,
})
export class UserListItemComponent {
  @Input() user!: AdminUser;
  @Input() isExpanded = false;
  @Input() expandedData: AdminUserWithStats | null = null;
  @Input() expandedLoading = false;

  @Output() expand = new EventEmitter<void>();
  @Output() roleToggle = new EventEmitter<void>();
  @Output() activeToggle = new EventEmitter<void>();
  @Output() assignNode = new EventEmitter<void>();
  @Output() nodeRemove = new EventEmitter<UserNodeWithStats>();

  toggleExpanded(): void {
    this.expand.emit();
  }

  truncateAddress(address: string): string {
    if (address.length <= 20) return address;
    return `${address.slice(0, 12)}...${address.slice(-8)}`;
  }

  getStatusVariant = getNodeStatusVariant;
}
