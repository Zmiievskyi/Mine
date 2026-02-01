'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { HardLink } from '@/components/ui/HardLink';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';

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
    <header className="sticky top-0 inset-x-0 h-14 w-full z-50">
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
              className="inline-flex items-center gap-2 px-5 py-2 bg-accent hover:bg-accent-hover text-white font-semibold text-sm rounded-lg transition-colors duration-200"
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
          <div className="md:hidden absolute left-0 right-0 top-14 bg-background border-b border-border p-4">
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
    </header>
  );
}
