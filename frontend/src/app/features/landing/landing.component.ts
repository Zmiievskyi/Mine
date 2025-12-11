import { Component, OnInit, inject, signal, DestroyRef } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { NodesService } from '../../core/services/nodes.service';
import { NetworkStats } from '../../core/models/node.model';
import { createAutoRefresh } from '../../shared/utils';
import { REFRESH_INTERVALS } from '../../core/constants';
import { HeroSectionComponent } from './components/hero-section.component';
import { NetworkStatsComponent } from './components/network-stats.component';
import { FeaturesSectionComponent } from './components/features-section.component';
import { HowItWorksSectionComponent } from './components/how-it-works-section.component';
import { ManagedServicesSectionComponent } from './components/managed-services-section.component';
import { PricingSectionComponent } from './components/pricing-section.component';
import { FaqSectionComponent } from './components/faq-section.component';
import { LandingFooterComponent } from './components/landing-footer.component';

/**
 * Landing page component for MineGNK
 *
 * Main entry point for guest users showcasing:
 * - Hero section with value proposition
 * - Live Gonka network statistics
 * - Feature highlights for GPU mining
 * - Step-by-step guide
 * - Pricing information
 * - FAQ section
 * - Call-to-action for registration
 *
 * Uses dark theme matching minegnk.com design
 * Redirects authenticated users to dashboard
 */
@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [
    RouterModule,
    HeroSectionComponent,
    NetworkStatsComponent,
    FeaturesSectionComponent,
    HowItWorksSectionComponent,
    ManagedServicesSectionComponent,
    PricingSectionComponent,
    FaqSectionComponent,
    LandingFooterComponent
  ],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.scss'
})
export class LandingComponent implements OnInit {
  private authService = inject(AuthService);
  private nodesService = inject(NodesService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  // Navigation state
  isMobileMenuOpen = false;

  // Network stats state
  networkStats = signal<NetworkStats | null>(null);
  statsLoading = signal(true);
  statsError = signal<string | null>(null);

  // Navigation links
  navLinks = [
    { label: 'Features', href: '#features' },
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'FAQ', href: '#faq' }
  ];

  ngOnInit(): void {
    // Redirect authenticated users to dashboard
    if (this.authService.isAuthenticated) {
      this.router.navigate(['/dashboard']);
      return;
    }

    // Load network stats with auto-refresh every 60 seconds
    this.loadNetworkStats();
  }

  private loadNetworkStats(): void {
    createAutoRefresh(
      REFRESH_INTERVALS.LANDING_STATS,
      () => this.nodesService.getPublicNetworkStats(),
      this.destroyRef
    ).subscribe({
      next: (stats) => {
        this.networkStats.set(stats);
        this.statsLoading.set(false);
        this.statsError.set(null);
      },
      error: (err) => {
        this.statsLoading.set(false);
        this.statsError.set('Failed to load network stats');
        console.error('Network stats error:', err);
      }
    });
  }

  /**
   * Toggle mobile menu visibility
   */
  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  /**
   * Scroll to specific section
   */
  scrollToSection(sectionId: string): void {
    const element = document.querySelector(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      this.isMobileMenuOpen = false;
    }
  }
}
