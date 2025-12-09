import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ScrollRevealDirective } from '../../../shared/directives/scroll-reveal.directive';

/**
 * FAQ section component for landing page
 *
 * Displays frequently asked questions about:
 * - Mining as a service concept
 * - Payment structure
 * - GNK tokens
 * - Scaling capabilities
 * - Performance tracking
 */
@Component({
  selector: 'app-faq-section',
  standalone: true,
  imports: [RouterModule, ScrollRevealDirective],
  template: `
    <section id="faq" class="py-16 md:py-24">
      <div class="mx-auto w-full max-w-screen-xl px-4 md:px-12 lg:px-20">
        <!-- Section Header -->
        <div appScrollReveal class="text-center mb-12">
          <span class="inline-flex items-center justify-center rounded-full border border-[#FF4C00]/50 bg-transparent px-4 py-1.5 text-sm font-medium text-white mb-4">
            Frequently Asked Questions
          </span>
          <h2 class="text-2xl md:text-3xl font-bold">What people ask about MineGNK</h2>
        </div>

        <!-- FAQ Items -->
        <div class="max-w-3xl mx-auto space-y-4">
          <div appScrollReveal [revealDelay]="0" class="rounded-xl border border-border bg-card/30 p-6">
            <h3 class="text-lg font-semibold text-foreground mb-3">What is mining as a service?</h3>
            <p class="text-muted-foreground text-sm">
              We provision and manage enterprise-grade GPUs for you. You pay in fiat and earn AI-focused tokens while we handle the infrastructure.
            </p>
          </div>
          <div appScrollReveal [revealDelay]="50" class="rounded-xl border border-border bg-card/30 p-6">
            <h3 class="text-lg font-semibold text-foreground mb-3">How do I get paid?</h3>
            <p class="text-muted-foreground text-sm">
              You receive daily payouts to your GNK token wallet. We provide real-time monitoring and transparent reporting.
            </p>
          </div>
          <div appScrollReveal [revealDelay]="100" class="rounded-xl border border-border bg-card/30 p-6">
            <h3 class="text-lg font-semibold text-foreground mb-3">What makes Gonka tokens special?</h3>
            <p class="text-muted-foreground text-sm">
              GNK is designed for AI inference workloads in the Gonka network, aligning rewards with real compute supply and demand.
            </p>
          </div>
          <div appScrollReveal [revealDelay]="150" class="rounded-xl border border-border bg-card/30 p-6">
            <h3 class="text-lg font-semibold text-foreground mb-3">Can I scale my mining operation?</h3>
            <p class="text-muted-foreground text-sm">
              Yes. Start small and scale up capacity as you grow. Our team helps you expand without disrupting uptime.
            </p>
          </div>
          <div appScrollReveal [revealDelay]="200" class="rounded-xl border border-border bg-card/30 p-6">
            <h3 class="text-lg font-semibold text-foreground mb-3">How can I track performance?</h3>
            <p class="text-muted-foreground text-sm">
              Use our dashboard for live stats, daily earnings, and historical trends. We also expose APIs for deeper integration.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="py-16 md:py-24">
      <div class="mx-auto w-full max-w-screen-xl px-4 md:px-12 lg:px-20">
        <div class="text-center max-w-2xl mx-auto">
          <h2 appScrollReveal class="text-2xl md:text-3xl font-bold mb-4">Start mining for the AI future today</h2>
          <p appScrollReveal [revealDelay]="100" class="text-muted-foreground mb-8">
            Join the Gonka network and earn tokens that power tomorrow's AI applications.
            No hardware required—just choose a package and start earning.
          </p>
          <a appScrollReveal [revealDelay]="200" routerLink="/auth/register"
             class="group relative inline-flex items-center gap-2 h-12 px-8 text-base font-semibold rounded-lg bg-white/80 text-zinc-900 hover:bg-white/70 transition-all overflow-hidden">
            <span class="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></span>
            <span class="relative">Start Mining</span>
            <svg class="relative w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path>
            </svg>
          </a>
        </div>
      </div>
    </section>
  `
})
export class FaqSectionComponent {}
