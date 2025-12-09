import { Component, HostListener, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

/**
 * Header component for MineGNK landing page
 *
 * Features:
 * - Sticky header with semi-transparent background
 * - Responsive hamburger menu for mobile
 * - Smooth scroll to page sections
 * - Active section highlighting based on scroll position
 * - Navigation to auth routes
 *
 * Usage:
 * <app-header />
 */
@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent {
  mobileMenuOpen = signal(false);
  activeSection = signal('');
  scrolled = signal(false);

  navLinks = [
    { label: 'Features', href: '#features' },
    { label: 'How it works', href: '#how-it-works' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'FAQ', href: '#faq' }
  ];

  toggleMobileMenu(): void {
    this.mobileMenuOpen.update(value => !value);
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }

  /**
   * Smooth scroll to section and update active state
   */
  scrollToSection(event: Event, href: string): void {
    event.preventDefault();
    this.closeMobileMenu();

    const sectionId = href.substring(1); // Remove '#'
    const element = document.getElementById(sectionId);

    if (element) {
      const headerHeight = 80; // Account for fixed header
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerHeight;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });

      this.activeSection.set(sectionId);
    }
  }

  /**
   * Detect scroll position to:
   * 1. Add background blur to header when scrolled
   * 2. Highlight active section in navigation
   */
  @HostListener('window:scroll', [])
  onWindowScroll(): void {
    // Add blur effect after 50px scroll
    this.scrolled.set(window.pageYOffset > 50);

    // Detect active section
    const sections = this.navLinks.map(link => link.href.substring(1));
    const scrollPosition = window.pageYOffset + 150;

    for (const sectionId of sections) {
      const element = document.getElementById(sectionId);
      if (element) {
        const offsetTop = element.offsetTop;
        const offsetBottom = offsetTop + element.offsetHeight;

        if (scrollPosition >= offsetTop && scrollPosition < offsetBottom) {
          this.activeSection.set(sectionId);
          break;
        }
      }
    }
  }

  isActive(href: string): boolean {
    return this.activeSection() === href.substring(1);
  }
}
