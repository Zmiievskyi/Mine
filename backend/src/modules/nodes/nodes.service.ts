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

// Full Hyperfusion API response (includes epoch data)
export interface HyperfusionResponse {
  epoch_id: number;
  height: number;
  current_block_height: number;
  current_block_timestamp: string;
  avg_block_time: number;
  next_poc_start_block: number;
  set_new_validators_block: number;
  is_current: boolean;
  cached_at: string;
  total_assigned_rewards_gnk: number | null;
  participants: HyperfusionParticipant[];
  ml_nodes?: HyperfusionNode[];
}

export interface HyperfusionParticipant {
  index: string;
  address: string;
  weight: number;
  models: string[];
  is_jailed: boolean;
  node_healthy: boolean;
  missed_rate: number;
  invalidation_rate: number;
}

// Public network stats for landing page
export interface NetworkStats {
  currentEpoch: number;
  currentBlock: number;
  totalParticipants: number;
  healthyParticipants: number;
  catchingUp: number;
  registeredModels: number;
  uniqueModels: string[];
  timeToNextEpoch: {
    hours: number;
    minutes: number;
    seconds: number;
    totalSeconds: number;
  };
  avgBlockTime: number;
  lastUpdated: Date;
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

  // Public network stats for landing page (no auth required)
  async getPublicNetworkStats(): Promise<NetworkStats> {
    const data = await this.fetchHyperfusionFullData();

    // Count healthy vs catching up (jailed + offline)
    const healthyParticipants = data.participants.filter(
      (p) => p.node_healthy && !p.is_jailed,
    ).length;
    const catchingUp = data.participants.length - healthyParticipants;

    // Get unique models across all participants
    const allModels = data.participants.flatMap((p) => p.models);
    const uniqueModels = [...new Set(allModels)];

    // Calculate time to next epoch
    const blocksRemaining = data.next_poc_start_block - data.current_block_height;
    const totalSeconds = Math.max(0, blocksRemaining * data.avg_block_time);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);

    return {
      currentEpoch: data.epoch_id,
      currentBlock: data.current_block_height,
      totalParticipants: data.participants.length,
      healthyParticipants,
      catchingUp,
      registeredModels: uniqueModels.length,
      uniqueModels,
      timeToNextEpoch: { hours, minutes, seconds, totalSeconds },
      avgBlockTime: data.avg_block_time,
      lastUpdated: new Date(),
    };
  }

  // Fetch full Hyperfusion response (includes epoch data)
  private async fetchHyperfusionFullData(): Promise<HyperfusionResponse> {
    const cacheKey = 'hyperfusion_full';
    const cached = this.cache.get(cacheKey) as unknown as HyperfusionResponse;
    if (cached) {
      return cached;
    }

    try {
      const url = this.configService.get<string>('gonka.hyperfusionUrl');
      const timeout = this.configService.get<number>('retry.maxDelayMs') ?? 10000;

      const response = await withRetry(
        async () => {
          const res = await axios.get<HyperfusionResponse>(
            `${url}/api/v1/inference/current`,
            { timeout },
          );
          return res;
        },
        {
          maxRetries: this.configService.get<number>('retry.maxRetries') ?? 3,
          baseDelayMs: this.configService.get<number>('retry.baseDelayMs') ?? 1000,
          maxDelayMs: this.configService.get<number>('retry.maxDelayMs') ?? 5000,
        },
        this.logger,
        'Hyperfusion API full fetch',
      );

      const data = response.data;
      this.cache.set(cacheKey, data as unknown as HyperfusionNode[]);
      return data;
    } catch (error) {
      this.logger.error('Failed to fetch Hyperfusion full data', error);
      const stale = this.cache.getStale(cacheKey) as unknown as HyperfusionResponse;
      if (stale) {
        this.logger.warn('Returning stale full cache data');
        return stale;
      }
      // Return empty response structure
      return {
        epoch_id: 0,
        height: 0,
        current_block_height: 0,
        current_block_timestamp: new Date().toISOString(),
        avg_block_time: 6,
        next_poc_start_block: 0,
        set_new_validators_block: 0,
        is_current: false,
        cached_at: new Date().toISOString(),
        total_assigned_rewards_gnk: null,
        participants: [],
      };
    }
  }
}
