import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

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
 * Uses dark theme with purple/violet accent colors
 * Redirects authenticated users to dashboard
 */
@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.scss'
})
export class LandingComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);

  // Navigation state
  isMobileMenuOpen = false;

  // Navigation links
  navLinks = [
    { label: 'Features', href: '#features' },
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'FAQ', href: '#faq' }
  ];

  ngOnInit(): void {
    // Redirect authenticated users to dashboard
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/dashboard']);
    }
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

  /**
   * Navigate to auth page
   */
  navigateToAuth(mode: 'login' | 'register'): void {
    // This will be handled by router
    this.isMobileMenuOpen = false;
  }
}
