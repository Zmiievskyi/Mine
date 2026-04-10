'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { HardLink } from '@/components/ui/HardLink';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { NetworkStatus } from '@/components/ui/NetworkStatus';

export function Header() {
  const t = useTranslations();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: t('nav.features'), href: '#features' },
    { label: t('nav.pricing'), href: '#pricing' },
    { label: t('nav.efficiency'), href: '#efficiency' },
    { label: t('nav.howItWorks'), href: '#how-it-works' },
    { label: t('nav.faq'), href: '#faq' },
  ];

  const scrollToSection = useCallback((sectionId: string) => {
    const element = document.querySelector(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMobileMenuOpen(false);
  }, []);

  return (
    <header className="sticky top-0 inset-x-0 w-full z-50">
      {/* Announcement Banner: Crypto Payments */}
      <div className="w-full bg-accent/10 border-b border-accent/20 py-1.5 px-4">
        <p className="text-center text-xs text-accent font-medium flex items-center justify-center gap-1.5">
          <svg aria-hidden="true" className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
            <path d="M23.638 14.904c-1.602 6.425-8.113 10.34-14.542 8.736C2.67 22.05-1.244 15.525.362 9.105 1.962 2.67 8.475-1.243 14.9.358c6.43 1.605 10.342 8.115 8.738 14.546z"/>
            <path fill="#fff" d="M17.147 10.41c.236-1.574-.963-2.419-2.602-2.982l.532-2.133-1.299-.324-.518 2.076c-.342-.085-.693-.165-1.042-.244l.52-2.089-1.298-.323-.532 2.132c-.283-.065-.56-.128-.83-.195l.002-.007-1.79-.447-.345 1.387s.963.22.943.234c.527.132.622.48.606.756l-.607 2.434c.036.009.083.022.134.043l-.136-.034-.851 3.415c-.064.16-.228.4-.596.308.013.019-.944-.236-.944-.236l-.645 1.487 1.69.421c.314.079.622.161.925.239l-.537 2.154 1.297.323.532-2.134c.354.096.697.184 1.033.268l-.53 2.122 1.299.323.537-2.15c2.214.419 3.88.25 4.579-1.754.565-1.612-.028-2.54-1.192-3.146.847-.195 1.485-.752 1.655-1.902zm-2.964 4.155c-.402 1.612-3.12.74-4.003.522l.714-2.862c.883.22 3.715.658 3.289 2.34zm.402-4.176c-.366 1.468-2.629.722-3.362.539l.648-2.595c.733.183 3.092.524 2.714 2.056z"/>
          </svg>
          {t('banner.cryptoPayments')}
        </p>
      </div>

      {/* Main Navigation Bar */}
      <div className="h-14 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="mx-auto w-full max-w-screen-xl px-4 md:px-12 lg:px-20 h-full">
          <nav className="flex items-center justify-between h-full">
            {/* Logo + Navigation (left side) */}
            <div className="flex items-center gap-8">
              <Link href="/" className="text-xl font-bold text-foreground">
                MineGNK
              </Link>

              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center gap-6">
                {navLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={(e) => {
                      e.preventDefault();
                      scrollToSection(link.href);
                    }}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            </div>

            {/* Right side: Language Switcher + Rent Button */}
            <div className="hidden md:flex items-center gap-4">
              <LanguageSwitcher />
              <HardLink
                href="/request-gpu"
                className="inline-flex items-center gap-2 px-5 py-2 bg-accent hover:bg-accent-hover text-white font-semibold text-sm rounded-lg transition-all duration-300 shadow-lg shadow-accent/25 hover:shadow-accent/40 hover:shadow-xl"
              >
                {t('hero.cta')}
              </HardLink>
            </div>

            {/* Mobile Menu Toggle */}
            <button
              className="md:hidden p-2 text-muted-foreground hover:text-foreground"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle menu"
              aria-expanded={isMobileMenuOpen}
            >
              {!isMobileMenuOpen ? (
                <svg
                  aria-hidden="true"
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              ) : (
                <svg
                  aria-hidden="true"
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              )}
            </button>
          </nav>

          {/* Mobile Navigation */}
          {isMobileMenuOpen && (
            <div className="md:hidden absolute left-0 right-0 top-14 bg-background border-b border-border p-4 z-50">
              <div className="flex flex-col gap-4">
                {navLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={(e) => {
                      e.preventDefault();
                      scrollToSection(link.href);
                    }}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
                  >
                    {link.label}
                  </a>
                ))}

                {/* Language Switcher (Mobile) */}
                <div className="flex items-center gap-2 py-2">
                  <LanguageSwitcher showLabels />
                </div>

                {/* Rent GPU Button (Mobile) */}
                <HardLink
                  href="/request-gpu"
                  className="w-full py-3 px-4 bg-accent hover:bg-accent-hover text-white font-semibold text-sm rounded-lg transition-colors duration-200 mt-2 text-center"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {t('hero.cta')}
                </HardLink>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Network Status Strip */}
      <NetworkStatus />
    </header>
  );
}
