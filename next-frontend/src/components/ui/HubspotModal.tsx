'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import {
  HUBSPOT_CONFIG,
  loadHubSpotScript,
  setGpuFieldValue,
  getHubSpotGpuValue,
  addGpuToUrlParams,
  removeGpuFromUrlParams,
  type JQueryForm,
} from '@/lib/hubspot';

interface HubspotModalProps {
  isOpen: boolean;
  onClose: () => void;
  gpuType?: string | null;
  onFormSubmitted?: () => void;
}

export function HubspotModal({
  isOpen,
  onClose,
  gpuType,
  onFormSubmitted,
}: HubspotModalProps) {
  const formContainerRef = useRef<HTMLDivElement>(null);
  const [formLoaded, setFormLoaded] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const originalUrlRef = useRef<string | null>(null);

  const handleAddUrlParams = useCallback(() => {
    originalUrlRef.current = addGpuToUrlParams(gpuType || null);
  }, [gpuType]);

  const handleRemoveUrlParams = useCallback(() => {
    removeGpuFromUrlParams(originalUrlRef.current);
    originalUrlRef.current = null;
  }, []);

  const loadScript = useCallback(async (): Promise<void> => {
    await loadHubSpotScript();
    setScriptLoaded(true);
  }, []);

  const createForm = useCallback(
    (container: HTMLElement) => {
      if (formLoaded || !window.hbspt?.forms) return;

      const containerId =
        'hubspot-form-' + Math.random().toString(36).substring(2, 9);
      container.id = containerId;

      const hubspotGpuValue = gpuType ? getHubSpotGpuValue(gpuType) : null;

      window.hbspt.forms.create({
        region: HUBSPOT_CONFIG.region,
        portalId: HUBSPOT_CONFIG.portalId,
        formId: HUBSPOT_CONFIG.formId,
        target: `#${containerId}`,
        onFormReady: ($form: JQueryForm) => {
          if (hubspotGpuValue) {
            setGpuFieldValue(container, $form, hubspotGpuValue);
          }
        },
        onFormSubmitted: () => {
          onFormSubmitted?.();
        },
      });

      setFormLoaded(true);
    },
    [formLoaded, gpuType, onFormSubmitted]
  );

  useEffect(() => {
    if (isOpen) {
      handleAddUrlParams();
      const container = formContainerRef.current;
      if (!container) return;

      container.innerHTML = '';
      setFormLoaded(false);

      const loadForm = async () => {
        if (!scriptLoaded) {
          await loadScript();
        }
        createForm(container);
      };

      const timer = setTimeout(loadForm, 50);
      return () => clearTimeout(timer);
    } else {
      handleRemoveUrlParams();
    }
  }, [
    isOpen,
    scriptLoaded,
    loadScript,
    createForm,
    handleAddUrlParams,
    handleRemoveUrlParams,
  ]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90"
      onClick={handleBackdropClick}
    >
      <div
        className="relative w-full max-w-2xl bg-[#18181b] rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700 bg-[#18181b]">
          <div>
            <h2 className="text-xl font-semibold text-white">Rent GPUs</h2>
            {gpuType && (
              <p className="text-sm text-zinc-400 mt-0.5">Selected: {gpuType}</p>
            )}
          </div>
          <button
            type="button"
            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
            onClick={onClose}
            aria-label="Close modal"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Form Container (white background for HubSpot form) */}
        <div className="px-6 py-6 max-h-[70vh] overflow-y-auto bg-white">
          <div ref={formContainerRef} className="hubspot-form-container" />
        </div>
      </div>
    </div>
  );
}
