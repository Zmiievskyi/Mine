import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
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
    CommonModule,
    RouterLink,
    LayoutComponent,
    LoadingSpinnerComponent,
    HlmCardImports,
    HlmTableImports,
    HlmBadge,
    HlmButton,
  ],
  templateUrl: './admin-analytics.component.html',
})
export class AdminAnalyticsComponent implements OnInit {
  private adminService = inject(AdminService);

  analytics = signal<AdminAnalytics | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);

  ngOnInit(): void {
    this.loadAnalytics();
  }

  loadAnalytics(): void {
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
