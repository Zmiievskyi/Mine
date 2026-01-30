/**
 * HubSpot Forms Utilities
 * Handles script loading and form field manipulation for HubSpot embedded forms
 */

declare global {
  interface Window {
    hbspt?: {
      forms: {
        create: (config: HubSpotFormConfig) => void;
      };
    };
  }
}

export interface HubSpotFormConfig {
  region: string;
  portalId: string;
  formId: string;
  target: string;
  onFormReady?: ($form: JQueryForm) => void;
  onFormSubmitted?: () => void;
}

export interface JQueryForm {
  find: (selector: string) => JQueryElement;
}

export interface JQueryElement {
  val: (value: string) => JQueryElement;
  change: () => JQueryElement;
}

// Environment config - use sandbox values for development
export const HUBSPOT_CONFIG = {
  portalId: process.env.NEXT_PUBLIC_HUBSPOT_PORTAL_ID || '147554099',
  formId:
    process.env.NEXT_PUBLIC_HUBSPOT_FORM_ID ||
    '78fd550b-eec3-4958-bc4d-52c73924b87b',
  region: process.env.NEXT_PUBLIC_HUBSPOT_REGION || 'eu1',
};

/**
 * Maps GPU type string to HubSpot-compatible format
 * @param gpuType - GPU type string (e.g., "A100", "H100")
 * @returns Formatted GPU value (e.g., "8 x A100") or null if invalid
 */
export function getHubSpotGpuValue(gpuType: string): string | null {
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
 * Loads HubSpot forms script if not already loaded
 * @returns Promise that resolves when script is loaded and API is available
 */
export function loadHubSpotScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.hbspt?.forms) {
      resolve();
      return;
    }

    const existingScript = document.querySelector(
      'script[src*="hsforms.net/forms/v2"]'
    );
    if (existingScript) {
      existingScript.addEventListener('load', () => {
        resolve();
      });
      return;
    }

    const script = document.createElement('script');
    script.src =
      HUBSPOT_CONFIG.region === 'eu1'
        ? 'https://js-eu1.hsforms.net/forms/v2.js'
        : 'https://js.hsforms.net/forms/v2.js';
    script.charset = 'utf-8';
    script.async = true;

    script.onload = () => {
      const checkReady = (attempts = 0): void => {
        if (window.hbspt?.forms) {
          resolve();
        } else if (attempts < 30) {
          setTimeout(() => checkReady(attempts + 1), 100);
        } else {
          reject(new Error('HubSpot forms API not available'));
        }
      };
      checkReady();
    };

    script.onerror = (error) => {
      console.error('Failed to load HubSpot script:', error);
      reject(error);
    };

    document.head.appendChild(script);
  });
}

/**
 * Sets GPU field value in HubSpot form using multiple strategies
 * @param container - Form container DOM element
 * @param $form - jQuery-style form object from HubSpot
 * @param gpuValue - GPU value to set (e.g., "8 x A100")
 */
export function setGpuFieldValue(
  container: HTMLElement,
  $form: JQueryForm,
  gpuValue: string
): void {
  // Strategy 1: Try known field names
  const fieldNames = [
    'form_gonka_preffered_configuration',
    'form_gonka_preferred_configuration',
    'preferred_node_configuration',
    'gpu_configuration',
    'gpu_type',
  ];

  for (const fieldName of fieldNames) {
    try {
      const $field = $form.find(`[name="${fieldName}"]`);
      if ($field) {
        $field.val(gpuValue).change();
        return;
      }
    } catch {
      // Continue to next field name
    }
  }

  // Strategy 2: Try all select elements
  try {
    const $selects = $form.find('select');
    if ($selects) {
      $selects.val(gpuValue).change();
    }
  } catch {
    // Continue to DOM strategy
  }

  // Strategy 3: Use DOM API with retry logic
  const trySetValue = (attempt = 0): void => {
    const selects = container.querySelectorAll('select');
    for (const select of selects) {
      const options = select.querySelectorAll('option');
      for (const option of options) {
        if (
          option.value === gpuValue ||
          option.textContent?.trim() === gpuValue
        ) {
          (select as HTMLSelectElement).value = option.value;
          select.dispatchEvent(new Event('change', { bubbles: true }));
          return;
        }
      }
    }

    if (attempt < 10) {
      setTimeout(() => trySetValue(attempt + 1), 200);
    }
  };

  setTimeout(() => trySetValue(), 500);
}

/**
 * Adds GPU configuration to URL parameters for HubSpot form pre-fill
 * @param gpuType - GPU type to add to URL
 * @returns Original URL before modification (for cleanup)
 */
export function addGpuToUrlParams(gpuType: string | null): string | null {
  const gpuValue = gpuType ? getHubSpotGpuValue(gpuType) : null;
  if (!gpuValue) return null;

  const originalUrl = window.location.href;
  const url = new URL(window.location.href);
  url.searchParams.set('form_gonka_preffered_configuration', gpuValue);
  url.searchParams.set('form_gonka_servers_number', '1');
  window.history.replaceState({}, '', url.toString());
  return originalUrl;
}

/**
 * Removes GPU configuration from URL parameters
 * @param originalUrl - Original URL to restore
 */
export function removeGpuFromUrlParams(originalUrl: string | null): void {
  if (!originalUrl) return;
  window.history.replaceState({}, '', originalUrl);
}
