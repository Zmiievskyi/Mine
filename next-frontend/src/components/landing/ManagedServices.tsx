'use client';

import { ScrollReveal } from '@/components/ui/ScrollReveal';
import {
  UploadIcon,
  DatabaseIcon,
  MonitorIcon,
  FilterIcon,
  ChartBarIcon,
  CpuIcon,
  RefreshIcon,
} from '@/components/icons';

const services = [
  {
    icon: UploadIcon,
    title: 'Software Deployment',
    description: 'Gonka software installed and configured',
  },
  {
    icon: DatabaseIcon,
    title: 'Storage Setup',
    description: 'RAID arrays for databases and AI models',
  },
  {
    icon: MonitorIcon,
    title: 'Model Deployment',
    description: 'AI models deployed and updated automatically',
  },
  {
    icon: FilterIcon,
    title: 'Cluster Management',
    description: 'Nodes connected and debugged',
  },
  {
    icon: ChartBarIcon,
    title: 'Cluster Monitoring',
    description: '24/7 health tracking and alerts',
  },
  {
    icon: CpuIcon,
    title: 'GPU Monitoring',
    description: 'Real-time GPU status and performance',
  },
  {
    icon: RefreshIcon,
    title: 'Updates & Patches',
    description: 'New Gonka versions, patches, and hotfixes applied automatically',
    isWide: true,
  },
];

export function ManagedServices() {
  return (
    <section id="managed" className="py-16 md:py-24">
      <div className="mx-auto w-full max-w-screen-xl px-4 md:px-12 lg:px-20">
        {/* Section Header */}
        <ScrollReveal>
          <div className="text-center mb-12">
            <span className="inline-flex items-center justify-center rounded-full border border-[#FF4C00]/50 bg-transparent px-4 py-1.5 text-sm font-medium text-white mb-4">
              Fully Managed
            </span>
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              We handle the technical complexity
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Focus on earning while we manage the infrastructure. Our team takes
              care of everything from setup to maintenance.
            </p>
          </div>
        </ScrollReveal>

        {/* Services Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {services.map((service, index) => (
            <ScrollReveal
              key={service.title}
              delay={index * 50}
              className={service.isWide ? 'col-span-2' : ''}
            >
              <div className="rounded-xl border border-border bg-card/30 p-5 hover:bg-card/50 transition-colors h-full">
                <div className="w-10 h-10 rounded-lg bg-[#FF4C00]/10 flex items-center justify-center mb-3">
                  <service.icon className="w-5 h-5 text-[#FF4C00]" />
                </div>
                <h3 className="text-sm font-semibold text-foreground mb-1">
                  {service.title}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {service.description}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
