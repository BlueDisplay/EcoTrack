'use client';

import { useEffect } from 'react';

const REVEAL_SELECTORS = '.reveal, .reveal-left, .reveal-right, .reveal-scale';

/**
 * Activates scroll-based reveal animations using IntersectionObserver.
 * Elements with classes `reveal`, `reveal-left`, `reveal-right`, or `reveal-scale`
 * will animate in when they enter the viewport.
 */
export function useScrollReveal() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' },
    );

    // Small delay to ensure DOM is fully rendered
    const timeoutId = setTimeout(() => {
      document.querySelectorAll(REVEAL_SELECTORS).forEach((el) => {
        observer.observe(el);
      });
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      observer.disconnect();
    };
  }, []);
}
