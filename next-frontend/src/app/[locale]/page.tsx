import { setRequestLocale } from 'next-intl/server';
import { GridBackground } from '@/components/ui/GridBackground';
import { LandingPageClient } from '@/components/landing/LandingPageClient';
import { Header } from '@/components/landing/Header';
import { HeroSection } from '@/components/landing/HeroSection';
import { ForWho } from '@/components/landing/ForWho';
import { ServiceAddon } from '@/components/landing/ServiceAddon';
import { PricingSection } from '@/components/landing/PricingSection';
import { EfficiencySection } from '@/components/landing/EfficiencySection';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { ManagedServices } from '@/components/landing/ManagedServices';
import { FaqSection } from '@/components/landing/FaqSection';
import { Footer } from '@/components/landing/Footer';

interface PageProps {
  params: Promise<{ locale: string }>;
}

/**
 * Landing page with optimized Server/Client component split:
 * - Server Components: FeaturesSection, ForWho, ServiceAddon, ManagedServices, FaqSection, Footer
 * - Client Components: Header, HeroSection, PricingSection, EfficiencySection, HowItWorks
 *   (these need HubspotContext for openModal() or client-side interactivity)
 */
export default async function LandingPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="min-h-screen bg-background text-foreground antialiased overflow-x-hidden">
      {/* Grid Pattern Background */}
      <GridBackground />

      {/* Client wrapper for components needing HubspotContext */}
      <LandingPageClient>
        <Header />
        <main className="relative z-10">
          <HeroSection />
          <ForWho />
          <ServiceAddon />
          <PricingSection />
          <EfficiencySection />
          <HowItWorks />
          <ManagedServices />
          <FaqSection />
        </main>
      </LandingPageClient>

      {/* Footer as Server Component (no HubspotContext needed) */}
      <Footer />
    </div>
  );
}
