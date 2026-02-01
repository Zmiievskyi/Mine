'use client';

import { Suspense, useEffect, useRef, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { Link } from '@/i18n/navigation';

// HubSpot embed configuration
const HUBSPOT_CONFIG = {
  portalId: '4202168',
  formId: '0d64ead5-78c5-4ccb-84e3-3c088a10b212',
  region: 'eu1',
};

const FORM_LOAD_TIMEOUT_MS = 10000;

type LoadState = 'idle' | 'loading' | 'ready' | 'error';

/**
 * Maps GPU type string to HubSpot-compatible format
 */
function getHubSpotGpuValue(gpuType: string): string | null {
  const validIds = ['A100', 'H100', 'H200', 'B200'];
  const upperType = gpuType.toUpperCase();

  for (const id of validIds) {
    if (upperType.includes(id)) {
      return `8 x ${id}`;
    }
  }
  return null;
}

/**
 * Adds GPU configuration to URL parameters for HubSpot form pre-fill
 */
function addGpuToUrlParams(gpuType: string | null): void {
  const gpuValue = gpuType ? getHubSpotGpuValue(gpuType) : null;
  if (!gpuValue) return;

  const url = new URL(window.location.href);
  url.searchParams.set('form_gonka_preffered_configuration', gpuValue);
  url.searchParams.set('form_gonka_servers_number', '1');
  window.history.replaceState({}, '', url.toString());
}

function RequestGpuForm() {
  const t = useTranslations('requestGpu');
  const searchParams = useSearchParams();
  const gpuType = searchParams.get('gpu');

  const formContainerRef = useRef<HTMLDivElement>(null);
  const [loadState, setLoadState] = useState<LoadState>('idle');
  const scriptLoadedRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const observerRef = useRef<MutationObserver | null>(null);
  const isMountedRef = useRef(true);

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
      const formElement = formContainerRef.current?.querySelector('form, iframe');
      if (formElement && isMountedRef.current) {
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
    const existingScript = document.querySelector(
      `script[src*="js-${HUBSPOT_CONFIG.region}.hsforms.net/forms/embed/${HUBSPOT_CONFIG.portalId}.js"]`
    );

    // If script already loaded and HubSpotForms is ready, trigger a rescan
    if (existingScript || scriptLoadedRef.current) {
      scriptLoadedRef.current = true;
      // Script tag exists but HubSpotForms may not be ready yet - poll for it
      if (window.HubSpotForms) {
        window.HubSpotForms.reload();
      } else {
        // Poll for HubSpotForms to become available (handles race condition on client-side nav)
        let pollAttempts = 0;
        const maxAttempts = 50; // 5 seconds max
        const pollInterval = setInterval(() => {
          pollAttempts++;
          if (window.HubSpotForms) {
            clearInterval(pollInterval);
            window.HubSpotForms.reload();
          } else if (pollAttempts >= maxAttempts) {
            clearInterval(pollInterval);
            if (isMountedRef.current) {
              setLoadState('error');
            }
          }
        }, 100);
      }
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
      if (isMountedRef.current) {
        setLoadState('error');
      }
    };
    document.head.appendChild(script);
  }, [cleanup]);

  // Recreate form
  const recreateForm = useCallback(() => {
    if (!formContainerRef.current) return;

    const formFrame = formContainerRef.current.querySelector('.hs-form-frame');
    if (formFrame) {
      formFrame.remove();
    }

    const newFrame = document.createElement('div');
    newFrame.className = 'hs-form-frame';
    newFrame.setAttribute('data-region', HUBSPOT_CONFIG.region);
    newFrame.setAttribute('data-form-id', HUBSPOT_CONFIG.formId);
    newFrame.setAttribute('data-portal-id', HUBSPOT_CONFIG.portalId);
    formContainerRef.current.appendChild(newFrame);

    if (scriptLoadedRef.current && window.HubSpotForms) {
      window.HubSpotForms.reload();
    }
  }, []);

  const handleRetry = useCallback(() => {
    setLoadState('loading');

    timeoutRef.current = setTimeout(() => {
      setLoadState('error');
    }, FORM_LOAD_TIMEOUT_MS);

    setupFormObserver();

    if (!scriptLoadedRef.current) {
      loadScript();
    } else {
      recreateForm();
    }
  }, [loadScript, setupFormObserver, recreateForm]);

  // Handle form loading on mount
  useEffect(() => {
    // Add GPU to URL params for pre-fill
    if (gpuType) {
      addGpuToUrlParams(gpuType);
    }

    const container = formContainerRef.current;
    if (!container) return;

    setLoadState('loading');

    timeoutRef.current = setTimeout(() => {
      if (isMountedRef.current) {
        setLoadState((current) => (current === 'loading' ? 'error' : current));
      }
    }, FORM_LOAD_TIMEOUT_MS);

    // Allow time for DOM to settle after component mount before setting up observer
    const mountDelay = setTimeout(() => {
      setupFormObserver();
      loadScript();
    }, 50);

    return () => {
      isMountedRef.current = false;
      clearTimeout(mountDelay);
      cleanup();
    };
  }, [gpuType, loadScript, setupFormObserver, cleanup]);

  return (
    <>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
          {t('title')}
        </h1>
        {gpuType && (
          <p className="text-muted-foreground">
            {t('selected')} <span className="text-accent font-medium">{gpuType}</span>
          </p>
        )}
      </div>

      {/* Form Container */}
      <div className="rounded-2xl border border-border bg-white p-6 md:p-8">
        {(loadState === 'loading' || loadState === 'idle') && (
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
    </>
  );
}

function FormSkeleton() {
  return (
    <>
      <div className="mb-8">
        <div className="h-8 w-48 bg-muted rounded animate-pulse mb-2" />
        <div className="h-5 w-32 bg-muted rounded animate-pulse" />
      </div>
      <div className="rounded-2xl border border-border bg-white p-6 md:p-8">
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            <div className="h-4 w-24 bg-muted rounded animate-pulse" />
          </div>
        </div>
      </div>
    </>
  );
}

export function RequestGpuClient() {
  const t = useTranslations('requestGpu');

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-4 py-8 md:py-16">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <svg
            aria-hidden="true"
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          {t('backToHome')}
        </Link>

        <Suspense fallback={<FormSkeleton />}>
          <RequestGpuForm />
        </Suspense>
      </div>
    </div>
  );
}

// Declare HubSpot global for TypeScript
declare global {
  interface Window {
    HubSpotForms?: {
      reload: () => void;
    };
  }
}
