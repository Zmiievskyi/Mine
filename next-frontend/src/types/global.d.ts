/**
 * Global type declarations for third-party integrations
 */

// HubSpot Forms API
declare global {
  interface Window {
    HubSpotForms?: {
      reload: () => void;
    };
  }
}

export {};
