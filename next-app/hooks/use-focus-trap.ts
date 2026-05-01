'use client';

import { RefObject, useEffect } from 'react';

export function useFocusTrap<T extends HTMLElement>(open: boolean, ref: RefObject<T | null>) {
  useEffect(() => {
    if (!open || !ref.current) return;

    const root = ref.current;
    const selectors = [
      'a[href]',
      'button:not([disabled])',
      'textarea:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(',');

    const getFocusable = () =>
      Array.from(root.querySelectorAll<HTMLElement>(selectors)).filter(
        (element) => !element.hasAttribute('disabled') && element.tabIndex !== -1
      );

    const focusable = getFocusable();
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    first?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;
      const currentFocusable = getFocusable();
      const currentFirst = currentFocusable[0];
      const currentLast = currentFocusable[currentFocusable.length - 1];
      if (!currentFirst || !currentLast) return;

      if (event.shiftKey && document.activeElement === currentFirst) {
        event.preventDefault();
        currentLast.focus();
      } else if (!event.shiftKey && document.activeElement === currentLast) {
        event.preventDefault();
        currentFirst.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, ref]);
}
