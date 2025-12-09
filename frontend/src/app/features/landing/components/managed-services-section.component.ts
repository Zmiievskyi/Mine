import { Component } from '@angular/core';
import { ScrollRevealDirective } from '../../../shared/directives/scroll-reveal.directive';

/**
 * Managed services section component for landing page
 *
 * Displays the infrastructure services Gcore handles:
 * - Software deployment
 * - Storage setup (RAID/disks)
 * - Model deployment
 * - Cluster management
 * - Cluster & GPU monitoring
 * - Updates & patches
 */
@Component({
  selector: 'app-managed-services-section',
  standalone: true,
  imports: [ScrollRevealDirective],
  template: `
    <section id="managed" class="py-16 md:py-24">
      <div class="mx-auto w-full max-w-screen-xl px-4 md:px-12 lg:px-20">
        <!-- Section Header -->
        <div appScrollReveal class="text-center mb-12">
          <span class="inline-flex items-center justify-center rounded-full border border-[#FF4C00]/50 bg-transparent px-4 py-1.5 text-sm font-medium text-white mb-4">
            Fully Managed
          </span>
          <h2 class="text-2xl md:text-3xl font-bold mb-4">We handle the technical complexity</h2>
          <p class="text-muted-foreground max-w-2xl mx-auto">
            Focus on earning while we manage the infrastructure. Our team takes care of everything from setup to maintenance.
          </p>
        </div>

        <!-- Services Grid -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          <!-- Software Deployment -->
          <div appScrollReveal [revealDelay]="0" class="rounded-xl border border-border bg-card/30 p-5 hover:bg-card/50 transition-colors">
            <div class="w-10 h-10 rounded-lg bg-[#FF4C00]/10 flex items-center justify-center mb-3">
              <svg class="w-5 h-5 text-[#FF4C00]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path>
              </svg>
            </div>
            <h3 class="text-sm font-semibold text-foreground mb-1">Software Deployment</h3>
            <p class="text-xs text-muted-foreground">Gonka software installed and configured</p>
          </div>

          <!-- Storage Setup -->
          <div appScrollReveal [revealDelay]="50" class="rounded-xl border border-border bg-card/30 p-5 hover:bg-card/50 transition-colors">
            <div class="w-10 h-10 rounded-lg bg-[#FF4C00]/10 flex items-center justify-center mb-3">
              <svg class="w-5 h-5 text-[#FF4C00]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"></path>
              </svg>
            </div>
            <h3 class="text-sm font-semibold text-foreground mb-1">Storage Setup</h3>
            <p class="text-xs text-muted-foreground">RAID arrays for databases and AI models</p>
          </div>

          <!-- Model Deployment -->
          <div appScrollReveal [revealDelay]="100" class="rounded-xl border border-border bg-card/30 p-5 hover:bg-card/50 transition-colors">
            <div class="w-10 h-10 rounded-lg bg-[#FF4C00]/10 flex items-center justify-center mb-3">
              <svg class="w-5 h-5 text-[#FF4C00]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
              </svg>
            </div>
            <h3 class="text-sm font-semibold text-foreground mb-1">Model Deployment</h3>
            <p class="text-xs text-muted-foreground">AI models deployed and updated automatically</p>
          </div>

          <!-- Cluster Management -->
          <div appScrollReveal [revealDelay]="150" class="rounded-xl border border-border bg-card/30 p-5 hover:bg-card/50 transition-colors">
            <div class="w-10 h-10 rounded-lg bg-[#FF4C00]/10 flex items-center justify-center mb-3">
              <svg class="w-5 h-5 text-[#FF4C00]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path>
              </svg>
            </div>
            <h3 class="text-sm font-semibold text-foreground mb-1">Cluster Management</h3>
            <p class="text-xs text-muted-foreground">Nodes connected and debugged</p>
          </div>

          <!-- Cluster Monitoring -->
          <div appScrollReveal [revealDelay]="200" class="rounded-xl border border-border bg-card/30 p-5 hover:bg-card/50 transition-colors">
            <div class="w-10 h-10 rounded-lg bg-[#FF4C00]/10 flex items-center justify-center mb-3">
              <svg class="w-5 h-5 text-[#FF4C00]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
              </svg>
            </div>
            <h3 class="text-sm font-semibold text-foreground mb-1">Cluster Monitoring</h3>
            <p class="text-xs text-muted-foreground">24/7 health tracking and alerts</p>
          </div>

          <!-- GPU Monitoring -->
          <div appScrollReveal [revealDelay]="250" class="rounded-xl border border-border bg-card/30 p-5 hover:bg-card/50 transition-colors">
            <div class="w-10 h-10 rounded-lg bg-[#FF4C00]/10 flex items-center justify-center mb-3">
              <svg class="w-5 h-5 text-[#FF4C00]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"></path>
              </svg>
            </div>
            <h3 class="text-sm font-semibold text-foreground mb-1">GPU Monitoring</h3>
            <p class="text-xs text-muted-foreground">Real-time GPU status and performance</p>
          </div>

          <!-- Updates & Patches -->
          <div appScrollReveal [revealDelay]="300" class="rounded-xl border border-border bg-card/30 p-5 hover:bg-card/50 transition-colors col-span-2">
            <div class="w-10 h-10 rounded-lg bg-[#FF4C00]/10 flex items-center justify-center mb-3">
              <svg class="w-5 h-5 text-[#FF4C00]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
              </svg>
            </div>
            <h3 class="text-sm font-semibold text-foreground mb-1">Updates & Patches</h3>
            <p class="text-xs text-muted-foreground">New Gonka versions, patches, and hotfixes applied automatically</p>
          </div>
        </div>
      </div>
    </section>
  `
})
export class ManagedServicesSectionComponent {}
