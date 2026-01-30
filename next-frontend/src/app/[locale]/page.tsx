import { GridBackground } from '@/components/ui/GridBackground';
import { LandingPageClient } from '@/components/landing/LandingPageClient';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground antialiased overflow-x-hidden">
      {/* Grid Pattern Background */}
      <GridBackground />

      {/* Client-side content with interactivity */}
      <LandingPageClient />
    </div>
  );
}
