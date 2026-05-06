import { render, screen } from '@testing-library/react';
import { PricingSection } from '../PricingSection';

const flatTranslations: Record<string, string> = {
  badge: 'GPU server options',
  title: 'Choose your 8x GPU server type',
  subtitle:
    'We offer 8x GPU servers based on H100, H200, B200, and B300 GPUs. Availability, region, contract duration, and commercial terms are confirmed after request. Month-to-month and longer commitment options are available.',
  rentNow: 'Request GPU',
  availableOnRequest: 'Available on request',
  commitmentOptions: 'Month-to-month or longer commitment available',
};

const rawTranslations: Record<string, unknown> = {
  gpuDescriptions: {
    H100: 'Next-gen GPU server for high-performance workloads',
    H200: 'High-memory GPU server for demanding workloads',
    B200: 'Blackwell GPU server for advanced workloads',
    B300: 'Newest Blackwell Ultra GPU server option',
  },
};

jest.mock('next-intl', () => ({
  useTranslations: () => {
    const t = (key: string) => flatTranslations[key] ?? key;
    t.raw = (key: string) => rawTranslations[key];
    return t;
  },
  useLocale: () => 'en',
}));

jest.mock('@/components/ui/HardLink', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  HardLink: ({ children, href, ...props }: Record<string, any>) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

jest.mock('@/components/ui/ScrollReveal', () => ({
  ScrollReveal: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock('@/data/pricing', () => ({
  pricing: [
    {
      name: '8x H100 Server',
      description: 'Next-gen AI training powerhouse',
      pricePerHour: 2.1,
      pricePerMonth: 12300,
      isContactSales: false,
      features: ['8x NVIDIA H100 80GB'],
    },
    {
      name: '8x H200 Server',
      description: 'Maximum memory for large models',
      pricePerHour: 3.05,
      pricePerMonth: 17800,
      isContactSales: false,
      features: ['8x NVIDIA H200 141GB'],
    },
    {
      name: '8x B200 Server',
      description: 'Latest Blackwell architecture',
      pricePerHour: 5.8,
      pricePerMonth: 33900,
      isContactSales: false,
      features: ['8x NVIDIA B200 192GB'],
    },
    {
      name: '8x B300 Server',
      description: 'Newest Blackwell Ultra GPU server',
      pricePerHour: 10.0,
      pricePerMonth: 58400,
      isContactSales: false,
      features: ['8x NVIDIA B300 192GB'],
    },
  ],
}));

describe('PricingSection', () => {
  it('renders the section with the pricing anchor id', () => {
    const { container } = render(<PricingSection />);
    const section = container.querySelector('section');
    expect(section).toHaveAttribute('id', 'pricing');
  });

  it('renders the section header', () => {
    render(<PricingSection />);

    expect(screen.getByText('GPU server options')).toBeInTheDocument();
    expect(screen.getByText('Choose your 8x GPU server type')).toBeInTheDocument();
    expect(
      screen.getByText(/We offer 8x GPU servers based on H100, H200, B200, and B300/),
    ).toBeInTheDocument();
  });

  it('renders all four GPU server cards (H100, H200, B200, B300)', () => {
    render(<PricingSection />);

    expect(screen.getByText('8x H100 Server')).toBeInTheDocument();
    expect(screen.getByText('8x H200 Server')).toBeInTheDocument();
    expect(screen.getByText('8x B200 Server')).toBeInTheDocument();
    expect(screen.getByText('8x B300 Server')).toBeInTheDocument();
  });

  it('does not render any A100 references', () => {
    render(<PricingSection />);

    expect(screen.queryByText(/A100/)).not.toBeInTheDocument();
  });

  it('renders the per-GPU descriptions from t.raw("gpuDescriptions")', () => {
    render(<PricingSection />);

    expect(
      screen.getByText('Next-gen GPU server for high-performance workloads'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('High-memory GPU server for demanding workloads'),
    ).toBeInTheDocument();
    expect(screen.getByText('Blackwell GPU server for advanced workloads')).toBeInTheDocument();
    expect(screen.getByText('Newest Blackwell Ultra GPU server option')).toBeInTheDocument();
  });

  it('renders availability and commitment copy on every card', () => {
    render(<PricingSection />);

    expect(screen.getAllByText('Available on request')).toHaveLength(4);
    expect(
      screen.getAllByText('Month-to-month or longer commitment available'),
    ).toHaveLength(4);
  });

  it('does not display any monthly or hourly prices', () => {
    render(<PricingSection />);

    expect(screen.queryByText(/\$\d/)).not.toBeInTheDocument();
    expect(screen.queryByText(/\/month/)).not.toBeInTheDocument();
    expect(screen.queryByText(/per GPU\/hour/i)).not.toBeInTheDocument();
  });

  it('does not render legacy pricing-era copy', () => {
    render(<PricingSection />);

    expect(screen.queryByText(/Volume discount/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/12-month contract/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Custom pricing/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Contact Sales/i)).not.toBeInTheDocument();
  });

  it('renders a "Request GPU" CTA per card', () => {
    render(<PricingSection />);

    expect(screen.getAllByText('Request GPU')).toHaveLength(4);
  });

  it('links each card to /request-gpu with the GPU name as a query param', () => {
    const { container } = render(<PricingSection />);

    const links = container.querySelectorAll<HTMLAnchorElement>('a[href^="/request-gpu"]');
    expect(links).toHaveLength(4);

    const hrefs = Array.from(links).map((a) => a.getAttribute('href'));
    expect(hrefs).toEqual(
      expect.arrayContaining([
        `/request-gpu?gpu=${encodeURIComponent('8x H100 Server')}`,
        `/request-gpu?gpu=${encodeURIComponent('8x H200 Server')}`,
        `/request-gpu?gpu=${encodeURIComponent('8x B200 Server')}`,
        `/request-gpu?gpu=${encodeURIComponent('8x B300 Server')}`,
      ]),
    );
  });
});
