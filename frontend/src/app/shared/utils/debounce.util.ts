/**
 * Debounce utility for delaying function execution until after a specified wait time.
 * Commonly used for search inputs to avoid excessive API calls.
 *
 * @example
 * ```typescript
 * class MyComponent {
 *   private searchDebounce = createDebounce();
 *
 *   onSearchInput() {
 *     this.searchDebounce(() => {
 *       this.performSearch();
 *     }, 300);
 *   }
 * }
 * ```
 */

/**
 * Creates a debounce function that delays callback execution
 * @returns A debounce function that accepts a callback and delay
 */
export function createDebounce(): (callback: () => void, delay: number) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return (callback: () => void, delay: number) => {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(callback, delay);
  };
}

