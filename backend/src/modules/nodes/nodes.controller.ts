import {
  Controller,
  Get,
  Param,
  UseGuards,
  Request,
  NotFoundException,
} from '@nestjs/common';
import { NodesService, NodeWithStats } from './nodes.service';
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

@Controller('nodes')
@UseGuards(JwtAuthGuard)
export class NodesController {
  constructor(private nodesService: NodesService) {}

  @Get()
  async getUserNodes(@Request() req): Promise<NodeResponse[]> {
    const nodes = await this.nodesService.getUserNodes(req.user.id);
    return nodes.map((node) => this.transformNode(node));
  }

  @Get('dashboard')
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
  async getNodeByAddress(
    @Request() req,
    @Param('address') address: string,
  ): Promise<NodeResponse> {
    const node = await this.nodesService.getNodeByAddress(req.user.id, address);
    if (!node) {
      throw new NotFoundException('Node not found or access denied');
    }
    return this.transformNode(node);
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
    };
  }

  private calculateUptimePercent(stats?: NodeWithStats['stats']): number {
    if (!stats) return 0;
    if (stats.is_offline) return 0;
    if (stats.is_jailed) return 50;
    return 100;
  }

  private calculateAverageUptime(nodes: NodeResponse[]): number {
    if (nodes.length === 0) return 0;
    const total = nodes.reduce((sum, node) => sum + node.uptimePercent, 0);
    return Math.round(total / nodes.length);
  }
}
