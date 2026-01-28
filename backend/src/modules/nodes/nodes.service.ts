import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import axios from 'axios';
import { UserNode } from '../users/entities/user-node.entity';
import { withRetry, getNodeStatus } from '../../common/utils';
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
  ml_nodes_map?: Record<string, number>; // GPU node ID -> weight
}

// Chain RPC status response from node4.gonka.ai
export interface ChainStatusResponse {
  jsonrpc: string;
  id: number;
  result: {
    sync_info: {
      latest_block_height: string;
      latest_block_time: string;
      catching_up: boolean;
    };
  };
}

// Node4 participants endpoint response
export interface Node4ParticipantsResponse {
  active_participants: {
    participants: Array<{
      index: string; // Gonka address (string, not number)
      validator_key: string;
      weight: number;
      inference_url: string;
      models: string[];
      seed: {
        participant: string;
        epoch_index: number;
        signature: string;
      };
      ml_nodes: Array<{
        ml_nodes: Array<{
          node_id: string;
          poc_weight: number;
          timeslot_allocation: boolean[];
        }>;
      }>;
    }>;
  };
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
  // New metrics
  totalGpus: number;
  networkStatus: 'live' | 'syncing' | 'stale' | 'unknown';
  blockAge: number; // seconds since last block
}

export interface NodeWithStats extends UserNode {
  stats?: HyperfusionNode;
  status: 'healthy' | 'jailed' | 'offline' | 'unknown';
}

@Injectable()
export class NodesService {
  private readonly logger = new Logger(NodesService.name);
  private readonly nodeCache: LruCache<HyperfusionNode[]>;
  private readonly fullCache: LruCache<HyperfusionResponse>;
  private readonly chainStatusCache: LruCache<ChainStatusResponse>;
  private readonly node4ParticipantsCache: LruCache<Node4ParticipantsResponse>;
  private readonly NODES_CACHE_KEY = 'hyperfusion_nodes';
  private readonly FULL_CACHE_KEY = 'hyperfusion_full';
  private readonly CHAIN_STATUS_KEY = 'chain_status';
  private readonly NODE4_PARTICIPANTS_KEY = 'node4_participants';

  constructor(
    private configService: ConfigService,
    @InjectRepository(UserNode)
    private userNodeRepository: Repository<UserNode>,
  ) {
    const cacheTtl = this.configService.get<number>('gonka.cacheTtlSeconds') ?? 120;
    this.nodeCache = new LruCache<HyperfusionNode[]>(10, cacheTtl);
    this.fullCache = new LruCache<HyperfusionResponse>(10, cacheTtl);
    // Chain status has shorter TTL (20 seconds) for fresher data
    this.chainStatusCache = new LruCache<ChainStatusResponse>(5, 20);
    // Node4 participants cache with same TTL as other data
    this.node4ParticipantsCache = new LruCache<Node4ParticipantsResponse>(
      10,
      cacheTtl,
    );
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
        status: getNodeStatus(stats),
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
      status: getNodeStatus(stats),
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
    const cached = this.nodeCache.get(this.NODES_CACHE_KEY);
    if (cached) {
      return cached;
    }

    // Reuse full data fetch to avoid duplicate API calls
    const fullData = await this.fetchHyperfusionFullData();
    const nodes = fullData.ml_nodes || [];
    this.nodeCache.set(this.NODES_CACHE_KEY, nodes);
    return nodes;
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

  // Get all Hyperfusion nodes (for admin panel)
  async getAllHyperfusionNodes(): Promise<HyperfusionNode[]> {
    return this.fetchHyperfusionData();
  }

  // Public network stats for landing page (no auth required)
  async getPublicNetworkStats(): Promise<NetworkStats> {
    // Fetch all data sources in parallel with resilience
    const [node4Result, chainResult, hyperfusionResult] = await Promise.allSettled([
      this.fetchNode4Participants(),
      this.fetchChainStatus(),
      this.fetchHyperfusionFullData(),
    ]);

    const node4Data = node4Result.status === 'fulfilled' ? node4Result.value : null;
    const chainStatus = chainResult.status === 'fulfilled' ? chainResult.value : null;
    const hyperfusionData = hyperfusionResult.status === 'fulfilled' ? hyperfusionResult.value : null;

    // If node4 data is available, use it as PRIMARY source
    if (node4Data?.active_participants?.participants) {
      const participants = node4Data.active_participants.participants;

      // PRIMARY data from node4
      const epochId =
        participants.length > 0
          ? participants[0].seed.epoch_index
          : hyperfusionData?.epoch_id ?? 0;
      const totalParticipants = participants.length;

      // Count total GPUs from nested ml_nodes structure
      const totalGpus = participants.reduce((sum, p) => {
        return (
          sum +
          p.ml_nodes.reduce((gpuSum, mlNodeGroup) => {
            return gpuSum + mlNodeGroup.ml_nodes.length;
          }, 0)
        );
      }, 0);

      // Get unique models across all participants
      const allModels = participants.flatMap((p) => p.models);
      const uniqueModels = [...new Set(allModels)];

      // Calculate block age and network status
      const { blockAge, networkStatus } = this.calculateNetworkStatus(chainStatus);

      // SUPPLEMENTARY data from Hyperfusion
      let healthyParticipants = 0;
      let catchingUp = totalParticipants;
      let timeToNextEpoch = { hours: 0, minutes: 0, seconds: 0, totalSeconds: 0 };
      let avgBlockTime = 6; // default
      let currentBlock = 0;

      if (hyperfusionData?.participants) {
        // Count healthy participants from Hyperfusion
        healthyParticipants = hyperfusionData.participants.filter(
          (p) => p.node_healthy && !p.is_jailed,
        ).length;
        catchingUp = Math.max(0, totalParticipants - healthyParticipants);

        // Calculate time to next epoch from Hyperfusion
        const blocksRemaining =
          hyperfusionData.next_poc_start_block -
          hyperfusionData.current_block_height;
        const totalSeconds = Math.max(
          0,
          blocksRemaining * hyperfusionData.avg_block_time,
        );
        timeToNextEpoch = {
          hours: Math.floor(totalSeconds / 3600),
          minutes: Math.floor((totalSeconds % 3600) / 60),
          seconds: Math.floor(totalSeconds % 60),
          totalSeconds,
        };
        avgBlockTime = hyperfusionData.avg_block_time;
        currentBlock = hyperfusionData.current_block_height;
      } else {
        this.logger.warn('Hyperfusion data unavailable, using node4 data only');
      }

      return {
        currentEpoch: epochId,
        currentBlock,
        totalParticipants,
        healthyParticipants,
        catchingUp,
        registeredModels: uniqueModels.length,
        uniqueModels,
        timeToNextEpoch,
        avgBlockTime,
        lastUpdated: new Date(),
        totalGpus,
        networkStatus,
        blockAge,
      };
    }

    // FALLBACK: If node4 fails, use Hyperfusion data (previous behavior)
    this.logger.warn('Node4 data unavailable, falling back to Hyperfusion only');

    if (!hyperfusionData) {
      this.logger.error('Both node4 and Hyperfusion data unavailable');
      return this.getEmptyNetworkStats();
    }

    const data = hyperfusionData;

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

    // Calculate total GPUs from ml_nodes_map
    const totalGpus = data.participants.reduce((sum, p) => {
      if (p.ml_nodes_map) {
        return sum + Object.keys(p.ml_nodes_map).length;
      }
      return sum;
    }, 0);

    // Calculate block age and network status
    const { blockAge, networkStatus } = this.calculateNetworkStatus(chainStatus);

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
      totalGpus,
      networkStatus,
      blockAge,
    };
  }

  // Fetch chain status from node4.gonka.ai
  private async fetchChainStatus(): Promise<ChainStatusResponse | null> {
    const cached = this.chainStatusCache.get(this.CHAIN_STATUS_KEY);
    if (cached) {
      return cached;
    }

    try {
      const chainRpcUrl =
        this.configService.get<string>('gonka.chainRpcUrl') ??
        'https://node4.gonka.ai/chain-rpc/status';
      const { data } = await axios.get<ChainStatusResponse>(chainRpcUrl, {
        timeout: 8000,
      });
      this.chainStatusCache.set(this.CHAIN_STATUS_KEY, data);
      return data;
    } catch (error) {
      this.logger.warn('Failed to fetch chain status', error);
      return this.chainStatusCache.getStale(this.CHAIN_STATUS_KEY) || null;
    }
  }

  // Fetch participants data from node4.gonka.ai
  private async fetchNode4Participants(): Promise<Node4ParticipantsResponse | null> {
    const cached = this.node4ParticipantsCache.get(this.NODE4_PARTICIPANTS_KEY);
    if (cached) {
      return cached;
    }

    try {
      const url =
        this.configService.get<string>('gonka.node4ParticipantsUrl') ??
        'https://node4.gonka.ai/v1/epochs/current/participants';

      const response = await withRetry(
        async () => {
          const res = await axios.get<Node4ParticipantsResponse>(url, {
            timeout: 8000,
          });
          return res;
        },
        {
          maxRetries: this.configService.get<number>('retry.maxRetries') ?? 3,
          baseDelayMs: this.configService.get<number>('retry.baseDelayMs') ?? 1000,
          maxDelayMs: this.configService.get<number>('retry.maxDelayMs') ?? 5000,
        },
        this.logger,
        'Node4 participants fetch',
      );

      const data = response.data;
      this.node4ParticipantsCache.set(this.NODE4_PARTICIPANTS_KEY, data);
      return data;
    } catch (error) {
      this.logger.warn('Failed to fetch node4 participants data', error);
      return this.node4ParticipantsCache.getStale(this.NODE4_PARTICIPANTS_KEY) || null;
    }
  }

  // Calculate network status based on chain status
  private calculateNetworkStatus(
    chainStatus: ChainStatusResponse | null,
  ): { blockAge: number; networkStatus: 'live' | 'syncing' | 'stale' | 'unknown' } {
    if (!chainStatus?.result?.sync_info) {
      return { blockAge: 0, networkStatus: 'unknown' };
    }

    const syncInfo = chainStatus.result.sync_info;
    const latestBlockTime = new Date(syncInfo.latest_block_time);

    // Validate date is valid
    if (isNaN(latestBlockTime.getTime())) {
      this.logger.warn(
        `Invalid latest_block_time: ${syncInfo.latest_block_time}`,
      );
      return { blockAge: 0, networkStatus: 'unknown' };
    }

    const now = new Date();
    const blockAge = Math.floor((now.getTime() - latestBlockTime.getTime()) / 1000);

    const freshBlockAgeSeconds =
      this.configService.get<number>('gonka.freshBlockAgeSeconds') ?? 120;

    let networkStatus: 'live' | 'syncing' | 'stale' | 'unknown';
    if (syncInfo.catching_up) {
      networkStatus = 'syncing';
    } else if (blockAge <= freshBlockAgeSeconds) {
      networkStatus = 'live';
    } else {
      networkStatus = 'stale';
    }

    return { blockAge: Math.max(0, blockAge), networkStatus };
  }

  // Fetch full Hyperfusion response (includes epoch data)
  private async fetchHyperfusionFullData(): Promise<HyperfusionResponse> {
    const cached = this.fullCache.get(this.FULL_CACHE_KEY);
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
        'Hyperfusion API fetch',
      );

      const data = response.data;
      this.fullCache.set(this.FULL_CACHE_KEY, data);
      return data;
    } catch (error) {
      this.logger.error('Failed to fetch Hyperfusion data', error);
      const stale = this.fullCache.getStale(this.FULL_CACHE_KEY);
      if (stale) {
        this.logger.warn('Returning stale cache data');
        return stale;
      }
      return this.getEmptyResponse();
    }
  }

  private getEmptyResponse(): HyperfusionResponse {
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

  private getEmptyNetworkStats(): NetworkStats {
    return {
      currentEpoch: 0,
      currentBlock: 0,
      totalParticipants: 0,
      healthyParticipants: 0,
      catchingUp: 0,
      registeredModels: 0,
      uniqueModels: [],
      timeToNextEpoch: { hours: 0, minutes: 0, seconds: 0, totalSeconds: 0 },
      avgBlockTime: 6,
      lastUpdated: new Date(),
      totalGpus: 0,
      networkStatus: 'unknown',
      blockAge: 0,
    };
  }
}
