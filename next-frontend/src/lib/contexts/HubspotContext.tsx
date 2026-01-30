'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface HubspotContextValue {
  isModalOpen: boolean;
  selectedGpuType: string | null;
  openModal: (gpuType?: string) => void;
  closeModal: () => void;
}

const HubspotContext = createContext<HubspotContextValue | undefined>(undefined);

export function HubspotProvider({ children }: { children: ReactNode }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedGpuType, setSelectedGpuType] = useState<string | null>(null);

  const openModal = useCallback((gpuType?: string) => {
    setSelectedGpuType(gpuType || null);
    setIsModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedGpuType(null);
  }, []);

  return (
    <HubspotContext.Provider
      value={{ isModalOpen, selectedGpuType, openModal, closeModal }}
    >
      {children}
    </HubspotContext.Provider>
  );
}

export function useHubspot(): HubspotContextValue {
  const context = useContext(HubspotContext);
  if (!context) {
    throw new Error('useHubspot must be used within a HubspotProvider');
  }
  return context;
}
