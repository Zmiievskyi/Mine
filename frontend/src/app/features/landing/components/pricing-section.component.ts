import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ScrollRevealDirective } from '../../../shared/directives/scroll-reveal.directive';

/**
 * Pricing section component for landing page
 *
 * Displays GPU mining packages:
 * - A100: €1.67/hour
 * - H100: €2.76/hour
 * - H200: Custom pricing (contact sales)
 *
 * Each card shows GPU specs and features
 */
@Component({
  selector: 'app-pricing-section',
  standalone: true,
  imports: [RouterModule, ScrollRevealDirective],
  template: `
    <section id="pricing" class="py-16 md:py-24">
      <div class="mx-auto w-full max-w-screen-xl px-4 md:px-12 lg:px-20">
        <!-- Section Header -->
        <div appScrollReveal class="text-center mb-12">
          <span class="inline-flex items-center justify-center rounded-full border border-[#FF4C00]/50 bg-transparent px-4 py-1.5 text-sm font-medium text-white mb-4">
            Simple Pricing
          </span>
          <h2 class="text-2xl md:text-3xl font-bold mb-4">Choose your GPU mining package</h2>
          <p class="text-muted-foreground max-w-2xl mx-auto">
            All packages include access to our mining network and token earning capabilities. No setup fees or hidden costs.
          </p>
        </div>

        <!-- Pricing Cards -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <!-- A100 -->
          <div appScrollReveal [revealDelay]="0" class="rounded-xl border border-border bg-card/30 p-6 flex flex-col">
            <div class="mb-6">
              <h3 class="text-xl font-bold text-foreground mb-2">A100</h3>
              <p class="text-sm text-muted-foreground">Data center GPU for AI workloads</p>
            </div>
            <ul class="space-y-3 mb-6 flex-1">
              <li class="flex items-center gap-2 text-sm text-muted-foreground">
                <svg class="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
                80GB HBM2e memory
              </li>
              <li class="flex items-center gap-2 text-sm text-muted-foreground">
                <svg class="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
                6,912 CUDA cores
              </li>
              <li class="flex items-center gap-2 text-sm text-muted-foreground">
                <svg class="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
                Ampere architecture
              </li>
              <li class="flex items-center gap-2 text-sm text-muted-foreground">
                <svg class="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
                24/7 monitoring
              </li>
              <li class="flex items-center gap-2 text-sm text-muted-foreground">
                <svg class="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
                Email support
              </li>
              <li class="flex items-center gap-2 text-sm text-[#FF4C00]">
                <svg class="w-4 h-4 text-[#FF4C00]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
                Full managed service included
              </li>
            </ul>
            <div class="mb-6">
              <span class="text-3xl font-bold text-foreground">€1.67</span>
              <span class="text-muted-foreground">/ hour</span>
            </div>
            <a routerLink="/auth/register"
               class="w-full inline-flex items-center justify-center h-10 px-4 text-sm font-medium rounded-lg border border-border bg-transparent text-foreground hover:bg-white/5 transition-colors">
              Start Mining
            </a>
          </div>

          <!-- H100 -->
          <div appScrollReveal [revealDelay]="100" class="rounded-xl border border-border bg-card/30 p-6 flex flex-col">
            <div class="mb-6">
              <h3 class="text-xl font-bold text-foreground mb-2">H100</h3>
              <p class="text-sm text-muted-foreground">Next-gen Hopper GPU for maximum performance</p>
            </div>
            <ul class="space-y-3 mb-6 flex-1">
              <li class="flex items-center gap-2 text-sm text-muted-foreground">
                <svg class="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
                80GB HBM3 memory
              </li>
              <li class="flex items-center gap-2 text-sm text-muted-foreground">
                <svg class="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
                16,896 CUDA cores
              </li>
              <li class="flex items-center gap-2 text-sm text-muted-foreground">
                <svg class="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
                Hopper architecture
              </li>
              <li class="flex items-center gap-2 text-sm text-muted-foreground">
                <svg class="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
                Priority support
              </li>
              <li class="flex items-center gap-2 text-sm text-muted-foreground">
                <svg class="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
                3200 Gbps InfiniBand
              </li>
              <li class="flex items-center gap-2 text-sm text-[#FF4C00]">
                <svg class="w-4 h-4 text-[#FF4C00]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
                Full managed service included
              </li>
            </ul>
            <div class="mb-6">
              <span class="text-3xl font-bold text-foreground">€2.76</span>
              <span class="text-muted-foreground">/ hour</span>
            </div>
            <a routerLink="/auth/register"
               class="w-full inline-flex items-center justify-center h-10 px-4 text-sm font-medium rounded-lg border border-border bg-transparent text-foreground hover:bg-white/5 transition-colors">
              Get Started
            </a>
          </div>

          <!-- H200 -->
          <div appScrollReveal [revealDelay]="200" class="rounded-xl border border-border bg-card/30 p-6 flex flex-col">
            <div class="mb-6">
              <h3 class="text-xl font-bold text-foreground mb-2">H200</h3>
              <p class="text-sm text-muted-foreground">Latest Hopper with 141GB HBM3e memory</p>
            </div>
            <ul class="space-y-3 mb-6 flex-1">
              <li class="flex items-center gap-2 text-sm text-muted-foreground">
                <svg class="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
                141GB HBM3e memory
              </li>
              <li class="flex items-center gap-2 text-sm text-muted-foreground">
                <svg class="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
                16,896 CUDA cores
              </li>
              <li class="flex items-center gap-2 text-sm text-muted-foreground">
                <svg class="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
                Dedicated support &amp; SLA guarantees
              </li>
              <li class="flex items-center gap-2 text-sm text-muted-foreground">
                <svg class="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
                3200 Gbps InfiniBand
              </li>
              <li class="flex items-center gap-2 text-sm text-muted-foreground">
                <svg class="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
                Volume discounts
              </li>
              <li class="flex items-center gap-2 text-sm text-[#FF4C00]">
                <svg class="w-4 h-4 text-[#FF4C00]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
                Full managed service included
              </li>
            </ul>
            <div class="mb-6">
              <span class="text-xl font-bold text-foreground">Custom pricing</span>
            </div>
            <a href="mailto:sales&#64;gcore.com"
               class="w-full inline-flex items-center justify-center h-10 px-4 text-sm font-medium rounded-lg border border-border bg-transparent text-foreground hover:bg-white/5 transition-colors">
              Contact Sales
            </a>
          </div>
        </div>

        <!-- No credit card note -->
        <div class="flex items-center justify-center gap-2 mt-8 text-sm text-muted-foreground">
          <svg class="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
          </svg>
          No credit card required
        </div>
      </div>
    </section>
  `
})
export class PricingSectionComponent {}
