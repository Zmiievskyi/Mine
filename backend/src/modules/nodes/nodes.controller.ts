import {
  Controller,
  Get,
  Param,
  UseGuards,
  Request,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { NodesService, NodeWithStats, NetworkStats } from './nodes.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

// Frontend-compatible response interfaces
interface NodeResponse {
  id: string;
  address: string;
  alias?: string;
  gpuType: string;
  status: 'healthy' | 'unhealthy' | 'jailed' | 'offline';
  isJailed: boolean;
  earnedCoins: number;
  tokensPerSecond: number;
  jobsCompleted: number;
  uptimePercent: number;
  currentModel?: string;
  lastSeen: Date;
  // Additional metrics for nodes list display
  missedRate?: number;
  invalidationRate?: number;
  weight?: number;
}

interface NodeDetailResponse extends NodeResponse {
  models: string[];
  inferenceCount: number;
  missedCount: number;
  missedRate: number;
  invalidationRate: number;
  blocksClaimed: number;
  weight: number;
  isBlacklisted: boolean;
  inferenceUrl?: string;
}

interface DashboardResponse {
  stats: {
    totalNodes: number;
    healthyNodes: number;
    totalEarnings: number;
    averageUptime: number;
  };
  nodes: NodeResponse[];
  recentActivity: Array<{
    id: string;
    type: 'earnings' | 'status_change' | 'job_completed';
    nodeId: string;
    message: string;
    timestamp: Date;
  }>;
}

@ApiTags('nodes')
@Controller('nodes')
export class NodesController {
  constructor(private nodesService: NodesService) {}

  // PUBLIC ENDPOINT - No auth required
  @Get('public/stats')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Get public network statistics (no auth required)' })
  @ApiResponse({ status: 200, description: 'Network-wide statistics for landing page' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async getPublicNetworkStats(): Promise<NetworkStats> {
    return this.nodesService.getPublicNetworkStats();
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get all nodes for current user' })
  @ApiResponse({ status: 200, description: 'List of user nodes with stats' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUserNodes(@Request() req): Promise<NodeResponse[]> {
    const nodes = await this.nodesService.getUserNodes(req.user.id);
    return nodes.map((node) => this.transformNode(node));
  }

  @Get('dashboard')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get dashboard statistics' })
  @ApiResponse({ status: 200, description: 'Dashboard stats with node overview' })
  async getDashboardStats(@Request() req): Promise<DashboardResponse> {
    const data = await this.nodesService.getDashboardStats(req.user.id);
    const transformedNodes = data.nodes.map((node) => this.transformNode(node));

    return {
      stats: {
        totalNodes: data.totalNodes,
        healthyNodes: data.activeNodes,
        totalEarnings: parseFloat(data.totalEarnings),
        averageUptime: this.calculateAverageUptime(transformedNodes),
      },
      nodes: transformedNodes,
      recentActivity: [], // TODO: Implement activity tracking
    };
  }

  @Get(':address')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get node details by address' })
  @ApiParam({ name: 'address', description: 'Gonka node address' })
  @ApiResponse({ status: 200, description: 'Node details with full stats' })
  @ApiResponse({ status: 404, description: 'Node not found' })
  async getNodeByAddress(
    @Request() req,
    @Param('address') address: string,
  ): Promise<NodeDetailResponse> {
    const node = await this.nodesService.getNodeByAddress(req.user.id, address);
    if (!node) {
      throw new NotFoundException('Node not found or access denied');
    }
    return this.transformNodeDetail(node);
  }

  private transformNode(node: NodeWithStats): NodeResponse {
    const stats = node.stats;
    const inferenceRate = stats?.inference_rate
      ? parseFloat(stats.inference_rate)
      : 0;

    return {
      id: node.id,
      address: node.nodeAddress,
      alias: node.label || undefined,
      gpuType: node.gpuType || 'Unknown',
      status: node.status === 'unknown' ? 'offline' : node.status,
      isJailed: stats?.is_jailed || false,
      earnedCoins: stats?.earned_coins ? parseFloat(stats.earned_coins) : 0,
      tokensPerSecond: inferenceRate,
      jobsCompleted: stats?.inference_count || 0,
      uptimePercent: this.calculateUptimePercent(stats),
      currentModel: stats?.models?.[0] || undefined,
      lastSeen: node.updatedAt,
      // Additional metrics
      missedRate: stats?.missed_rate ?? 0,
      invalidationRate: stats?.invalidation_rate ?? 0,
      weight: stats?.weight ?? 0,
    };
  }

  private transformNodeDetail(node: NodeWithStats): NodeDetailResponse {
    const baseNode = this.transformNode(node);
    const stats = node.stats;

    return {
      ...baseNode,
      models: stats?.models || [],
      inferenceCount: stats?.inference_count || 0,
      missedCount: stats?.missed_count || 0,
      missedRate: stats?.missed_rate || 0,
      invalidationRate: stats?.invalidation_rate || 0,
      blocksClaimed: stats?.blocks_claimed || 0,
      weight: stats?.weight || 0,
      isBlacklisted: stats?.is_blacklisted || false,
      inferenceUrl: node.nodeAddress
        ? `https://api.gonka.ai/v1/inference/${node.nodeAddress}`
        : undefined,
    };
  }

  private calculateUptimePercent(stats?: NodeWithStats['stats']): number {
    if (!stats) return 0;
    if (stats.is_offline) return 0;
    // Calculate uptime based on missed_rate (0.0-1.0 scale)
    // A missed_rate of 0.1 means 10% missed, so 90% uptime
    const missedRate = stats.missed_rate ?? 0;
    return Math.max(0, Math.round((1 - missedRate) * 100));
  }

  private calculateAverageUptime(nodes: NodeResponse[]): number {
    if (nodes.length === 0) return 0;
    const total = nodes.reduce((sum, node) => sum + node.uptimePercent, 0);
    return Math.round(total / nodes.length);
  }
}
