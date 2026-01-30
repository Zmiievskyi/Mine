import {
  Component,
  ChangeDetectionStrategy,
  signal,
  inject,
} from '@angular/core';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  lucideCreditCard,
  lucideServer,
  lucideActivity,
  lucideHeadset,
} from '@ng-icons/lucide';
import { ScrollRevealDirective } from '../../../shared/directives/scroll-reveal.directive';
import { HubspotFormModalComponent } from './hubspot-form-modal.component';
import { I18nService } from '../../../core/i18n';

/**
 * Hero section component for landing page
 *
 * Features-5 template adaptation with:
 * - Two-column layout (text left, visual right)
 * - Animated badge
 * - Feature list with icons
 * - GPU mining illustration
 * - i18n support
 */
@Component({
  selector: 'app-hero-section',
  standalone: true,
  imports: [ScrollRevealDirective, HubspotFormModalComponent, NgIconComponent],
  providers: [
    provideIcons({
      lucideCreditCard,
      lucideServer,
      lucideActivity,
      lucideHeadset,
    }),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section id="home" class="py-16 md:py-32">
      <div class="mx-auto max-w-xl md:max-w-6xl px-6">
        <div
          class="grid items-center gap-12 md:grid-cols-2 md:gap-12 lg:grid-cols-5 lg:gap-24"
        >
          <!-- Left Column: Text Content -->
          <div appScrollReveal class="lg:col-span-2">
            <div class="md:pr-6 lg:pr-0">
              <!-- Animated Badge -->
              <button
                class="group relative grid overflow-hidden rounded-full px-4 py-1 shadow-[0_1000px_0_0_hsl(0_0%_20%)_inset] transition-colors duration-200 mb-6"
              >
                <span class="badge-spark"></span>
                <span class="badge-backdrop"></span>
                <span
                  class="relative z-10 py-0.5 text-sm text-neutral-100 flex items-center justify-center gap-1"
                >
                  <span>✨</span>
                  {{ t().hero.badge }}
                  <svg
                    class="w-4 h-4 ml-1 transition-transform duration-300 ease-in-out group-hover:translate-x-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M9 5l7 7-7 7"
                    ></path>
                  </svg>
                </span>
              </button>

              <!-- Heading -->
              <h1
                class="text-4xl font-semibold lg:text-5xl leading-[1.1] mb-6"
              >
                {{ t().hero.title }}
                <span
                  class="bg-gradient-to-r from-[#FF4C00] to-[#FF7A45] bg-clip-text text-transparent"
                >
                  {{ t().hero.titleHighlight }}
                </span>
              </h1>

              <!-- Subtitle -->
              <p class="text-muted-foreground text-lg">
                {{ t().hero.subtitle }}
              </p>
            </div>

            <!-- Feature List -->
            <ul
              appScrollReveal
              [revealDelay]="100"
              class="mt-8 divide-y divide-border/50 border-y border-border/50 *:flex *:items-center *:gap-3 *:py-3"
            >
              <li>
                <ng-icon
                  name="lucideCreditCard"
                  class="text-[#FF4C00]"
                  size="20"
                />
                {{ t().hero.features.fiat }}
              </li>
              <li>
                <ng-icon
                  name="lucideServer"
                  class="text-[#FF4C00]"
                  size="20"
                />
                {{ t().hero.features.enterprise }}
              </li>
              <li>
                <ng-icon
                  name="lucideActivity"
                  class="text-[#FF4C00]"
                  size="20"
                />
                {{ t().hero.features.monitoring }}
              </li>
              <li>
                <ng-icon
                  name="lucideHeadset"
                  class="text-[#FF4C00]"
                  size="20"
                />
                {{ t().hero.features.support }}
              </li>
            </ul>

            <!-- CTA Button -->
            <div appScrollReveal [revealDelay]="200" class="mt-8">
              <button
                type="button"
                class="inline-flex items-center gap-2 px-8 py-4 bg-[#FF4C00] hover:bg-[#e64500] text-white font-semibold text-lg rounded-lg transition-colors duration-200 shadow-lg shadow-[#FF4C00]/25"
                (click)="openModal()"
              >
                {{ t().hero.cta }}
                <svg
                  class="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                  />
                </svg>
              </button>
            </div>
          </div>

          <!-- Right Column: Visual -->
          <div
            appScrollReveal
            [revealDelay]="150"
            class="relative rounded-3xl border border-border/50 p-3 lg:col-span-3"
          >
            <div
              class="aspect-[76/59] relative rounded-2xl bg-gradient-to-b from-zinc-700 to-transparent p-px"
            >
              <!-- GPU Mining Illustration -->
              <div
                class="absolute inset-0 rounded-[15px] bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 flex items-center justify-center overflow-hidden"
              >
                <!-- Animated Grid Background -->
                <div
                  class="absolute inset-0 opacity-20"
                  style="
                    background-image: linear-gradient(
                        90deg,
                        rgba(255, 76, 0, 0.3) 1px,
                        transparent 1px
                      ),
                      linear-gradient(
                        180deg,
                        rgba(255, 76, 0, 0.3) 1px,
                        transparent 1px
                      );
                    background-size: 32px 32px;
                  "
                ></div>

                <!-- GPU Card Illustration -->
                <div class="relative z-10 flex flex-col items-center gap-6 p-8">
                  <!-- GPU Icon -->
                  <div
                    class="w-24 h-24 md:w-32 md:h-32 rounded-2xl bg-gradient-to-br from-[#FF4C00] to-[#FF7A45] flex items-center justify-center shadow-2xl shadow-[#FF4C00]/30"
                  >
                    <svg
                      class="w-12 h-12 md:w-16 md:h-16 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="1.5"
                        d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
                      />
                    </svg>
                  </div>

                  <!-- Stats Cards -->
                  <div class="flex gap-4 flex-wrap justify-center">
                    <div
                      class="px-4 py-2 rounded-lg bg-zinc-800/80 border border-zinc-700/50 text-center"
                    >
                      <div class="text-xs text-zinc-400">GPUs</div>
                      <div class="text-lg font-semibold text-white">
                        A100 • H100
                      </div>
                    </div>
                    <div
                      class="px-4 py-2 rounded-lg bg-zinc-800/80 border border-zinc-700/50 text-center"
                    >
                      <div class="text-xs text-zinc-400">Token</div>
                      <div
                        class="text-lg font-semibold bg-gradient-to-r from-[#FF4C00] to-[#FF7A45] bg-clip-text text-transparent"
                      >
                        GNK
                      </div>
                    </div>
                  </div>

                  <!-- Mining Animation Dots -->
                  <div class="flex gap-2">
                    <span
                      class="w-2 h-2 rounded-full bg-[#FF4C00] animate-pulse"
                    ></span>
                    <span
                      class="w-2 h-2 rounded-full bg-[#FF4C00] animate-pulse"
                      style="animation-delay: 0.2s"
                    ></span>
                    <span
                      class="w-2 h-2 rounded-full bg-[#FF4C00] animate-pulse"
                      style="animation-delay: 0.4s"
                    ></span>
                  </div>
                </div>
              </div>
            </div>
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
  private readonly i18n = inject(I18nService);

  protected readonly t = this.i18n.t;
  protected readonly isModalOpen = signal(false);

  protected openModal(): void {
    this.isModalOpen.set(true);
  }

  protected closeModal(): void {
    this.isModalOpen.set(false);
  }

  protected onFormSubmitted(): void {
    setTimeout(() => this.closeModal(), 3000);
  }
}
