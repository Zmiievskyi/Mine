import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { ScrollRevealDirective } from '../../../shared/directives/scroll-reveal.directive';
import { HubspotFormModalComponent } from './hubspot-form-modal.component';

/**
 * Hero section component for landing page
 *
 * Displays the main value proposition with:
 * - Animated badge
 * - Hero headline
 * - Subtitle
 * - Primary CTA button
 */
@Component({
  selector: 'app-hero-section',
  standalone: true,
  imports: [ScrollRevealDirective, HubspotFormModalComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section id="home" class="pt-24 pb-16 md:pt-32 md:pb-24">
      <div class="mx-auto w-full max-w-screen-xl px-4 md:px-12 lg:px-20">
        <div class="flex flex-col items-center text-center">
          <!-- Badge with animated border light (ball rolling in tube) -->
          <button appScrollReveal class="group relative grid overflow-hidden rounded-full px-4 py-1 shadow-[0_1000px_0_0_hsl(0_0%_20%)_inset] transition-colors duration-200 mb-8">
            <!-- Spark effect - rotating light -->
            <span class="badge-spark"></span>
            <!-- Backdrop - covers inside, leaves border visible -->
            <span class="badge-backdrop"></span>
            <!-- Inner content -->
            <span class="relative z-10 py-0.5 text-sm text-neutral-100 flex items-center justify-center gap-1">
              <span>✨</span>
              GPU Mining as a Service
              <svg class="w-4 h-4 ml-1 transition-transform duration-300 ease-in-out group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
              </svg>
            </span>
          </button>

          <!-- Heading -->
          <h1 appScrollReveal [revealDelay]="100" class="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-6">
            Rent GPUs to mine
            <span class="bg-gradient-to-r from-[#FF4C00] to-[#FF7A45] bg-clip-text text-transparent"> GNK</span>
          </h1>

          <!-- Subtitle -->
          <p appScrollReveal [revealDelay]="200" class="max-w-2xl text-lg md:text-xl text-muted-foreground mb-10">
            Rent enterprise-grade GPUs to mine cryptocurrency on our network.
            Pay in fiat currency and earn tokens that power the future of AI inference.
          </p>

          <!-- CTA Button -->
          <div appScrollReveal [revealDelay]="300">
            <button
              type="button"
              class="inline-flex items-center gap-2 px-8 py-4 bg-[#FF4C00] hover:bg-[#e64500] text-white font-semibold text-lg rounded-lg transition-colors duration-200 shadow-lg shadow-[#FF4C00]/25"
              (click)="openModal()"
            >
              Rent GPU
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- HubSpot Form Modal -->
    <app-hubspot-form-modal
      [isOpen]="isModalOpen()"
      (close)="closeModal()"
      (formSubmitted)="onFormSubmitted()"
    />
  `,
})
export class HeroSectionComponent {
  protected readonly isModalOpen = signal(false);

  protected openModal(): void {
    this.isModalOpen.set(true);
  }

  protected closeModal(): void {
    this.isModalOpen.set(false);
  }

  protected onFormSubmitted(): void {
    // Optionally close modal after a delay or show success message
    setTimeout(() => this.closeModal(), 3000);
  }
}
