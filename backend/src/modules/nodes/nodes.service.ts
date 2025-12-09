import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import axios from 'axios';
import { UserNode } from '../users/entities/user-node.entity';
import { withRetry } from '../../common/utils';
import { LruCache } from '../../common/services';

export interface HyperfusionNode {
  address: string;
  inference_count: number;
  inference_rate: string;
  is_jailed: boolean;
  is_offline: boolean;
  is_blacklisted: boolean;
  earned_coins: string;
  blocks_claimed: number;
  models: string[];
  missed_count?: number;
  missed_rate?: number;
  invalidation_rate?: number;
  weight?: number;
}

export interface NodeWithStats extends UserNode {
  stats?: HyperfusionNode;
  status: 'healthy' | 'jailed' | 'offline' | 'unknown';
}

@Injectable()
export class NodesService {
  private readonly logger = new Logger(NodesService.name);
  private readonly cache: LruCache<HyperfusionNode[]>;
  private readonly cacheKey = 'hyperfusion_nodes';

  constructor(
    private configService: ConfigService,
    @InjectRepository(UserNode)
    private userNodeRepository: Repository<UserNode>,
  ) {
    const cacheTtl = this.configService.get<number>('gonka.cacheTtlSeconds') ?? 120;
    this.cache = new LruCache<HyperfusionNode[]>(10, cacheTtl);
  }

  async getUserNodes(userId: string): Promise<NodeWithStats[]> {
    const userNodes = await this.userNodeRepository.find({
      where: { userId, isActive: true },
    });

    if (userNodes.length === 0) {
      return [];
    }

    const allStats = await this.fetchHyperfusionData();
    const statsMap = new Map(allStats.map((s) => [s.address, s]));

    return userNodes.map((node) => {
      const stats = statsMap.get(node.nodeAddress);
      return {
        ...node,
        stats,
        status: this.getNodeStatus(stats),
      };
    });
  }

  async getNodeByAddress(
    userId: string,
    address: string,
  ): Promise<NodeWithStats | null> {
    const node = await this.userNodeRepository.findOne({
      where: { userId, nodeAddress: address, isActive: true },
    });

    if (!node) {
      return null;
    }

    const allStats = await this.fetchHyperfusionData();
    const stats = allStats.find((s) => s.address === address);

    return {
      ...node,
      stats,
      status: this.getNodeStatus(stats),
    };
  }

  async getDashboardStats(userId: string) {
    const nodes = await this.getUserNodes(userId);

    const totalNodes = nodes.length;
    const activeNodes = nodes.filter((n) => n.status === 'healthy').length;
    const totalEarnings = nodes.reduce((sum, n) => {
      return sum + parseFloat(n.stats?.earned_coins || '0');
    }, 0);
    const totalInferences = nodes.reduce((sum, n) => {
      return sum + (n.stats?.inference_count || 0);
    }, 0);

    return {
      totalNodes,
      activeNodes,
      totalEarnings: totalEarnings.toFixed(2),
      totalInferences,
      nodes: nodes.slice(0, 5), // Top 5 for dashboard preview
    };
  }

  private async fetchHyperfusionData(): Promise<HyperfusionNode[]> {
    const cached = this.cache.get(this.cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const url = this.configService.get<string>('gonka.hyperfusionUrl');
      const timeout = this.configService.get<number>('retry.maxDelayMs') ?? 10000;

      const response = await withRetry(
        async () => {
          const res = await axios.get(`${url}/api/v1/inference/current`, {
            timeout,
          });
          return res;
        },
        {
          maxRetries: this.configService.get<number>('retry.maxRetries') ?? 3,
          baseDelayMs: this.configService.get<number>('retry.baseDelayMs') ?? 1000,
          maxDelayMs: this.configService.get<number>('retry.maxDelayMs') ?? 5000,
        },
        this.logger,
        'Hyperfusion API fetch',
      );

      const data = response.data.ml_nodes || [];
      this.cache.set(this.cacheKey, data);
      return data;
    } catch (error) {
      this.logger.error('Failed to fetch Hyperfusion data after all retries', error);
      // Return stale cache if available (graceful degradation)
      const stale = this.cache.getStale(this.cacheKey);
      if (stale) {
        this.logger.warn('Returning stale cache data');
        return stale;
      }
      return [];
    }
  }

  private getNodeStatus(
    stats?: HyperfusionNode,
  ): 'healthy' | 'jailed' | 'offline' | 'unknown' {
    if (!stats) return 'unknown';
    if (stats.is_offline) return 'offline';
    if (stats.is_jailed) return 'jailed';
    return 'healthy';
  }

  // Admin methods for managing user nodes
  async assignNodeToUser(
    userId: string,
    nodeAddress: string,
    data: { label?: string; gpuType?: string; gcoreInstanceId?: string },
  ): Promise<UserNode> {
    const node = this.userNodeRepository.create({
      userId,
      nodeAddress,
      ...data,
    });
    return this.userNodeRepository.save(node);
  }

  async removeNodeFromUser(userId: string, nodeAddress: string): Promise<void> {
    await this.userNodeRepository.update(
      { userId, nodeAddress },
      { isActive: false },
    );
  }
}
