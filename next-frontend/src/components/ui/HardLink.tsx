'use client';

import { useLocale } from 'next-intl';
import { MouseEvent, AnchorHTMLAttributes } from 'react';

interface HardLinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  href: string;
  children: React.ReactNode;
}

/**
 * A link component that forces a full page reload instead of client-side navigation.
 * Use this when navigating to pages that require fresh script loading (e.g., HubSpot forms).
 */
export function HardLink({ href, children, onClick, ...props }: HardLinkProps) {
  const locale = useLocale();

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    onClick?.(e);

    // Construct the full URL with locale prefix
    const fullPath = href.startsWith('/') ? `/${locale}${href}` : href;
    window.location.href = fullPath;
  };

  // Construct href for accessibility (right-click, middle-click)
  const fullHref = href.startsWith('/') ? `/${locale}${href}` : href;

  return (
    <a href={fullHref} onClick={handleClick} {...props}>
      {children}
    </a>
  );
}
