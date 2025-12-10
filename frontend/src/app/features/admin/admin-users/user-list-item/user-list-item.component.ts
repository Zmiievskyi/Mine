import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminUser, AdminUserWithStats, UserNodeWithStats } from '../../../../core/models/admin.model';
import { getNodeStatusVariant, truncateAddress } from '../../../../shared/utils';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmTableImports } from '@spartan-ng/helm/table';
import { HlmBadge } from '@spartan-ng/helm/badge';
import { HlmButton } from '@spartan-ng/helm/button';

@Component({
  selector: 'app-user-list-item',
  standalone: true,
  imports: [CommonModule, HlmCardImports, HlmTableImports, HlmBadge, HlmButton],
  templateUrl: './user-list-item.component.html',
})
export class UserListItemComponent {
  user = input.required<AdminUser>();
  isExpanded = input(false);
  expandedData = input<AdminUserWithStats | null>(null);
  expandedLoading = input(false);

  expand = output<void>();
  roleToggle = output<void>();
  activeToggle = output<void>();
  assignNode = output<void>();
  nodeRemove = output<UserNodeWithStats>();

  toggleExpanded(): void {
    this.expand.emit();
  }

  getTruncatedAddress = truncateAddress;
  getStatusVariant = getNodeStatusVariant;
}
