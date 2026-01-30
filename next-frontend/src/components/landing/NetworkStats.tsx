'use client';

import { ScrollReveal } from '@/components/ui/ScrollReveal';

// Hardcoded static stats for display
const stats = {
  networkStatus: 'live' as const,
  currentEpoch: '12,847',
  participants: '1,200+',
  healthyParticipants: '1,150+',
  totalGpus: '~8.5K',
  activeModels: '15+',
  countdown: '~4h remaining',
};

interface TooltipProps {
  label: string;
  tooltip: string;
  groupName: string;
}

function StatLabel({ label, tooltip, groupName }: TooltipProps) {
  return (
    <div
      className={`text-sm text-muted-foreground mb-2 relative group/${groupName} inline-block cursor-help`}
    >
      <span className="border-b border-dashed border-muted-foreground/50">
        {label}
      </span>
      <div
        className={`absolute left-0 top-full mt-2 w-64 p-3 bg-[#0f172a]/95 text-white text-xs rounded-xl shadow-xl border border-white/10 opacity-0 invisible group-hover/${groupName}:opacity-100 group-hover/${groupName}:visible transition-all duration-200 z-50 pointer-events-none leading-relaxed`}
      >
        {tooltip}
        <div className="absolute -top-1.5 left-4 w-3 h-3 bg-[#0f172a]/95 border-l border-t border-white/10 rotate-45" />
      </div>
    </div>
  );
}

export function NetworkStats() {
  return (
    <section id="stats" className="py-16 md:py-24">
      <div className="mx-auto w-full max-w-screen-xl px-4 md:px-12 lg:px-20">
        <ScrollReveal>
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-4">
            Gonka Network Stats
          </h2>
        </ScrollReveal>
        <ScrollReveal delay={100}>
          <p className="text-muted-foreground text-center mb-12">
            Network overview
          </p>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {/* Network Status */}
          <ScrollReveal delay={0}>
            <div className="relative rounded-xl border border-border bg-card/50 backdrop-blur-sm p-5 hover:z-10">
              <StatLabel
                label="Network Status"
                tooltip="Live / Syncing / Stale based on public network signals."
                groupName="status"
              />
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-semibold bg-green-500/20 text-green-400 border border-green-500/30">
                  <span className="w-2 h-2 rounded-full animate-pulse bg-green-400" />
                  Live
                </span>
              </div>
              <div className="text-sm text-muted-foreground mt-2">Active</div>
            </div>
          </ScrollReveal>

          {/* Current Epoch */}
          <ScrollReveal delay={50}>
            <div className="relative rounded-xl border border-border bg-card/50 backdrop-blur-sm p-5 hover:z-10">
              <StatLabel
                label="Current Epoch"
                tooltip="Current network epoch (active participation/accounting window)."
                groupName="epoch"
              />
              <div className="text-2xl font-bold text-[#FF4C00]">
                #{stats.currentEpoch}
              </div>
              <div className="text-sm text-muted-foreground mt-2">
                Mining epoch
              </div>
            </div>
          </ScrollReveal>

          {/* Participants */}
          <ScrollReveal delay={100}>
            <div className="relative rounded-xl border border-border bg-card/50 backdrop-blur-sm p-5 hover:z-10">
              <StatLabel
                label="Participants"
                tooltip="Total number of nodes participating in the network."
                groupName="participants"
              />
              <div className="text-2xl font-bold text-foreground">
                {stats.participants}
              </div>
              <div className="text-sm text-muted-foreground mt-2">
                <span className="text-green-500">{stats.healthyParticipants}</span>{' '}
                healthy
              </div>
            </div>
          </ScrollReveal>

          {/* Total GPUs */}
          <ScrollReveal delay={150}>
            <div className="relative rounded-xl border border-border bg-card/50 backdrop-blur-sm p-5 hover:z-10">
              <StatLabel
                label="Total GPUs"
                tooltip="Total GPUs in the network providing AI inference capacity."
                groupName="gpus"
              />
              <div className="text-2xl font-bold text-foreground">
                {stats.totalGpus}
              </div>
              <div className="text-sm text-muted-foreground mt-2">
                Compute nodes
              </div>
            </div>
          </ScrollReveal>

          {/* Active Models */}
          <ScrollReveal delay={200}>
            <div className="relative rounded-xl border border-border bg-card/50 backdrop-blur-sm p-5 hover:z-10">
              <StatLabel
                label="Active Models"
                tooltip="AI models currently being served by the network."
                groupName="models"
              />
              <div className="text-2xl font-bold text-foreground">
                {stats.activeModels}
              </div>
              <div className="text-sm text-muted-foreground mt-2">AI models</div>
            </div>
          </ScrollReveal>

          {/* Epoch Countdown */}
          <ScrollReveal delay={250}>
            <div className="relative rounded-xl border border-[#FF4C00]/50 bg-card/50 backdrop-blur-sm p-5 hover:z-10">
              <StatLabel
                label="Next Epoch"
                tooltip="Rewards are distributed at epoch boundaries."
                groupName="nextepoch"
              />
              <div className="text-2xl font-bold text-[#FF4C00]">
                {stats.countdown}
              </div>
              <div className="text-sm text-muted-foreground mt-2">
                Epoch cycle
              </div>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
