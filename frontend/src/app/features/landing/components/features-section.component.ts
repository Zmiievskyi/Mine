import { Component, ChangeDetectionStrategy } from '@angular/core';
import { ScrollRevealDirective } from '../../../shared/directives/scroll-reveal.directive';

/**
 * Features section component for landing page
 *
 * Highlights the main value propositions:
 * - Pay in fiat currency (no crypto wallet needed)
 * - Enterprise-grade GPUs
 * - AI-focused tokens (GNK)
 */
@Component({
  selector: 'app-features-section',
  standalone: true,
  imports: [ScrollRevealDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section id="features" class="py-16 md:py-24">
      <div class="mx-auto w-full max-w-screen-xl px-4 md:px-12 lg:px-20">
        <!-- Section Header -->
        <div appScrollReveal class="text-center mb-12">
          <span class="inline-flex items-center justify-center rounded-full border border-[#FF4C00]/50 bg-transparent px-4 py-1.5 text-sm font-medium text-white mb-4">
            Why mine with us
          </span>
          <h2 class="text-2xl md:text-3xl font-bold mb-4">Simple onboarding, powerful results</h2>
          <p class="text-muted-foreground max-w-2xl mx-auto">
            Mining as a service: pay in fiat, use enterprise GPUs, earn AI-focused tokens.
          </p>
        </div>

        <!-- Features Grid -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div appScrollReveal [revealDelay]="0" class="rounded-xl border border-border bg-card/30 p-6 hover:bg-card/50 transition-colors">
            <h3 class="text-lg font-semibold text-foreground mb-3">Pay in Fiat Currency</h3>
            <p class="text-muted-foreground text-sm">
              No wallets or exchanges needed. Onboard fast and start mining immediately.
            </p>
          </div>
          <div appScrollReveal [revealDelay]="100" class="rounded-xl border border-border bg-card/30 p-6 hover:bg-card/50 transition-colors">
            <h3 class="text-lg font-semibold text-foreground mb-3">Enterprise-grade GPUs</h3>
            <p class="text-muted-foreground text-sm">
              Access dedicated, high-performance GPUs for reliable, efficient mining.
            </p>
          </div>
          <div appScrollReveal [revealDelay]="200" class="rounded-xl border border-border bg-card/30 p-6 hover:bg-card/50 transition-colors">
            <h3 class="text-lg font-semibold text-foreground mb-3">AI-Focused Tokens</h3>
            <p class="text-muted-foreground text-sm">
              Earn tokens designed for AI inference workloads across the Gonka network.
            </p>
          </div>
        </div>
      </div>
    </section>
  `
})
export class FeaturesSectionComponent {}
