'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';

// HubSpot embed configuration
const HUBSPOT_CONFIG = {
  portalId: '4202168',
  formId: '0d64ead5-78c5-4ccb-84e3-3c088a10b212',
  region: 'eu1',
};

const FORM_LOAD_TIMEOUT_MS = 10000; // 10 seconds timeout for form loading

type LoadState = 'loading' | 'ready' | 'error';

interface HubspotModalProps {
  isOpen: boolean;
  onClose: () => void;
  gpuType?: string | null;
}

export function HubspotModal({
  isOpen,
  onClose,
  gpuType,
}: HubspotModalProps) {
  const t = useTranslations('modal');
  const formContainerRef = useRef<HTMLDivElement>(null);
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const scriptLoadedRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const observerRef = useRef<MutationObserver | null>(null);

  // Cleanup function for timeout and observer
  const cleanup = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }
  }, []);

  // Setup MutationObserver to detect when form loads
  const setupFormObserver = useCallback(() => {
    if (!formContainerRef.current || observerRef.current) return;

    observerRef.current = new MutationObserver(() => {
      // Check if form elements have been added (HubSpot creates an iframe or form)
      const formElement = formContainerRef.current?.querySelector('form, iframe');
      if (formElement) {
        cleanup();
        setLoadState('ready');
      }
    });

    observerRef.current.observe(formContainerRef.current, {
      childList: true,
      subtree: true,
    });
  }, [cleanup]);

  const loadScript = useCallback(() => {
    // Check if script already exists
    const existingScript = document.querySelector(
      `script[src*="js-${HUBSPOT_CONFIG.region}.hsforms.net/forms/embed/${HUBSPOT_CONFIG.portalId}.js"]`
    );

    if (existingScript || scriptLoadedRef.current) {
      scriptLoadedRef.current = true;
      return;
    }

    const script = document.createElement('script');
    script.src = `https://js-${HUBSPOT_CONFIG.region}.hsforms.net/forms/embed/${HUBSPOT_CONFIG.portalId}.js`;
    script.defer = true;
    script.onload = () => {
      scriptLoadedRef.current = true;
    };
    script.onerror = () => {
      cleanup();
      setLoadState('error');
    };
    document.head.appendChild(script);
  }, [cleanup]);

  // Retry loading the form
  const handleRetry = useCallback(() => {
    setLoadState('loading');

    // Setup timeout for retry
    timeoutRef.current = setTimeout(() => {
      setLoadState('error');
    }, FORM_LOAD_TIMEOUT_MS);

    // Setup observer
    setupFormObserver();

    // Try loading the script again if needed
    if (!scriptLoadedRef.current) {
      loadScript();
    }
  }, [loadScript, setupFormObserver]);

  // Load script and setup observer when modal opens
  useEffect(() => {
    if (!isOpen) return;

    setLoadState('loading');

    // Setup timeout for form loading
    timeoutRef.current = setTimeout(() => {
      setLoadState((current) => current === 'loading' ? 'error' : current);
    }, FORM_LOAD_TIMEOUT_MS);

    // Small delay to ensure the container is mounted
    const mountDelay = setTimeout(() => {
      setupFormObserver();
      loadScript();
    }, 50);

    return () => {
      clearTimeout(mountDelay);
      cleanup();
    };
  }, [isOpen, loadScript, setupFormObserver, cleanup]);

  // Handle Escape key to close modal
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="hubspot-modal-title"
    >
      <div
        className="relative w-full h-full md:h-auto md:max-h-[95vh] md:max-w-2xl md:m-4 bg-card md:rounded-2xl shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card shrink-0 md:rounded-t-2xl">
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
              aria-hidden="true"
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

        {/* Form Container - fullscreen on mobile, scrollable on desktop if needed */}
        <div className="flex-1 px-6 py-6 overflow-y-auto bg-white md:rounded-b-2xl">
          {loadState === 'loading' && (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-gray-600">{t('loading')}</p>
              </div>
            </div>
          )}
          {loadState === 'error' && (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                  <svg
                    aria-hidden="true"
                    className="w-6 h-6 text-red-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{t('error.title')}</p>
                  <p className="text-sm text-gray-600 mt-1">{t('error.description')}</p>
                </div>
                <button
                  type="button"
                  onClick={handleRetry}
                  className="px-4 py-2 text-sm font-medium text-white bg-accent hover:bg-accent/90 rounded-lg transition-colors"
                >
                  {t('error.retry')}
                </button>
              </div>
            </div>
          )}
          <div
            ref={formContainerRef}
            className={`hubspot-form-container min-h-[200px] ${loadState !== 'ready' ? 'opacity-0 h-0 overflow-hidden' : ''}`}
          >
            {/* HubSpot declarative form embed */}
            <div
              className="hs-form-frame"
              data-region={HUBSPOT_CONFIG.region}
              data-form-id={HUBSPOT_CONFIG.formId}
              data-portal-id={HUBSPOT_CONFIG.portalId}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
