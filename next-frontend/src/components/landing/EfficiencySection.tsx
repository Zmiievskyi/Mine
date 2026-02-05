'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import { ScrollReveal } from '@/components/ui/ScrollReveal';
import {
  gpuEfficiencyData,
  type GpuEfficiency,
} from '@/data/efficiency';

/**
 * Animated counter component that counts up when visible.
 * Respects prefers-reduced-motion by showing the final value immediately.
 */
function AnimatedNumber({ value, decimals = 2 }: { value: number; decimals?: number }) {
  const [displayValue, setDisplayValue] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // If user prefers reduced motion, show final value immediately
    if (prefersReducedMotion) {
      setDisplayValue(value);
      hasAnimated.current = true;
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          const duration = 1500;
          const startTime = performance.now();

          const animate = (currentTime: number) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // Ease out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            setDisplayValue(value * eased);

            if (progress < 1) {
              animationFrameRef.current = requestAnimationFrame(animate);
            } else {
              animationFrameRef.current = null;
            }
          };
          animationFrameRef.current = requestAnimationFrame(animate);
        }
      },
      { threshold: 0.5 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      observer.disconnect();
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [value]);

  return (
    <span ref={ref} className="font-mono tabular-nums">
      {displayValue.toFixed(decimals)}
    </span>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="rounded-lg border border-border bg-card/30 p-4 animate-pulse"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="h-6 w-16 bg-muted rounded" />
              <div className="h-4 w-24 bg-muted/50 rounded" />
            </div>
            <div className="h-8 w-20 bg-muted rounded" />
          </div>
          <div className="h-2 rounded-full bg-muted/50" />
          <div className="mt-2 flex justify-between">
            <div className="h-3 w-24 bg-muted/30 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function EfficiencySection() {
  const t = useTranslations('efficiency');
  const [data, setData] = useState<GpuEfficiency[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [source, setSource] = useState<'live' | 'fallback'>('fallback');

  useEffect(() => {
    let mounted = true;

    async function fetchEfficiencyData() {
      try {
        const res = await fetch('/api/gpu-weights');
        if (!res.ok) throw new Error('Failed to fetch');

        const json = await res.json();
        if (mounted) {
          setData(json.data);
          setSource(json.source);
        }
      } catch {
        // Use fallback data
        if (mounted) {
          const sorted = [...gpuEfficiencyData].sort((a, b) => b.efficiency - a.efficiency);
          setData(sorted);
          setSource('fallback');
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    fetchEfficiencyData();

    return () => {
      mounted = false;
    };
  }, []);

  const maxEfficiency = data[0]?.efficiency ?? 1;
  const bestValueGpu = data[0]?.name;

  return (
    <section id="efficiency" className="py-16 md:py-24">
      <div className="mx-auto w-full max-w-screen-xl px-4 md:px-12 lg:px-20">
        {/* Section Header */}
        <ScrollReveal>
          <div className="text-center mb-12">
            <span className="inline-flex items-center justify-center rounded-full border border-accent/50 bg-transparent px-4 py-1.5 text-sm font-medium text-white mb-4">
              {t('badge')}
            </span>
            <h2 className="text-2xl md:text-3xl font-bold mb-4 font-heading">{t('title')}</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t('subtitle')}
            </p>
          </div>
        </ScrollReveal>

        {/* Efficiency Card */}
        <ScrollReveal delay={100}>
          <div className="rounded-xl border border-border bg-card/30 backdrop-blur-sm p-6 md:p-8 max-w-3xl mx-auto">
            {/* Formula - Code Block Style */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-foreground mb-4">
                {t('formulaTitle')}
              </h3>
              <div className="relative overflow-hidden rounded-lg bg-black/50 border border-accent/20 p-6">
                {/* Grid pattern overlay */}
                <div className="card-grid-pattern absolute inset-0 opacity-5" />

                <div className="relative flex flex-col items-center gap-4">
                  <div className="flex items-center gap-3 text-lg md:text-xl font-mono">
                    <span className="text-accent font-bold">{t('formulaEfficiency')}</span>
                    <span className="text-muted-foreground">=</span>
                    <div className="flex flex-col items-center">
                      <span className="text-foreground border-b border-accent/50 pb-1 px-3">
                        {t('formulaNumerator')}
                      </span>
                      <span className="text-muted-foreground pt-1 px-3 text-sm">
                        {t('formulaDenominator')}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground text-center">
                    {t('formulaHint')}
                  </p>
                </div>
              </div>
            </div>

            {/* Efficiency List */}
            {isLoading ? (
              <LoadingSkeleton />
            ) : (
              <div className="space-y-4">
                {data.map((gpu, index) => {
                  const barWidth = (gpu.efficiency / maxEfficiency) * 100;
                  const isBestValue = gpu.name === bestValueGpu;

                  return (
                    <ScrollReveal key={gpu.name} delay={200 + index * 75}>
                      <div
                        className={`group relative rounded-lg border p-4 transition-all duration-300 hover:-translate-y-0.5 ${
                          isBestValue
                            ? 'border-accent/50 bg-accent/5 shadow-[0_0_20px_rgba(255,76,0,0.15)]'
                            : 'border-border bg-card/30 hover:border-accent/30 hover:shadow-[0_0_15px_rgba(255,76,0,0.1)]'
                        }`}
                      >
                        {/* Best Value Badge */}
                        {isBestValue && (
                          <span className="absolute -top-2.5 right-4 px-3 py-0.5 text-xs font-bold text-black bg-accent rounded-full shadow-[0_0_10px_rgba(255,76,0,0.5)]">
                            {t('bestValue')}
                          </span>
                        )}

                        {/* GPU Info Row */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <span
                              className={`text-lg font-bold ${
                                isBestValue ? 'text-accent' : 'text-foreground'
                              }`}
                            >
                              {gpu.name}
                            </span>
                            <span className="text-sm text-muted-foreground font-mono">
                              {gpu.isEstimated ? '~' : ''}${gpu.pricePerHour.toFixed(2)}/GPU/hr
                              {gpu.isEstimated && <span className="text-xs ml-1">(est.)</span>}
                            </span>
                          </div>
                          <div className="text-right">
                            <span
                              className={`text-2xl font-bold ${
                                isBestValue ? 'text-accent' : 'text-foreground'
                              }`}
                            >
                              <AnimatedNumber value={gpu.efficiency} />
                            </span>
                          </div>
                        </div>

                        {/* Efficiency Bar */}
                        <div className="h-2 rounded-full bg-muted/50 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-1000 ease-out ${
                              isBestValue
                                ? 'bg-gradient-to-r from-accent via-accent-light to-accent'
                                : 'bg-gradient-to-r from-muted-foreground/60 to-muted-foreground/30'
                            }`}
                            style={{
                              width: `${barWidth}%`,
                              boxShadow: isBestValue ? '0 0 10px rgba(255,76,0,0.5)' : 'none'
                            }}
                          />
                        </div>

                        {/* Weight Info */}
                        <div className="mt-2 flex justify-between text-xs text-muted-foreground font-mono">
                          <span>
                            {t('weightLabel')}: {gpu.weight.toFixed(3)}
                          </span>
                          <span className="opacity-0 group-hover:opacity-100 transition-opacity">
                            {t('efficiencyUnit')}
                          </span>
                        </div>
                      </div>
                    </ScrollReveal>
                  );
                })}
              </div>
            )}

            {/* Disclaimer */}
            <p className="mt-6 text-xs text-muted-foreground text-center border-t border-border pt-4">
              {t('disclaimer')}
              {source === 'live' ? (
                <span className="ml-2 text-emerald-500">(Live data)</span>
              ) : (
                <span className="ml-2 text-amber-500" title="Using cached data - live data unavailable">
                  (Cached data)
                </span>
              )}
            </p>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
