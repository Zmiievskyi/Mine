/**
 * Request Status Utilities
 *
 * Provides consistent styling for node request status badges.
 */

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline';

/**
 * Get Spartan UI badge variant for request status
 *
 * @param status - Request status string
 * @returns Badge variant for Spartan UI hlmBadge
 *
 * @example
 * ```html
 * <span hlmBadge [variant]="getRequestStatusVariant(request.status)">
 *   {{ request.status }}
 * </span>
 * ```
 */
export function getRequestStatusVariant(status: string): BadgeVariant {
  switch (status?.toLowerCase()) {
    case 'approved':
    case 'completed':
      return 'default';
    case 'pending':
      return 'secondary';
    case 'rejected':
    case 'cancelled':
      return 'destructive';
    default:
      return 'outline';
  }
}
