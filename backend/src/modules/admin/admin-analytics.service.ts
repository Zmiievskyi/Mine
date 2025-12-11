import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../users/entities/user.entity';
import { UserNode } from '../users/entities/user-node.entity';
import { NodeRequest, RequestStatus } from '../requests/entities/node-request.entity';
import { AdminAnalyticsDto } from './dto';
import { NodesService, HyperfusionNode } from '../nodes/nodes.service';
import { getNodeStatus } from '../../common/utils';

@Injectable()
export class AdminAnalyticsService {
  private readonly logger = new Logger(AdminAnalyticsService.name);

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(UserNode)
    private userNodesRepository: Repository<UserNode>,
    @InjectRepository(NodeRequest)
    private requestsRepository: Repository<NodeRequest>,
    private nodesService: NodesService,
  ) {}

  async getAnalytics(): Promise<AdminAnalyticsDto> {
    // Requests by status
    const [pending, approved, rejected, completed] = await Promise.all([
      this.requestsRepository.count({ where: { status: RequestStatus.PENDING } }),
      this.requestsRepository.count({ where: { status: RequestStatus.APPROVED } }),
      this.requestsRepository.count({ where: { status: RequestStatus.REJECTED } }),
      this.requestsRepository.count({ where: { status: RequestStatus.COMPLETED } }),
    ]);

    // Requests by GPU type
    const requestsByGpuRaw = await this.requestsRepository
      .createQueryBuilder('request')
      .select('request.gpuType', 'gpuType')
      .addSelect('COUNT(*)', 'count')
      .groupBy('request.gpuType')
      .getRawMany();
    const requestsByGpu = requestsByGpuRaw.map((r) => ({
      gpuType: r.gpuType,
      count: parseInt(r.count, 10),
    }));

    // User stats
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const [totalUsers, activeUsers, adminUsers, newUsersThisWeek] = await Promise.all([
      this.usersRepository.count(),
      this.usersRepository.count({ where: { isActive: true } }),
      this.usersRepository.count({ where: { role: UserRole.ADMIN } }),
      this.usersRepository
        .createQueryBuilder('user')
        .where('user.createdAt >= :oneWeekAgo', { oneWeekAgo })
        .getCount(),
    ]);

    // Nodes by GPU - with live stats
    const allNodes = await this.userNodesRepository.find({ where: { isActive: true } });
    const allHyperfusionNodes = await this.fetchAllHyperfusionNodes();
    const statsMap = new Map(allHyperfusionNodes.map((s) => [s.address, s]));

    const gpuStats = new Map<string, { count: number; healthy: number; jailed: number; offline: number }>();
    for (const node of allNodes) {
      const gpuType = node.gpuType || 'Unknown';
      const stats = statsMap.get(node.nodeAddress);
      const status = getNodeStatus(stats);

      if (!gpuStats.has(gpuType)) {
        gpuStats.set(gpuType, { count: 0, healthy: 0, jailed: 0, offline: 0 });
      }
      const gpu = gpuStats.get(gpuType)!;
      gpu.count++;
      if (status === 'healthy') gpu.healthy++;
      else if (status === 'jailed') gpu.jailed++;
      else if (status === 'offline') gpu.offline++;
    }

    const nodesByGpu = Array.from(gpuStats.entries()).map(([gpuType, stats]) => ({
      gpuType,
      count: stats.count,
      healthyCount: stats.healthy,
      jailedCount: stats.jailed,
      offlineCount: stats.offline,
    }));

    // Top users by node count
    const topByNodesRaw = await this.usersRepository
      .createQueryBuilder('user')
      .leftJoin('user.nodes', 'node', 'node.isActive = true')
      .select(['user.id', 'user.email', 'user.name'])
      .addSelect('COUNT(node.id)', 'nodeCount')
      .groupBy('user.id')
      .orderBy('nodeCount', 'DESC')
      .limit(10)
      .getRawMany();

    const topUsersByNodes = topByNodesRaw.map((r) => ({
      id: r.user_id,
      email: r.user_email,
      name: r.user_name,
      nodeCount: parseInt(r.nodeCount, 10),
    }));

    // Top users by earnings
    const userEarnings = new Map<string, { id: string; email: string; name?: string; earnings: number }>();
    const usersWithNodes = await this.usersRepository.find({
      where: { isActive: true },
      relations: ['nodes'],
    });

    for (const user of usersWithNodes) {
      let totalEarnings = 0;
      for (const node of user.nodes) {
        const stats = statsMap.get(node.nodeAddress);
        if (stats) {
          totalEarnings += parseFloat(stats.earned_coins);
        }
      }
      if (totalEarnings > 0) {
        userEarnings.set(user.id, {
          id: user.id,
          email: user.email || 'No email', // Telegram users may not have email
          name: user.name || undefined,
          earnings: totalEarnings,
        });
      }
    }

    const topUsersByEarnings = Array.from(userEarnings.values())
      .sort((a, b) => b.earnings - a.earnings)
      .slice(0, 10)
      .map((u) => ({
        id: u.id,
        email: u.email,
        name: u.name,
        totalEarnings: parseFloat(u.earnings.toFixed(2)),
      }));

    return {
      requestsByStatus: { pending, approved, rejected, completed },
      requestsByGpu,
      userStats: {
        total: totalUsers,
        active: activeUsers,
        admins: adminUsers,
        newThisWeek: newUsersThisWeek,
      },
      nodesByGpu,
      topUsersByNodes,
      topUsersByEarnings,
    };
  }

  async getNetworkHealthOverview() {
    const allNodes = await this.userNodesRepository.find({ where: { isActive: true } });
    const allHyperfusionNodes = await this.fetchAllHyperfusionNodes();
    const statsMap = new Map(allHyperfusionNodes.map((s) => [s.address, s]));

    let healthyNodes = 0;
    let jailedNodes = 0;
    let offlineNodes = 0;
    let unknownNodes = 0;
    let totalEarnings = 0;

    for (const node of allNodes) {
      const stats = statsMap.get(node.nodeAddress);
      const status = getNodeStatus(stats);

      switch (status) {
        case 'healthy': healthyNodes++; break;
        case 'jailed': jailedNodes++; break;
        case 'offline': offlineNodes++; break;
        default: unknownNodes++;
      }

      if (stats) {
        totalEarnings += parseFloat(stats.earned_coins);
      }
    }

    return {
      totalNodes: allNodes.length,
      healthyNodes,
      jailedNodes,
      offlineNodes,
      unknownNodes,
      totalEarnings: totalEarnings.toFixed(2),
    };
  }

  private async fetchAllHyperfusionNodes(): Promise<HyperfusionNode[]> {
    try {
      return await this.nodesService.getAllHyperfusionNodes();
    } catch {
      return [];
    }
  }
}
