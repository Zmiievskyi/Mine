'use client';

import { ReactNode } from 'react';
import { HubspotProvider, useHubspot } from '@/lib/contexts/HubspotContext';
import { HubspotModal } from '@/components/ui/HubspotModal';

function HubspotModalInstance() {
  const { isModalOpen, closeModal, selectedGpuType } = useHubspot();
  return (
    <HubspotModal
      isOpen={isModalOpen}
      onClose={closeModal}
      gpuType={selectedGpuType}
    />
  );
}

interface LandingPageClientProps {
  children: ReactNode;
}

/**
 * Client wrapper that provides HubspotContext to interactive components.
 * Only components that need openModal() should be inside this wrapper.
 * Static display sections are Server Components rendered outside this wrapper.
 */
export function LandingPageClient({ children }: LandingPageClientProps) {
  return (
    <HubspotProvider>
      {children}
      <HubspotModalInstance />
    </HubspotProvider>
  );
}
