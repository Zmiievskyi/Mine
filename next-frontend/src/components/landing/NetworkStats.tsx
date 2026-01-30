'use client';

import { useTranslations } from 'next-intl';
import { ScrollReveal } from '@/components/ui/ScrollReveal';

// Hardcoded static stats for display
const stats = {
  networkStatus: 'live' as const,
  currentEpoch: '12,847',
  totalGpus: '~8.5K',
  participants: '1,200+',
  healthyParticipants: '1,150+',
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
  const t = useTranslations('stats');

  return (
    <section id="stats" className="py-16 md:py-24">
      <div className="mx-auto w-full max-w-screen-xl px-4 md:px-12 lg:px-20">
        <ScrollReveal>
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-4">
            {t('title')}
          </h2>
        </ScrollReveal>
        <ScrollReveal delay={100}>
          <p className="text-muted-foreground text-center mb-12">
            {t('subtitle')}
          </p>
        </ScrollReveal>

        {/* 4 key metrics in a single row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
          {/* Network Status */}
          <ScrollReveal delay={0}>
            <div className="relative rounded-xl border border-border bg-card/50 backdrop-blur-sm p-5 hover:z-10">
              <StatLabel
                label={t('networkStatus.label')}
                tooltip={t('networkStatus.tooltip')}
                groupName="status"
              />
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-semibold bg-green-500/20 text-green-400 border border-green-500/30">
                  <span className="w-2 h-2 rounded-full animate-pulse bg-green-400" />
                  {t('networkStatus.live')}
                </span>
              </div>
            </div>
          </ScrollReveal>

          {/* Current Epoch */}
          <ScrollReveal delay={50}>
            <div className="relative rounded-xl border border-border bg-card/50 backdrop-blur-sm p-5 hover:z-10">
              <StatLabel
                label={t('currentEpoch.label')}
                tooltip={t('currentEpoch.tooltip')}
                groupName="epoch"
              />
              <div className="text-2xl font-bold text-accent">
                #{stats.currentEpoch}
              </div>
            </div>
          </ScrollReveal>

          {/* Total GPUs */}
          <ScrollReveal delay={100}>
            <div className="relative rounded-xl border border-border bg-card/50 backdrop-blur-sm p-5 hover:z-10">
              <StatLabel
                label={t('totalGpus.label')}
                tooltip={t('totalGpus.tooltip')}
                groupName="gpus"
              />
              <div className="text-2xl font-bold text-foreground">
                {stats.totalGpus}
              </div>
            </div>
          </ScrollReveal>

          {/* Participants */}
          <ScrollReveal delay={150}>
            <div className="relative rounded-xl border border-border bg-card/50 backdrop-blur-sm p-5 hover:z-10">
              <StatLabel
                label={t('participants.label')}
                tooltip={t('participants.tooltip')}
                groupName="participants"
              />
              <div className="text-2xl font-bold text-foreground">
                {stats.participants}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                <span className="text-green-500">{stats.healthyParticipants}</span>{' '}
                {t('participants.healthy')}
              </div>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
