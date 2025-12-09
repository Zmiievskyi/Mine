import { Component, EventEmitter, Output } from '@angular/core';
import { RouterModule } from '@angular/router';

/**
 * Footer component for landing page
 *
 * Displays:
 * - Brand description
 * - Product links (Features, Pricing, Get Started)
 * - Resources links (How It Works, FAQ, Gonka Network)
 * - Company links (About, Contact, Privacy, Terms)
 * - Copyright notice
 */
@Component({
  selector: 'app-landing-footer',
  standalone: true,
  imports: [RouterModule],
  template: `
    <footer class="relative z-10 border-t border-border py-12">
      <!-- Background brand text -->
      <div class="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none opacity-[0.03]">
        <span class="text-[20vw] font-bold tracking-tighter text-foreground whitespace-nowrap">MINEGNK</span>
      </div>

      <div class="mx-auto w-full max-w-screen-xl px-4 md:px-12 lg:px-20 relative">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          <!-- Brand -->
          <div class="col-span-2 md:col-span-1">
            <h3 class="text-lg font-bold mb-4">
              Mine<span class="bg-gradient-to-r from-[#FF4C00] to-[#FF7A45] bg-clip-text text-transparent">GNK</span>
            </h3>
            <p class="text-sm text-muted-foreground">
              Professional GPU mining infrastructure for the Gonka network. Earn GNK tokens with enterprise-grade hosting and monitoring.
            </p>
          </div>

          <!-- Product -->
          <div>
            <h4 class="text-sm font-semibold text-foreground mb-4">Product</h4>
            <ul class="space-y-2">
              <li><a href="#features" (click)="onSectionClick('#features'); $event.preventDefault()" class="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</a></li>
              <li><a href="#pricing" (click)="onSectionClick('#pricing'); $event.preventDefault()" class="text-sm text-muted-foreground hover:text-foreground transition-colors">Pricing</a></li>
              <li><a routerLink="/auth/register" class="text-sm text-muted-foreground hover:text-foreground transition-colors">Get Started</a></li>
            </ul>
          </div>

          <!-- Resources -->
          <div>
            <h4 class="text-sm font-semibold text-foreground mb-4">Resources</h4>
            <ul class="space-y-2">
              <li><a href="#how-it-works" (click)="onSectionClick('#how-it-works'); $event.preventDefault()" class="text-sm text-muted-foreground hover:text-foreground transition-colors">How It Works</a></li>
              <li><a href="#faq" (click)="onSectionClick('#faq'); $event.preventDefault()" class="text-sm text-muted-foreground hover:text-foreground transition-colors">FAQ</a></li>
              <li><a href="https://gonka.ai" target="_blank" rel="noopener" class="text-sm text-muted-foreground hover:text-foreground transition-colors">Gonka Network</a></li>
            </ul>
          </div>

          <!-- Company -->
          <div>
            <h4 class="text-sm font-semibold text-foreground mb-4">Company</h4>
            <ul class="space-y-2">
              <li><a href="#" class="text-sm text-muted-foreground hover:text-foreground transition-colors">About Us</a></li>
              <li><a href="#" class="text-sm text-muted-foreground hover:text-foreground transition-colors">Contact</a></li>
              <li><a href="#" class="text-sm text-muted-foreground hover:text-foreground transition-colors">Privacy Policy</a></li>
              <li><a href="#" class="text-sm text-muted-foreground hover:text-foreground transition-colors">Terms of Service</a></li>
            </ul>
          </div>
        </div>

        <!-- Copyright -->
        <div class="pt-8 border-t border-border">
          <p class="text-sm text-muted-foreground text-center">
            &copy; 2025 MineGNK
          </p>
        </div>
      </div>
    </footer>
  `
})
export class LandingFooterComponent {
  @Output() sectionClick = new EventEmitter<string>();

  onSectionClick(sectionId: string): void {
    this.sectionClick.emit(sectionId);
  }
}
