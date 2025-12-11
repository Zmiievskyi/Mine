import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { HlmButton } from '@spartan-ng/helm/button';

/**
 * Reusable pagination component for tables with Spartan UI styling.
 *
 * Displays current page range and navigation buttons.
 * Emits page change events for parent component to handle data fetching.
 *
 * @example
 * ```html
 * <app-pagination
 *   [meta]="paginationMeta()"
 *   entityName="users"
 *   (pageChange)="onPageChange($event)"
 * />
 * ```
 */
@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [HlmButton],
  template: `
    @if (meta()) {
      <div class="px-4 py-3 border-t border-[var(--gcore-border)] flex items-center justify-between">
        <p class="text-sm text-[var(--gcore-text-muted)]">
          Showing {{ startItem() }} to {{ endItem() }} of {{ meta()!.total }} {{ entityName() }}
        </p>
        <div class="flex gap-2">
          <button
            hlmBtn
            variant="outline"
            size="sm"
            (click)="previousPage()"
            [disabled]="meta()!.page <= 1">
            Previous
          </button>
          <button
            hlmBtn
            variant="outline"
            size="sm"
            (click)="nextPage()"
            [disabled]="meta()!.page >= meta()!.totalPages">
            Next
          </button>
        </div>
      </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaginationComponent {
  // Inputs
  public readonly meta = input<{ page: number; limit: number; total: number; totalPages: number } | null>(null);
  public readonly entityName = input<string>('items');

  // Outputs
  public readonly pageChange = output<number>();

  // Computed properties
  protected readonly startItem = computed(() => {
    const m = this.meta();
    return m ? (m.page - 1) * m.limit + 1 : 0;
  });

  protected readonly endItem = computed(() => {
    const m = this.meta();
    return m ? Math.min(m.page * m.limit, m.total) : 0;
  });

  // Methods
  protected previousPage(): void {
    const m = this.meta();
    if (m && m.page > 1) {
      this.pageChange.emit(m.page - 1);
    }
  }

  protected nextPage(): void {
    const m = this.meta();
    if (m && m.page < m.totalPages) {
      this.pageChange.emit(m.page + 1);
    }
  }
}
