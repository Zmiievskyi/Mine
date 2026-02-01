import { render, screen } from '@testing-library/react';
import RootPage from '../page';

// Mock routing config
jest.mock('@/i18n/routing', () => ({
  routing: {
    locales: ['en', 'ru', 'zh'],
    defaultLocale: 'en',
  },
}));

describe('RootPage (Simple)', () => {
  it('renders loading state', () => {
    render(<RootPage />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('has background styling', () => {
    const { container } = render(<RootPage />);
    const loadingDiv = container.querySelector('.bg-background');
    expect(loadingDiv).toBeInTheDocument();
  });

  it('has animate-pulse on loading text', () => {
    const { container } = render(<RootPage />);
    const animatedDiv = container.querySelector('.animate-pulse');
    expect(animatedDiv).toBeInTheDocument();
  });
});
