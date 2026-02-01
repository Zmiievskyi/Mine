import { render, screen } from '@testing-library/react';
import { PricingSection } from '../PricingSection';

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      badge: 'Pricing',
      title: 'GPU Pricing Plans',
      subtitle: 'Choose the perfect GPU for your AI workload',
      perMonth: '/month',
      perGpuHour: 'per GPU/hour',
      contractType: '12-month contract',
      customPricing: 'Custom pricing',
      rentNow: 'Rent Now',
      contactSales: 'Contact Sales',
      volumeDiscount: 'Volume discounts available',
      volumeDiscountNote: 'for larger deployments',
    };
    return translations[key] || key;
  },
  useLocale: () => 'en',
}));

// Mock HardLink
jest.mock('@/components/ui/HardLink', () => ({
  HardLink: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

// Mock ScrollReveal
jest.mock('@/components/ui/ScrollReveal', () => ({
  ScrollReveal: ({ children }: any) => <div>{children}</div>,
}));

// Mock pricing data
jest.mock('@/data/pricing', () => ({
  pricing: [
    {
      name: '8x A100 Server',
      description: 'Entry-level high-performance GPU',
      pricePerHour: 0.99,
      pricePerMonth: 5780,
      isContactSales: false,
      features: ['8x NVIDIA A100 80GB'],
    },
    {
      name: '8x H100 Server',
      description: 'Next-gen AI training powerhouse',
      pricePerHour: 1.8,
      pricePerMonth: 10510,
      isContactSales: false,
      features: ['8x NVIDIA H100 80GB'],
    },
    {
      name: '8x H200 Server',
      description: 'Maximum memory for large models',
      pricePerHour: 2.4,
      pricePerMonth: 14020,
      isContactSales: false,
      features: ['8x NVIDIA H200 141GB'],
    },
    {
      name: '8x B200 Server',
      description: 'Latest Blackwell architecture',
      pricePerHour: null,
      pricePerMonth: null,
      isContactSales: true,
      features: ['8x NVIDIA B200 192GB'],
    },
  ],
  formatPrice: (price: number) =>
    price.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }),
  formatMonthlyPrice: (price: number) =>
    price.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }),
}));

describe('PricingSection', () => {
  it('renders the section', () => {
    const { container } = render(<PricingSection />);
    expect(container.querySelector('#pricing')).toBeInTheDocument();
  });

  it('renders section header', () => {
    render(<PricingSection />);

    expect(screen.getByText('Pricing')).toBeInTheDocument();
    expect(screen.getByText('GPU Pricing Plans')).toBeInTheDocument();
    expect(screen.getByText('Choose the perfect GPU for your AI workload')).toBeInTheDocument();
  });

  it('renders all GPU pricing cards', () => {
    render(<PricingSection />);

    expect(screen.getByText('8x A100 Server')).toBeInTheDocument();
    expect(screen.getByText('8x H100 Server')).toBeInTheDocument();
    expect(screen.getByText('8x H200 Server')).toBeInTheDocument();
    expect(screen.getByText('8x B200 Server')).toBeInTheDocument();
  });

  it('displays GPU descriptions', () => {
    render(<PricingSection />);

    expect(screen.getByText('Entry-level high-performance GPU')).toBeInTheDocument();
    expect(screen.getByText('Next-gen AI training powerhouse')).toBeInTheDocument();
    expect(screen.getByText('Maximum memory for large models')).toBeInTheDocument();
    expect(screen.getByText('Latest Blackwell architecture')).toBeInTheDocument();
  });

  it('displays monthly pricing for available GPUs', () => {
    render(<PricingSection />);

    expect(screen.getByText('$5,780')).toBeInTheDocument();
    expect(screen.getByText('$10,510')).toBeInTheDocument();
    expect(screen.getByText('$14,020')).toBeInTheDocument();
  });

  it('displays hourly pricing for available GPUs', () => {
    render(<PricingSection />);

    expect(screen.getByText('$0.99')).toBeInTheDocument();
    expect(screen.getByText('$1.80')).toBeInTheDocument();
    expect(screen.getByText('$2.40')).toBeInTheDocument();
  });

  it('shows custom pricing for contact sales GPUs', () => {
    render(<PricingSection />);

    expect(screen.getByText('Custom pricing')).toBeInTheDocument();
  });

  it('renders rent now links for available GPUs', () => {
    render(<PricingSection />);

    const rentButtons = screen.getAllByText('Rent Now');
    expect(rentButtons).toHaveLength(3);
  });

  it('renders contact sales link for B200', () => {
    render(<PricingSection />);

    const contactSalesButton = screen.getByText('Contact Sales');
    expect(contactSalesButton).toBeInTheDocument();
  });

  it('renders links for all GPU types', () => {
    const { container } = render(<PricingSection />);

    const links = container.querySelectorAll('a[href*="/request-gpu"]');
    expect(links.length).toBe(4); // 4 GPU types
  });

  it('displays volume discount notice', () => {
    render(<PricingSection />);

    expect(screen.getByText('Volume discounts available')).toBeInTheDocument();
    expect(screen.getByText('for larger deployments')).toBeInTheDocument();
  });

  it('renders per month and per hour labels', () => {
    render(<PricingSection />);

    expect(screen.getAllByText('/month').length).toBeGreaterThan(0);
    expect(screen.getAllByText('per GPU/hour').length).toBeGreaterThan(0);
  });

  it('renders contract type information', () => {
    render(<PricingSection />);

    const contractTypeElements = screen.getAllByText('12-month contract');
    expect(contractTypeElements.length).toBeGreaterThan(0);
  });

  it('has correct section id for anchor navigation', () => {
    const { container } = render(<PricingSection />);

    const section = container.querySelector('section');
    expect(section).toHaveAttribute('id', 'pricing');
  });
});
