'use client';

import { useCallback } from 'react';
import { HubspotProvider, useHubspot } from '@/lib/contexts/HubspotContext';
import { HubspotModal } from '@/components/ui/HubspotModal';
import { Header } from '@/components/landing/Header';
import { HeroSection } from '@/components/landing/HeroSection';
import { NetworkStats } from '@/components/landing/NetworkStats';
import { FeaturesSection } from '@/components/landing/FeaturesSection';
import { ForWho } from '@/components/landing/ForWho';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { ManagedServices } from '@/components/landing/ManagedServices';
import { PricingSection } from '@/components/landing/PricingSection';
import { FaqSection } from '@/components/landing/FaqSection';
import { Footer } from '@/components/landing/Footer';

function HubspotModalInstance() {
  const { isModalOpen, closeModal, selectedGpuType } = useHubspot();
  return (
    <HubspotModal
      isOpen={isModalOpen}
      onClose={closeModal}
      gpuType={selectedGpuType}
      onFormSubmitted={() => setTimeout(closeModal, 3000)}
    />
  );
}

export function LandingPageClient() {
  const scrollToSection = useCallback((sectionId: string) => {
    const element = document.querySelector(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  return (
    <HubspotProvider>
      <Header onSectionClick={scrollToSection} />

      <main className="relative z-10">
        <HeroSection />
        <NetworkStats />
        <FeaturesSection />
        <ForWho />
        <HowItWorks />
        <ManagedServices />
        <PricingSection />
        <FaqSection />
      </main>

      <Footer onSectionClick={scrollToSection} />

      <HubspotModalInstance />
    </HubspotProvider>
  );
}
