/**
 * Utility functions for node status styling and formatting
 */

/**
 * Badge variant type for Spartan UI hlmBadge directive
 */
export type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline';

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

/**
 * Gets a human-readable description for a node status
 * @param status The node status (accepts both string and specific types)
 * @returns A description of what the status means
 */
export function getNodeStatusDescription(status: string): string {
  switch (status?.toLowerCase()) {
    case 'healthy':
      return 'Node is operating normally and earning rewards';
    case 'unhealthy':
      return 'Node is experiencing issues but still operational';
    case 'jailed':
      return 'Node is temporarily suspended due to performance issues';
    case 'offline':
      return 'Node is not responding or disconnected';
    default:
      return 'Node status is unknown';
  }
}

/**
 * Determines if a node status is considered problematic
 * @param status The node status (accepts both string and specific types)
 * @returns True if status requires attention
 */
export function isProblematicStatus(status: string): boolean {
  const lowerStatus = status?.toLowerCase();
  return lowerStatus === 'unhealthy' || lowerStatus === 'jailed' || lowerStatus === 'offline';
}
