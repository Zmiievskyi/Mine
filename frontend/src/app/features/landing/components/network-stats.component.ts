import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NetworkStats } from '../../../core/models/node.model';
import { ScrollRevealDirective } from '../../../shared/directives/scroll-reveal.directive';

/**
 * Network stats component for landing page
 *
 * Displays live Gonka network statistics:
 * - Current epoch and block number
 * - Active nodes (total, healthy, catching up)
 * - Registered AI models
 * - Time until next epoch
 *
 * Updates automatically via parent component
 */
@Component({
  selector: 'app-network-stats',
  standalone: true,
  imports: [CommonModule, ScrollRevealDirective],
  template: `
    <section id="stats" class="py-16 md:py-24">
      <div class="mx-auto w-full max-w-screen-xl px-4 md:px-12 lg:px-20">
        <h2 appScrollReveal class="text-2xl md:text-3xl font-bold text-center mb-4">Live Gonka Network Stats</h2>
        <p appScrollReveal [revealDelay]="100" class="text-muted-foreground text-center mb-12">
          Real-time network statistics
          @if (!loading() && stats()) {
            <span class="text-xs opacity-60">&bull; Updates every 60s</span>
          }
        </p>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <!-- Current Epoch -->
          <div appScrollReveal [revealDelay]="0" class="rounded-xl border border-border bg-card/50 backdrop-blur-sm p-6">
            <div class="text-sm text-muted-foreground mb-2">Current Epoch</div>
            @if (loading()) {
              <div class="text-3xl font-bold text-foreground animate-pulse">--</div>
              <div class="text-sm text-muted-foreground mt-2">Loading...</div>
            } @else if (stats()) {
              <div class="text-3xl font-bold text-[#FF4C00]">{{ stats()!.currentEpoch }}</div>
              <div class="text-sm text-muted-foreground mt-2">Block #{{ stats()!.currentBlock | number }}</div>
            } @else {
              <div class="text-3xl font-bold text-foreground">--</div>
              <div class="text-sm text-destructive mt-2">Unavailable</div>
            }
          </div>

          <!-- Active Participants -->
          <div appScrollReveal [revealDelay]="100" class="rounded-xl border border-border bg-card/50 backdrop-blur-sm p-6">
            <div class="text-sm text-muted-foreground mb-2">Network Nodes</div>
            @if (loading()) {
              <div class="text-3xl font-bold text-foreground animate-pulse">--</div>
              <div class="text-sm text-muted-foreground mt-2">Loading...</div>
            } @else if (stats()) {
              <div class="text-3xl font-bold text-foreground">{{ stats()!.totalParticipants }}</div>
              <div class="text-sm text-muted-foreground mt-2">
                <span class="text-green-500">{{ stats()!.healthyParticipants }} healthy</span>
                @if (stats()!.catchingUp > 0) {
                  <span class="opacity-60"> &bull; {{ stats()!.catchingUp }} catching up</span>
                }
              </div>
            } @else {
              <div class="text-3xl font-bold text-foreground">--</div>
              <div class="text-sm text-destructive mt-2">Unavailable</div>
            }
          </div>

          <!-- Registered Models -->
          <div appScrollReveal [revealDelay]="200" class="rounded-xl border border-border bg-card/50 backdrop-blur-sm p-6">
            <div class="text-sm text-muted-foreground mb-2">Active Models</div>
            @if (loading()) {
              <div class="text-3xl font-bold text-foreground animate-pulse">--</div>
              <div class="text-sm text-muted-foreground mt-2">Loading...</div>
            } @else if (stats()) {
              <div class="text-3xl font-bold text-foreground">{{ stats()!.registeredModels }}</div>
              <div class="text-sm text-muted-foreground mt-2">AI models running</div>
            } @else {
              <div class="text-3xl font-bold text-foreground">--</div>
              <div class="text-sm text-destructive mt-2">Unavailable</div>
            }
          </div>

          <!-- Time to Next Epoch -->
          <div appScrollReveal [revealDelay]="300" class="rounded-xl border border-[#FF4C00]/50 bg-card/50 backdrop-blur-sm p-6">
            <div class="text-sm text-muted-foreground mb-2">Next Epoch In</div>
            @if (loading()) {
              <div class="text-3xl font-bold text-foreground animate-pulse">--:--:--</div>
              <div class="text-sm text-muted-foreground mt-2">Loading...</div>
            } @else if (stats()) {
              <div class="text-3xl font-bold text-[#FF4C00]">
                {{ stats()!.timeToNextEpoch.hours }}h {{ stats()!.timeToNextEpoch.minutes }}m
              </div>
              <div class="text-sm text-muted-foreground mt-2">~{{ stats()!.avgBlockTime | number:'1.1-1' }}s per block</div>
            } @else {
              <div class="text-3xl font-bold text-foreground">--:--:--</div>
              <div class="text-sm text-destructive mt-2">Unavailable</div>
            }
          </div>
        </div>
      </div>
    </section>
  `
})
export class NetworkStatsComponent {
  stats = input<NetworkStats | null>(null);
  loading = input<boolean>(true);
}
