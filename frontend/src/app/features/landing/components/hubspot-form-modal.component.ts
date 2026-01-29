import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  effect,
  ElementRef,
  viewChild,
  PLATFORM_ID,
  inject,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../../../environments/environment';

declare global {
  interface Window {
    hbspt?: {
      forms: {
        create: (config: HubSpotFormConfig) => void;
      };
    };
  }
}

interface HubSpotFormConfig {
  region: string;
  portalId: string;
  formId: string;
  target: string;
  onFormReady?: ($form: JQueryForm) => void;
  onFormSubmitted?: () => void;
}

interface JQueryForm {
  find: (selector: string) => JQueryElement;
}

interface JQueryElement {
  val: (value: string) => JQueryElement;
  change: () => JQueryElement;
}

/**
 * HubSpot form modal component
 *
 * Displays a modal with embedded HubSpot form for GPU rental inquiries.
 * Supports pre-selecting GPU type via gpuType input.
 */
@Component({
  selector: 'app-hubspot-form-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (isOpen()) {
      <div
        class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90"
        (click)="onBackdropClick($event)"
      >
        <!-- Modal -->
        <div
          class="relative w-full max-w-2xl bg-[#18181b] rounded-2xl shadow-2xl overflow-hidden"
          (click)="$event.stopPropagation()"
        >
          <!-- Header -->
          <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-[#18181b]">
            <div>
              <h2 class="text-xl font-semibold text-white">Rent GPUs</h2>
              @if (gpuType()) {
                <p class="text-sm text-zinc-400 mt-0.5">Selected: {{ gpuType() }}</p>
              }
            </div>
            <button
              type="button"
              class="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
              (click)="close.emit()"
              aria-label="Close modal"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Form Container (white background for HubSpot form) -->
          <div class="px-6 py-6 max-h-[70vh] overflow-y-auto bg-white">
            <div #formContainer class="hubspot-form-container"></div>
          </div>
        </div>
      </div>
    }
  `,
  styles: [
    `
      :host {
        display: contents;
      }

      /* HubSpot form container - minimal styling since form is in iframe */
      :host ::ng-deep .hubspot-form-container {
        min-height: 200px;

        /* Style submit button if accessible */
        input[type='submit'],
        button[type='submit'],
        .hs-button {
          background: #ff4c00 !important;
          border-radius: 0.5rem !important;
        }

        input[type='submit']:hover,
        button[type='submit']:hover,
        .hs-button:hover {
          background: #e64500 !important;
        }
      }
    `,
  ],
})
export class HubspotFormModalComponent {
  private readonly platformId = inject(PLATFORM_ID);

  /** Whether the modal is open */
  public readonly isOpen = input<boolean>(false);

  /** Pre-selected GPU type (optional) */
  public readonly gpuType = input<string | null>(null);

  /** Emits when modal should close */
  public readonly close = output<void>();

  /** Emits when form is successfully submitted */
  public readonly formSubmitted = output<void>();

  private readonly formContainer = viewChild<ElementRef<HTMLDivElement>>('formContainer');
  private formLoaded = false;
  private scriptLoaded = false;
  private originalUrl: string | null = null;

  constructor() {
    // Load form when modal opens
    effect(() => {
      if (this.isOpen() && isPlatformBrowser(this.platformId)) {
        // Add URL params for HubSpot to read, then load form
        this.addUrlParams();
        setTimeout(() => this.loadForm(), 50);
      } else if (!this.isOpen() && isPlatformBrowser(this.platformId)) {
        // Remove URL params when modal closes
        this.removeUrlParams();
      }
    });
  }

  protected onBackdropClick(event: Event): void {
    if (event.target === event.currentTarget) {
      this.close.emit();
    }
  }

  /**
   * Add HubSpot field values as URL query parameters
   * HubSpot forms automatically read these when rendering
   */
  private addUrlParams(): void {
    const gpuValue = this.gpuType() ? this.getHubSpotGpuValue(this.gpuType()!) : null;
    if (!gpuValue) return;

    // Save original URL for restoration
    this.originalUrl = window.location.href;

    // Build new URL with HubSpot params
    const url = new URL(window.location.href);
    url.searchParams.set('form_gonka_preffered_configuration', gpuValue);
    url.searchParams.set('form_gonka_servers_number', '1');

    // Update URL without page reload
    window.history.replaceState({}, '', url.toString());
    console.log('HubSpot: Added URL params:', gpuValue);
  }

  /**
   * Remove HubSpot query parameters from URL
   */
  private removeUrlParams(): void {
    if (!this.originalUrl) return;

    // Restore original URL
    window.history.replaceState({}, '', this.originalUrl);
    this.originalUrl = null;
    console.log('HubSpot: Restored original URL');
  }

  private loadForm(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const container = this.formContainer()?.nativeElement;
    if (!container) return;

    // Clear previous form and reset state for fresh load
    container.innerHTML = '';
    this.formLoaded = false;

    // Assign new container ID to force fresh form render
    this.assignContainerId(container);

    if (!this.scriptLoaded) {
      this.loadScript().then(() => this.createForm(container));
    } else {
      this.createForm(container);
    }
  }

  private loadScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Check if hbspt is already available
      if (window.hbspt?.forms) {
        this.scriptLoaded = true;
        resolve();
        return;
      }

      // Check if script is already loading
      const existingScript = document.querySelector('script[src*="hsforms.net/forms/v2"]');
      if (existingScript) {
        existingScript.addEventListener('load', () => {
          this.scriptLoaded = true;
          resolve();
        });
        return;
      }

      // Use v2.js script which renders directly in DOM (no iframe)
      const script = document.createElement('script');
      const region = environment.hubspot.region;
      script.src =
        region === 'eu1'
          ? 'https://js-eu1.hsforms.net/forms/v2.js'
          : 'https://js.hsforms.net/forms/v2.js';
      script.charset = 'utf-8';
      script.async = true;

      script.onload = () => {
        // Wait for hbspt to be available
        const checkReady = (attempts = 0): void => {
          if (window.hbspt?.forms) {
            this.scriptLoaded = true;
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

  private createForm(container: HTMLElement): void {
    if (this.formLoaded || !window.hbspt?.forms) {
      return;
    }

    // Container ID should already be set by loadForm()
    if (!container.id) {
      this.assignContainerId(container);
    }

    const selectedGpu = this.gpuType();
    const hubspotGpuValue = selectedGpu ? this.getHubSpotGpuValue(selectedGpu) : null;

    window.hbspt.forms.create({
      region: environment.hubspot.region,
      portalId: environment.hubspot.portalId,
      formId: environment.hubspot.formId,
      target: `#${container.id}`,
      onFormReady: ($form: JQueryForm) => {
        // Pre-select the GPU type in the dropdown if provided
        if (hubspotGpuValue) {
          this.setGpuFieldValue(container, $form, hubspotGpuValue);
        }
      },
      onFormSubmitted: () => {
        this.formSubmitted.emit();
      },
    });

    this.formLoaded = true;
  }

  /**
   * Convert GPU type to HubSpot dropdown value format
   * "8x A100 Server" -> "8 x A100"
   * "A100" -> "8 x A100"
   *
   * HubSpot dropdown values match Gcore's URL format: "8 x A100", "8 x H100", etc.
   */
  private getHubSpotGpuValue(gpuType: string): string | null {
    const validIds = ['A100', 'H100', 'H200', 'B200'];
    const upperType = gpuType.toUpperCase();

    for (const id of validIds) {
      if (upperType.includes(id)) {
        // HubSpot format: "8 x A100" (with spaces around 'x')
        return `8 x ${id}`;
      }
    }

    return null;
  }

  private assignContainerId(container: HTMLElement): string {
    const id = 'hubspot-form-' + Math.random().toString(36).substring(2, 9);
    container.id = id;
    return id;
  }

  /**
   * Set GPU field value using multiple strategies
   * @param gpuValue - HubSpot dropdown value format, e.g., "8 x A100"
   */
  private setGpuFieldValue(container: HTMLElement, $form: JQueryForm, gpuValue: string): void {
    // Strategy 1: Try jQuery with known HubSpot field names
    // Note: Gcore uses "form_gonka_preffered_configuration" (misspelled "preffered")
    const fieldNames = [
      'form_gonka_preffered_configuration', // Gcore's actual field name (with typo)
      'form_gonka_preferred_configuration', // In case they fix the typo
      'preferred_node_configuration',
      'preferrednodeconfiguration',
      'gpu_configuration',
      'gpu_type',
    ];

    for (const fieldName of fieldNames) {
      try {
        const $field = $form.find(`[name="${fieldName}"]`);
        if ($field) {
          $field.val(gpuValue).change();
          console.log(`HubSpot: Set field ${fieldName} to ${gpuValue}`);
          return;
        }
      } catch {
        // Continue to next field name
      }
    }

    // Strategy 2: Try to find any select and set it
    try {
      const $selects = $form.find('select');
      if ($selects) {
        $selects.val(gpuValue).change();
        console.log(`HubSpot: Set select to ${gpuValue}`);
      }
    } catch {
      // Continue to DOM strategy
    }

    // Strategy 3: Use native DOM with retries (for iframe loading delay)
    const trySetValue = (attempt = 0): void => {
      // Try in main document
      const selects = container.querySelectorAll('select');
      for (const select of selects) {
        const options = select.querySelectorAll('option');
        for (const option of options) {
          // Match by exact value or by containing the GPU value text
          if (option.value === gpuValue || option.textContent?.trim() === gpuValue) {
            select.value = option.value;
            select.dispatchEvent(new Event('change', { bubbles: true }));
            console.log(`HubSpot: DOM set select to ${gpuValue}`);
            return;
          }
        }
      }

      // Try in iframe if exists
      const iframe = container.querySelector('iframe');
      if (iframe) {
        try {
          const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
          if (iframeDoc) {
            const iframeSelects = iframeDoc.querySelectorAll('select');
            for (const select of iframeSelects) {
              const options = select.querySelectorAll('option');
              for (const option of options) {
                if (option.value === gpuValue || option.textContent?.trim() === gpuValue) {
                  select.value = option.value;
                  select.dispatchEvent(new Event('change', { bubbles: true }));
                  console.log(`HubSpot: iframe set select to ${gpuValue}`);
                  return;
                }
              }
            }
          }
        } catch (e) {
          console.log('HubSpot: Cannot access iframe (cross-origin)', e);
        }
      }

      // Retry if not found and attempts remaining
      if (attempt < 10) {
        setTimeout(() => trySetValue(attempt + 1), 200);
      }
    };

    setTimeout(() => trySetValue(), 500);
  }
}
