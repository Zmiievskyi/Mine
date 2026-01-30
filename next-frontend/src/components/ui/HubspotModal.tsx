'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import {
  HUBSPOT_CONFIG,
  loadHubSpotScript,
  setGpuFieldValue,
  getHubSpotGpuValue,
  addGpuToUrlParams,
  removeGpuFromUrlParams,
  HubSpotLoadError,
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
  const t = useTranslations('modal');
  const formContainerRef = useRef<HTMLDivElement>(null);
  const [formLoaded, setFormLoaded] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const originalUrlRef = useRef<string | null>(null);

  const handleAddUrlParams = useCallback(() => {
    originalUrlRef.current = addGpuToUrlParams(gpuType || null);
  }, [gpuType]);

  const handleRemoveUrlParams = useCallback(() => {
    removeGpuFromUrlParams(originalUrlRef.current);
    originalUrlRef.current = null;
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const handleRetry = useCallback(() => {
    setError(null);
    setScriptLoaded(false);
  }, []);

  const loadScript = useCallback(async (): Promise<boolean> => {
    try {
      await loadHubSpotScript();
      setScriptLoaded(true);
      return true;
    } catch (err) {
      const message = err instanceof HubSpotLoadError
        ? err.message
        : 'Failed to load form. Please try again.';
      setError(message);
      setIsLoading(false);
      return false;
    }
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

  // Reset error when modal opens
  useEffect(() => {
    if (isOpen && error) {
      const timer = setTimeout(clearError, 0);
      return () => clearTimeout(timer);
    }
  }, [isOpen, error, clearError]);

  // Main form loading effect
  useEffect(() => {
    if (!isOpen) {
      handleRemoveUrlParams();
      return;
    }

    handleAddUrlParams();
    const container = formContainerRef.current;
    if (!container) return;

    container.innerHTML = '';

    let cancelled = false;

    // Reset and load in the next tick to avoid synchronous setState in effect
    const initTimer = setTimeout(() => {
      if (cancelled) return;
      setFormLoaded(false);
      setIsLoading(true);
    }, 0);

    const loadForm = async () => {
      if (!scriptLoaded) {
        const success = await loadScript();
        if (!success || cancelled) return;
      }
      if (!cancelled) {
        createForm(container);
        setIsLoading(false);
      }
    };

    const loadTimer = setTimeout(loadForm, 50);
    return () => {
      cancelled = true;
      clearTimeout(initTimer);
      clearTimeout(loadTimer);
    };
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
      role="dialog"
      aria-modal="true"
      aria-labelledby="hubspot-modal-title"
    >
      <div
        className="relative w-full max-w-2xl bg-card rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card">
          <div>
            <h2 id="hubspot-modal-title" className="text-xl font-semibold text-foreground">
              {t('title')}
            </h2>
            {gpuType && (
              <p className="text-sm text-muted-foreground mt-0.5">{t('selected')} {gpuType}</p>
            )}
          </div>
          <button
            type="button"
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
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
          <div aria-live="polite" aria-atomic="true">
            {isLoading && !formLoaded && !error && (
              <div className="flex items-center justify-center py-12">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm text-gray-600">Loading form...</p>
                </div>
              </div>
            )}
            {error && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-red-600 mb-4">{error}</p>
                <button
                  type="button"
                  className="px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded-lg transition-colors"
                  onClick={handleRetry}
                >
                  Try Again
                </button>
              </div>
            )}
          </div>
          <div
            ref={formContainerRef}
            className={`hubspot-form-container ${isLoading || error ? 'hidden' : ''}`}
          />
        </div>
      </div>
    </div>
  );
}
