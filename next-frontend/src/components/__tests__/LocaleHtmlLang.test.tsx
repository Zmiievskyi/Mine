import { render } from '@testing-library/react';
import { LocaleHtmlLang } from '../LocaleHtmlLang';

describe('LocaleHtmlLang', () => {
  beforeEach(() => {
    // Reset html lang attribute before each test
    document.documentElement.lang = '';
  });

  it('renders without crashing', () => {
    const { container } = render(<LocaleHtmlLang locale="en" />);
    expect(container).toBeInTheDocument();
  });

  it('sets html lang attribute to provided locale', () => {
    render(<LocaleHtmlLang locale="en" />);
    expect(document.documentElement.lang).toBe('en');
  });

  it('updates html lang when locale prop changes', () => {
    const { rerender } = render(<LocaleHtmlLang locale="en" />);
    expect(document.documentElement.lang).toBe('en');

    rerender(<LocaleHtmlLang locale="ru" />);
    expect(document.documentElement.lang).toBe('ru');
  });

  it('handles Chinese locale', () => {
    render(<LocaleHtmlLang locale="zh" />);
    expect(document.documentElement.lang).toBe('zh');
  });

  it('does not render any visible content', () => {
    const { container } = render(<LocaleHtmlLang locale="en" />);
    expect(container.firstChild).toBeNull();
  });
});
