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

  // Ensure trailing slash for static export compatibility
  const ensureTrailingSlash = (path: string) => {
    // Don't add trailing slash if path has query params or hash
    if (path.includes('?') || path.includes('#')) {
      const [basePath, rest] = path.split(/([?#])/);
      const normalizedBase = basePath.endsWith('/') ? basePath : `${basePath}/`;
      return `${normalizedBase}${rest}${path.slice(basePath.length + 1)}`;
    }
    return path.endsWith('/') ? path : `${path}/`;
  };

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    // Allow normal browser behavior for middle-click, Cmd+click, Ctrl+click, etc.
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
      return;
    }

    e.preventDefault();
    onClick?.(e);

    // Construct the full URL with locale prefix and trailing slash
    const fullPath = href.startsWith('/') ? `/${locale}${ensureTrailingSlash(href)}` : href;
    window.location.href = fullPath;
  };

  // Construct href for accessibility (right-click, middle-click)
  const fullHref = href.startsWith('/') ? `/${locale}${ensureTrailingSlash(href)}` : href;

  return (
    <a href={fullHref} onClick={handleClick} {...props}>
      {children}
    </a>
  );
}
