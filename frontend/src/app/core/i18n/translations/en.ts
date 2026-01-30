/**
 * English translations for MineGNK
 */
export const en = {
  hero: {
    badge: 'GPU Mining as a Service',
    title: 'Rent GPUs to mine',
    titleHighlight: 'GNK',
    subtitle:
      'Rent enterprise-grade GPUs to mine cryptocurrency on our network. Pay in fiat currency and earn tokens that power the future of AI inference.',
    cta: 'Rent GPU',
    features: {
      fiat: 'Pay in fiat currency',
      enterprise: 'Enterprise-grade GPUs',
      monitoring: 'Real-time monitoring',
      support: '24/7 dedicated support',
    },
  },
  nav: {
    features: 'Features',
    howItWorks: 'How It Works',
    pricing: 'Pricing',
    faq: 'FAQ',
  },
  features: {
    badge: 'Why mine with us',
    title: 'Simple onboarding, powerful results',
    subtitle:
      'Mining as a service: pay in fiat, use enterprise GPUs, earn AI-focused tokens.',
    fiat: {
      title: 'Pay in Fiat Currency',
      description:
        'No wallets or exchanges needed. Onboard fast and start mining immediately.',
    },
    enterprise: {
      title: 'Enterprise-grade GPUs',
      description:
        'Access dedicated, high-performance GPUs for reliable, efficient mining.',
    },
    aiTokens: {
      title: 'AI-Focused Tokens',
      description:
        'Earn tokens designed for AI inference workloads across the Gonka network.',
    },
  },
  pricing: {
    title: 'GPU Pricing',
    subtitle: 'Choose the GPU that fits your mining needs',
    perMonth: '/month',
    perHour: '/hour',
    rentNow: 'Rent Now',
  },
  faq: {
    title: 'Frequently Asked Questions',
    subtitle: 'Everything you need to know about GPU mining with MineGNK',
  },
  footer: {
    copyright: '© 2025 MineGNK. All rights reserved.',
    privacy: 'Privacy Policy',
    terms: 'Terms of Service',
  },
};

/**
 * Translation type interface
 * Uses mapped types to convert literal strings to generic strings
 */
type DeepStringify<T> = {
  [K in keyof T]: T[K] extends object ? DeepStringify<T[K]> : string;
};

export type Translations = DeepStringify<typeof en>;
