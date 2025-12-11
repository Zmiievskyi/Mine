import { Component, OnInit, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AdminService } from '../../../core/services/admin.service';
import { LayoutComponent } from '../../../shared/components/layout/layout.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { AdminAnalytics } from '../../../core/models/admin.model';
import { handleApiError } from '../../../shared/utils';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmTableImports } from '@spartan-ng/helm/table';
import { HlmBadge } from '@spartan-ng/helm/badge';
import { HlmButton } from '@spartan-ng/helm/button';

@Component({
  selector: 'app-admin-analytics',
  standalone: true,
  imports: [
    RouterLink,
    LayoutComponent,
    LoadingSpinnerComponent,
    HlmCardImports,
    HlmTableImports,
    HlmBadge,
    HlmButton,
  ],
  templateUrl: './admin-analytics.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminAnalyticsComponent implements OnInit {
  private readonly adminService = inject(AdminService);

  protected readonly analytics = signal<AdminAnalytics | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  public ngOnInit(): void {
    this.loadAnalytics();
  }

  protected loadAnalytics(): void {
    this.loading.set(true);
    this.error.set(null);

    this.adminService.getAnalytics().subscribe({
      next: (data) => {
        this.analytics.set(data);
        this.loading.set(false);
      },
      error: (err) => handleApiError(err, 'Failed to load analytics', this.error, this.loading),
    });
  }
}
