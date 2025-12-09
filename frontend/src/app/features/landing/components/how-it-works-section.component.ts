import { Component } from '@angular/core';
import { ScrollRevealDirective } from '../../../shared/directives/scroll-reveal.directive';

/**
 * How It Works section component for landing page
 *
 * Displays 3-step process:
 * 1. Complete KYC verification
 * 2. Sign contract and pay
 * 3. Start mining and earn
 */
@Component({
  selector: 'app-how-it-works-section',
  standalone: true,
  imports: [ScrollRevealDirective],
  template: `
    <section id="how-it-works" class="py-16 md:py-24">
      <div class="mx-auto w-full max-w-screen-xl px-4 md:px-12 lg:px-20">
        <!-- Section Header -->
        <div appScrollReveal class="text-center mb-12">
          <span class="inline-flex items-center justify-center rounded-full border border-[#FF4C00]/50 bg-transparent px-4 py-1.5 text-sm font-medium text-white mb-4">
            How it works
          </span>
          <h2 class="text-2xl md:text-3xl font-bold mb-4">Start mining in 3 steps</h2>
          <p class="text-muted-foreground max-w-2xl mx-auto">
            We handle the infrastructure while you focus on earning tokens.
          </p>
        </div>

        <!-- Steps -->
        <div class="space-y-8 max-w-3xl mx-auto">
          <!-- Step 1 -->
          <div appScrollReveal [revealDelay]="0" class="flex gap-6 items-start">
            <div class="flex-shrink-0 w-12 h-12 rounded-xl border border-border bg-card/50 flex items-center justify-center">
              <svg class="w-6 h-6 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
            </div>
            <div class="flex-1">
              <div class="inline-flex items-center gap-3 mb-2">
                <span class="text-xs font-bold text-accent bg-accent/10 px-2 py-0.5 rounded">1</span>
                <h3 class="text-lg font-semibold text-foreground">Complete KYC Verification</h3>
              </div>
              <p class="text-muted-foreground text-sm">
                Submit your form and go through our KYC procedure to verify your identity and ensure compliance with regulations.
              </p>
            </div>
          </div>

          <!-- Step 2 -->
          <div appScrollReveal [revealDelay]="100" class="flex gap-6 items-start">
            <div class="flex-shrink-0 w-12 h-12 rounded-xl border border-border bg-card/50 flex items-center justify-center">
              <svg class="w-6 h-6 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
              </svg>
            </div>
            <div class="flex-1">
              <div class="inline-flex items-center gap-3 mb-2">
                <span class="text-xs font-bold text-accent bg-accent/10 px-2 py-0.5 rounded">2</span>
                <h3 class="text-lg font-semibold text-foreground">Sign Contract and Pay</h3>
              </div>
              <p class="text-muted-foreground text-sm">
                Review and sign your mining contract, then make the payment for your first month to secure your GPU allocation.
              </p>
            </div>
          </div>

          <!-- Step 3 -->
          <div appScrollReveal [revealDelay]="200" class="flex gap-6 items-start">
            <div class="flex-shrink-0 w-12 h-12 rounded-xl border border-border bg-card/50 flex items-center justify-center">
              <svg class="w-6 h-6 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
              </svg>
            </div>
            <div class="flex-1">
              <div class="inline-flex items-center gap-3 mb-2">
                <span class="text-xs font-bold text-accent bg-accent/10 px-2 py-0.5 rounded">3</span>
                <h3 class="text-lg font-semibold text-foreground">Start Mining and Earn</h3>
              </div>
              <p class="text-muted-foreground text-sm">
                We set up your GPUs and provide access to mining statistics. Start receiving daily payouts to your GNK token wallet.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  `
})
export class HowItWorksSectionComponent {}
