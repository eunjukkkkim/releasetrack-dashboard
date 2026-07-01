/**
 * Vitest/jsdom setup — polyfills for Radix UI primitives (Select/Dialog).
 *
 * jsdom does not implement the Pointer Capture API, Element.scrollIntoView, or
 * ResizeObserver, which Radix Select/Dialog invoke during interaction. Without
 * these stubs, any test that renders and drives a Radix Select/Dialog throws.
 * These are no-op stubs so existing behavioural tests keep their meaning while
 * future component tests can render the migrated controls safely.
 */
if (!Element.prototype.hasPointerCapture) {
  Element.prototype.hasPointerCapture = (): boolean => false;
}
if (!Element.prototype.setPointerCapture) {
  Element.prototype.setPointerCapture = (): void => {};
}
if (!Element.prototype.releasePointerCapture) {
  Element.prototype.releasePointerCapture = (): void => {};
}
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = (): void => {};
}

if (typeof globalThis.ResizeObserver === 'undefined') {
  class ResizeObserverStub {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  }
  globalThis.ResizeObserver = ResizeObserverStub as unknown as typeof ResizeObserver;
}

// react-day-picker / Radix Popover (date pickers) probe matchMedia for reduced
// motion; jsdom does not implement it. No-op stub keeps render tests safe.
if (typeof window !== 'undefined' && typeof window.matchMedia !== 'function') {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}
