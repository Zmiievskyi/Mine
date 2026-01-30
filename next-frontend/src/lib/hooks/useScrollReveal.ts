'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';

interface UseScrollRevealOptions {
  threshold?: number;
  rootMargin?: string;
  delay?: number;
}

// Check if user prefers reduced motion (SSR-safe)
function subscribeToPrefersReducedMotion(callback: () => void) {
  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  mediaQuery.addEventListener('change', callback);
  return () => mediaQuery.removeEventListener('change', callback);
}

function getPrefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function getServerPrefersReducedMotion() {
  return false; // Default to animations enabled on server
}

export function useScrollReveal<T extends HTMLElement>(
  options: UseScrollRevealOptions = {}
) {
  const { threshold = 0.1, rootMargin = '0px', delay = 0 } = options;
  const ref = useRef<T>(null);

  const prefersReducedMotion = useSyncExternalStore(
    subscribeToPrefersReducedMotion,
    getPrefersReducedMotion,
    getServerPrefersReducedMotion
  );

  const [isVisible, setIsVisible] = useState(prefersReducedMotion);

  useEffect(() => {
    // If reduced motion is preferred, element should already be visible
    if (prefersReducedMotion) return;

    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (delay > 0) {
              setTimeout(() => setIsVisible(true), delay);
            } else {
              setIsVisible(true);
            }
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold, rootMargin }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [threshold, rootMargin, delay, prefersReducedMotion]);

  return { ref, isVisible: prefersReducedMotion || isVisible };
}
