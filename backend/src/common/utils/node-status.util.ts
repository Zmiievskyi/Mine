/**
 * Shared utility for determining node status from Hyperfusion data
 */

export interface NodeStatusData {
  is_offline?: boolean;
  is_jailed?: boolean;
}

export type NodeStatusType = 'healthy' | 'jailed' | 'offline' | 'unknown';

/**
 * Determines node status based on Hyperfusion node data
 * @param stats - Node stats from Hyperfusion API (optional)
 * @returns Node status: 'healthy', 'jailed', 'offline', or 'unknown'
 */
export function getNodeStatus(stats?: NodeStatusData): NodeStatusType {
  if (!stats) return 'unknown';
  if (stats.is_offline) return 'offline';
  if (stats.is_jailed) return 'jailed';
  return 'healthy';
}
