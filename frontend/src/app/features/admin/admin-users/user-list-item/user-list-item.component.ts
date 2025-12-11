import { Component, input, output, ChangeDetectionStrategy, computed } from '@angular/core';
import { UpperCasePipe, DatePipe } from '@angular/common';
import { AdminUser, AdminUserWithStats, UserNodeWithStats, KycStatus } from '../../../../core/models/admin.model';
import { getNodeStatusVariant, truncateAddress } from '../../../../shared/utils';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmTableImports } from '@spartan-ng/helm/table';
import { HlmBadge } from '@spartan-ng/helm/badge';
import { HlmButton } from '@spartan-ng/helm/button';

@Component({
  selector: 'app-user-list-item',
  standalone: true,
  imports: [UpperCasePipe, DatePipe, HlmCardImports, HlmTableImports, HlmBadge, HlmButton],
  templateUrl: './user-list-item.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserListItemComponent {
  // Inputs - public API for parent components
  public readonly user = input.required<AdminUser>();
  public readonly isExpanded = input(false);
  public readonly expandedData = input<AdminUserWithStats | null>(null);
  public readonly expandedLoading = input(false);

  // Outputs - public API for parent components
  public readonly expand = output<void>();
  public readonly roleToggle = output<void>();
  public readonly activeToggle = output<void>();
  public readonly assignNode = output<void>();
  public readonly nodeRemove = output<UserNodeWithStats>();
  public readonly kycVerify = output<void>();
  public readonly kycReject = output<void>();

  protected toggleExpanded(): void {
    this.expand.emit();
  }

  protected readonly getTruncatedAddress = truncateAddress;
  protected readonly getStatusVariant = getNodeStatusVariant;

  protected getKycBadgeVariant(status?: KycStatus): 'default' | 'secondary' | 'destructive' | 'outline' {
    switch (status) {
      case 'verified':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'rejected':
        return 'destructive';
      default:
        return 'outline';
    }
  }

  protected getKycBadgeLabel(status?: KycStatus): string {
    switch (status) {
      case 'verified':
        return 'KYC Verified';
      case 'pending':
        return 'KYC Pending';
      case 'rejected':
        return 'KYC Rejected';
      case 'not_submitted':
        return 'No KYC';
      default:
        return 'No KYC';
    }
  }
}
