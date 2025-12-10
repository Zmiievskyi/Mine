/**
 * Creates a reusable pagination handler that updates page and reloads data
 *
 * @param setPage - Function to update the current page number
 * @param loadFn - Function to reload data with the new page
 * @returns Function that handles page navigation
 *
 * @example
 * ```typescript
 * goToPage = createPaginationHandler(
 *   (page) => this.currentPage = page,
 *   () => this.loadNodes()
 * );
 * ```
 */
export function createPaginationHandler(
  setPage: (page: number) => void,
  loadFn: () => void
): (page: number) => void {
  return (page: number) => {
    setPage(page);
    loadFn();
  };
}

/**
 * Creates a reusable filter change handler with debouncing and page reset
 *
 * @param debounce - Debounce function to delay execution
 * @param resetPage - Function to reset page to 1
 * @param loadFn - Function to reload data with new filters
 * @returns Function that handles filter changes
 *
 * @example
 * ```typescript
 * private searchDebounce = createDebounce();
 *
 * onFilterChange = createFilterHandler(
 *   this.searchDebounce,
 *   () => this.currentPage = 1,
 *   () => this.loadNodes()
 * );
 * ```
 */
export function createFilterHandler(
  debounce: (fn: () => void, delay: number) => void,
  resetPage: () => void,
  loadFn: () => void
): () => void {
  return () => {
    debounce(() => {
      resetPage();
      loadFn();
    }, 300);
  };
}
