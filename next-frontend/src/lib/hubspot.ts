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

// Script loading constants
const SCRIPT_READY_CHECK_INTERVAL_MS = 100;
const SCRIPT_READY_MAX_ATTEMPTS = 30; // 3 seconds total timeout
const GPU_FIELD_RETRY_DELAY_MS = 200;
const GPU_FIELD_MAX_RETRIES = 10;
const GPU_FIELD_INITIAL_DELAY_MS = 500;

// Environment config - use sandbox values for development
export const HUBSPOT_CONFIG = {
  portalId: process.env.NEXT_PUBLIC_HUBSPOT_PORTAL_ID || '147554099',
  formId:
    process.env.NEXT_PUBLIC_HUBSPOT_FORM_ID ||
    '78fd550b-eec3-4958-bc4d-52c73924b87b',
  region: process.env.NEXT_PUBLIC_HUBSPOT_REGION || 'eu1',
};

// Re-export URL utilities for convenience
export {
  getHubSpotGpuValue,
  addGpuToUrlParams,
  removeGpuFromUrlParams,
} from './hubspot-url';

export class HubSpotLoadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'HubSpotLoadError';
  }
}

/**
 * Loads HubSpot forms script if not already loaded
 * @returns Promise that resolves when script is loaded and API is available
 * @throws HubSpotLoadError if script fails to load or API is unavailable
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
        } else if (attempts < SCRIPT_READY_MAX_ATTEMPTS) {
          setTimeout(() => checkReady(attempts + 1), SCRIPT_READY_CHECK_INTERVAL_MS);
        } else {
          reject(new HubSpotLoadError('HubSpot forms API not available after timeout'));
        }
      };
      checkReady();
    };

    script.onerror = () => {
      reject(new HubSpotLoadError('Failed to load HubSpot forms script'));
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

    if (attempt < GPU_FIELD_MAX_RETRIES) {
      setTimeout(() => trySetValue(attempt + 1), GPU_FIELD_RETRY_DELAY_MS);
    }
  };

  setTimeout(() => trySetValue(), GPU_FIELD_INITIAL_DELAY_MS);
}
