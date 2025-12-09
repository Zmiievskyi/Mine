/**
 * Utility functions for node status styling and formatting
 */

import { BadgeVariant } from '../types/badge.types';

/**
 * Maps node status to Spartan UI badge variant
 * Used for consistent status badge styling across components
 *
 * @param status The node status (accepts both string and specific types)
 * @returns The corresponding badge variant
 *
 * @example
 * ```html
 * <span hlmBadge [variant]="getNodeStatusVariant(node.status)">
 *   {{ node.status }}
 * </span>
 * ```
 */
export function getNodeStatusVariant(status: string): BadgeVariant {
  switch (status?.toLowerCase()) {
    case 'healthy':
      return 'default';
    case 'unhealthy':
    case 'jailed':
      return 'secondary';
    case 'offline':
      return 'destructive';
    default:
      return 'outline';
  }
}

