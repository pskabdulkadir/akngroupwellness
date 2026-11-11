import { useEffect } from 'react';

const FIELD_SELECTOR = 'input, textarea, select, [contenteditable="true"]';
const KEYBOARD_SETTLE_MS = 250;

export function useKeyboardAvoidance(): void {
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;

    let lastHeight = viewport.height;
    let timer: number | undefined;

    const keepFocusedFieldVisible = () => {
      const active = document.activeElement;
      if (!(active instanceof HTMLElement) || !active.matches(FIELD_SELECTOR)) return;
      const rect = active.getBoundingClientRect();
      const visibleTop = viewport.offsetTop;
      const visibleBottom = viewport.offsetTop + viewport.height;
      if (rect.top < visibleTop || rect.bottom > visibleBottom) {
        active.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }
    };

    const scheduleCheck = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(keepFocusedFieldVisible, KEYBOARD_SETTLE_MS);
    };

    const handleResize = () => {
      const keyboardOpened = viewport.height < lastHeight;
      lastHeight = viewport.height;
      if (keyboardOpened) scheduleCheck();
    };

    const handleFocusIn = (event: FocusEvent) => {
      if (event.target instanceof HTMLElement && event.target.matches(FIELD_SELECTOR)) {
        scheduleCheck();
      }
    };

    viewport.addEventListener('resize', handleResize);
    document.addEventListener('focusin', handleFocusIn);
    return () => {
      window.clearTimeout(timer);
      viewport.removeEventListener('resize', handleResize);
      document.removeEventListener('focusin', handleFocusIn);
    };
  }, []);
}
