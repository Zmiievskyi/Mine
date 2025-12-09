/**
 * Shared utility functions for consistent status styling across the application
 */

/**
 * Returns CSS classes for node status badges
 * @param status - Node status (healthy, unhealthy, jailed, offline)
 * @returns Tailwind CSS classes for background and text color
 */
export function getNodeStatusClass(status: string): string {
  const classes: Record<string, string> = {
    healthy: 'bg-green-100 text-green-800',
    unhealthy: 'bg-yellow-100 text-yellow-800',
    jailed: 'bg-red-100 text-red-800',
    offline: 'bg-gray-100 text-gray-800',
  };
  return classes[status?.toLowerCase()] || classes['offline'];
}

/**
 * Returns CSS classes for node status text (text color only)
 * @param status - Node status (healthy, unhealthy, jailed, offline)
 * @returns Tailwind CSS classes for text color
 */
export function getNodeStatusTextClass(status: string): string {
  const classes: Record<string, string> = {
    healthy: 'text-green-600',
    unhealthy: 'text-yellow-600',
    jailed: 'text-red-600',
    offline: 'text-gray-600',
  };
  return classes[status?.toLowerCase()] || classes['offline'];
}

/**
 * Returns CSS classes for request status badges
 * @param status - Request status (pending, approved, rejected, completed)
 * @returns Tailwind CSS classes for background and text color
 */
export function getRequestStatusClass(status: string): string {
  const classes: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-blue-100 text-blue-800',
    rejected: 'bg-red-100 text-red-800',
    completed: 'bg-green-100 text-green-800',
  };
  return classes[status?.toLowerCase()] || 'bg-gray-100 text-gray-800';
}
