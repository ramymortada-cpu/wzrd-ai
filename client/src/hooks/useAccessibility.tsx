/**
 * Accessibility Utilities — helpers for screen readers, keyboard navigation, and ARIA.
 * 
 * Usage:
 *   import { useKeyboardNav, srOnly, ariaProps } from '@/hooks/useAccessibility';
 */

import { useEffect, useCallback, useRef } from 'react';

/**
 * Screen-reader only CSS class.
 * Visually hides content but keeps it accessible to screen readers.
 */
export const srOnlyStyles: React.CSSProperties = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  padding: '0',
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  borderWidth: '0',
};

/**
 * Screen-reader only span component.
 */
export function SrOnly({ children }: { children: React.ReactNode }) {
  return <span style={srOnlyStyles}>{children}</span>;
}

/**
 * Generate standard ARIA props for interactive elements.
 */
export function ariaProps(options: {
  label?: string;
  describedBy?: string;
  expanded?: boolean;
  controls?: string;
  role?: string;
  required?: boolean;
  invalid?: boolean;
  disabled?: boolean;
  live?: 'polite' | 'assertive' | 'off';
}) {
  const props: Record<string, any> = {};

  if (options.label) props['aria-label'] = options.label;
  if (options.describedBy) props['aria-describedby'] = options.describedBy;
  if (options.expanded !== undefined) props['aria-expanded'] = options.expanded;
  if (options.controls) props['aria-controls'] = options.controls;
  if (options.role) props.role = options.role;
  if (options.required) props['aria-required'] = true;
  if (options.invalid) props['aria-invalid'] = true;
  if (options.disabled) props['aria-disabled'] = true;
  if (options.live) props['aria-live'] = options.live;

  return props;
}

/**
 * Hook for keyboard navigation in lists/grids.
 * Handles arrow key navigation between focusable items.
 * 
 * Usage:
 *   const containerRef = useKeyboardNav({ selector: '[role="option"]' });
 *   return <div ref={containerRef}>...</div>;
 */
export function useKeyboardNav(options: {
  selector: string;
  orientation?: 'vertical' | 'horizontal';
  loop?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { selector, orientation = 'vertical', loop = true } = options;

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const container = containerRef.current;
    if (!container) return;

    const items = Array.from(container.querySelectorAll(selector)) as HTMLElement[];
    if (items.length === 0) return;

    const currentIndex = items.indexOf(document.activeElement as HTMLElement);
    
    const isNext = orientation === 'vertical' ? e.key === 'ArrowDown' : e.key === 'ArrowRight';
    const isPrev = orientation === 'vertical' ? e.key === 'ArrowUp' : e.key === 'ArrowLeft';

    let nextIndex = -1;

    if (isNext) {
      e.preventDefault();
      nextIndex = currentIndex + 1;
      if (nextIndex >= items.length) nextIndex = loop ? 0 : items.length - 1;
    } else if (isPrev) {
      e.preventDefault();
      nextIndex = currentIndex - 1;
      if (nextIndex < 0) nextIndex = loop ? items.length - 1 : 0;
    } else if (e.key === 'Home') {
      e.preventDefault();
      nextIndex = 0;
    } else if (e.key === 'End') {
      e.preventDefault();
      nextIndex = items.length - 1;
    }

    if (nextIndex >= 0 && nextIndex < items.length) {
      items[nextIndex].focus();
    }
  }, [selector, orientation, loop]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('keydown', handleKeyDown);
    return () => container.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return containerRef;
}

/**
 * Hook to trap focus within a modal/dialog.
 * Press Tab to cycle through focusable elements, Escape to close.
 */
export function useFocusTrap(isOpen: boolean, onClose?: () => void) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen || !containerRef.current) return;

    const container = containerRef.current;
    const focusableSelector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
        return;
      }

      if (e.key !== 'Tab') return;

      const focusable = Array.from(container.querySelectorAll(focusableSelector)) as HTMLElement[];
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);

    // Focus first focusable element on open
    const focusable = container.querySelectorAll(focusableSelector) as NodeListOf<HTMLElement>;
    if (focusable.length > 0) {
      focusable[0].focus();
    }

    return () => container.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return containerRef;
}

/**
 * Live region announcer — announces dynamic content changes to screen readers.
 */
export function useAnnouncer() {
  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const el = document.createElement('div');
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', priority);
    el.setAttribute('aria-atomic', 'true');
    Object.assign(el.style, srOnlyStyles);
    
    document.body.appendChild(el);
    
    // Delay to ensure screen reader picks it up
    setTimeout(() => {
      el.textContent = message;
    }, 100);

    // Clean up after announcement
    setTimeout(() => {
      document.body.removeChild(el);
    }, 3000);
  }, []);

  return announce;
}
