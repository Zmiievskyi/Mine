import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import axios from 'axios';
import { NodesService, HyperfusionNode, NodeWithStats } from './nodes.service';
import { UserNode } from '../users/entities/user-node.entity';

jest.mock('axios');
jest.mock('../../common/utils', () => ({
  withRetry: jest.fn((fn) => fn()),
  getNodeStatus: jest.fn((stats) => {
    if (!stats || stats.status === 'unknown') return 'unknown';
    if (stats.is_jailed) return 'jailed';
    if (stats.is_offline) return 'offline';
    return 'healthy';
  }),
}));

describe('NodesService', () => {
  let service: NodesService;
  let userNodeRepository: jest.Mocked<Repository<UserNode>>;
  let configService: jest.Mocked<ConfigService>;

  const mockUserNode: UserNode = {
    id: 'node-123',
    userId: 'user-456',
    nodeAddress: 'gonka1abc123',
    label: 'Node 1',
    gpuType: 'RTX 4090',
    gcoreInstanceId: 'gcore-123',
    notes: 'Test node',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    user: undefined as unknown as import('../users/entities/user.entity').User,
  };

  const mockHyperfusionNode: HyperfusionNode = {
    address: 'gonka1abc123',
    inference_count: 1500,
    inference_rate: '5.2',
    is_jailed: false,
    is_offline: false,
    is_blacklisted: false,
    earned_coins: '125.50',
    blocks_claimed: 42,
    models: ['llama3', 'gpt-neo'],
    missed_count: 5,
    missed_rate: 0.03,
    invalidation_rate: 0.01,
    weight: 1.0,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NodesService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(UserNode),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<NodesService>(NodesService);
    userNodeRepository = module.get(getRepositoryToken(UserNode));
    configService = module.get(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserNodes', () => {
    it('should return nodes with stats merged from Hyperfusion', async () => {
      const userId = 'user-456';
      userNodeRepository.find.mockResolvedValue([mockUserNode]);
      configService.get.mockImplementation((key: string) => {
        if (key === 'gonka.cacheTtlSeconds') return 120;
        if (key === 'gonka.hyperfusionUrl') return 'https://tracker.gonka.hyperfusion.io';
        return null;
      });
      (axios.get as jest.Mock).mockResolvedValue({
        data: { ml_nodes: [mockHyperfusionNode] },
      });

      const result = await service.getUserNodes(userId);

      expect(userNodeRepository.find).toHaveBeenCalledWith({
        where: { userId, isActive: true },
      });
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        ...mockUserNode,
        stats: mockHyperfusionNode,
        status: 'healthy',
      });
    });

    it('should return empty array if user has no nodes', async () => {
      userNodeRepository.find.mockResolvedValue([]);

      const result = await service.getUserNodes('user-empty');

      expect(result).toEqual([]);
      expect(axios.get).not.toHaveBeenCalled();
    });

    it('should mark nodes as unknown if stats not found', async () => {
      const nodeWithoutStats = { ...mockUserNode, nodeAddress: 'gonka1xyz999' };
      userNodeRepository.find.mockResolvedValue([nodeWithoutStats]);
      configService.get.mockImplementation((key: string) => {
        if (key === 'gonka.cacheTtlSeconds') return 120;
        if (key === 'gonka.hyperfusionUrl') return 'https://tracker.gonka.hyperfusion.io';
        return null;
      });
      (axios.get as jest.Mock).mockResolvedValue({
        data: { ml_nodes: [mockHyperfusionNode] },
      });

      const result = await service.getUserNodes('user-456');

      expect(result[0].status).toBe('unknown');
      expect(result[0].stats).toBeUndefined();
    });

    it('should correctly identify jailed nodes', async () => {
      const jailedStats = { ...mockHyperfusionNode, is_jailed: true };
      userNodeRepository.find.mockResolvedValue([mockUserNode]);
      configService.get.mockReturnValue('https://tracker.gonka.hyperfusion.io');
      (axios.get as jest.Mock).mockResolvedValue({
        data: { ml_nodes: [jailedStats] },
      });

      const result = await service.getUserNodes('user-456');

      expect(result[0].status).toBe('jailed');
    });

    it('should correctly identify offline nodes', async () => {
      const offlineStats = { ...mockHyperfusionNode, is_offline: true };
      userNodeRepository.find.mockResolvedValue([mockUserNode]);
      configService.get.mockReturnValue('https://tracker.gonka.hyperfusion.io');
      (axios.get as jest.Mock).mockResolvedValue({
        data: { ml_nodes: [offlineStats] },
      });

      const result = await service.getUserNodes('user-456');

      expect(result[0].status).toBe('offline');
    });
  });

  describe('getNodeByAddress', () => {
    it('should return specific node with stats', async () => {
      userNodeRepository.findOne.mockResolvedValue(mockUserNode);
      configService.get.mockReturnValue('https://tracker.gonka.hyperfusion.io');
      (axios.get as jest.Mock).mockResolvedValue({
        data: { ml_nodes: [mockHyperfusionNode] },
      });

      const result = await service.getNodeByAddress('user-456', 'gonka1abc123');

      expect(userNodeRepository.findOne).toHaveBeenCalledWith({
        where: { userId: 'user-456', nodeAddress: 'gonka1abc123', isActive: true },
      });
      expect(result).toMatchObject({
        ...mockUserNode,
        stats: mockHyperfusionNode,
        status: 'healthy',
      });
    });

    it('should return null if node not found', async () => {
      userNodeRepository.findOne.mockResolvedValue(null);

      const result = await service.getNodeByAddress('user-456', 'invalid-address');

      expect(result).toBeNull();
      expect(axios.get).not.toHaveBeenCalled();
    });
  });

  describe('getDashboardStats', () => {
    it('should calculate dashboard statistics correctly', async () => {
      const hyperfusionNodes: HyperfusionNode[] = [
        { ...mockHyperfusionNode, address: 'gonka1abc123', earned_coins: '100.00', inference_count: 1500 },
        {
          ...mockHyperfusionNode,
          address: 'gonka1xyz456',
          earned_coins: '50.50',
          inference_count: 500,
          is_offline: false,
          is_jailed: false,
        },
        {
          ...mockHyperfusionNode,
          address: 'gonka1def789',
          earned_coins: '25.25',
          inference_count: 1500,
          is_offline: true,
          is_jailed: false,
        },
      ];

      const userNodes: UserNode[] = [
        { ...mockUserNode, nodeAddress: 'gonka1abc123' },
        { ...mockUserNode, id: 'node-456', nodeAddress: 'gonka1xyz456' },
        { ...mockUserNode, id: 'node-789', nodeAddress: 'gonka1def789' },
      ];

      userNodeRepository.find.mockResolvedValue(userNodes);
      configService.get.mockReturnValue('https://tracker.gonka.hyperfusion.io');
      (axios.get as jest.Mock).mockResolvedValue({
        data: {
          ml_nodes: hyperfusionNodes,
        },
      });

      const result = await service.getDashboardStats('user-456');

      expect(result.totalNodes).toBe(3);
      expect(result.activeNodes).toBe(2);
      expect(result.totalEarnings).toBe('175.75');
      expect(result.totalInferences).toBe(3500);
      expect(result.nodes).toHaveLength(3);
    });

    it('should return zeros if user has no nodes', async () => {
      userNodeRepository.find.mockResolvedValue([]);

      const result = await service.getDashboardStats('user-empty');

      expect(result.totalNodes).toBe(0);
      expect(result.activeNodes).toBe(0);
      expect(result.totalEarnings).toBe('0.00');
      expect(result.totalInferences).toBe(0);
      expect(result.nodes).toEqual([]);
    });

    it('should handle nodes without stats gracefully', async () => {
      const nodeWithoutStats: NodeWithStats = {
        ...mockUserNode,
        status: 'unknown',
      };
      userNodeRepository.find.mockResolvedValue([nodeWithoutStats]);
      configService.get.mockReturnValue('https://tracker.gonka.hyperfusion.io');
      (axios.get as jest.Mock).mockResolvedValue({
        data: { ml_nodes: [] },
      });

      const result = await service.getDashboardStats('user-456');

      expect(result.totalEarnings).toBe('0.00');
      expect(result.totalInferences).toBe(0);
    });
  });

  describe('assignNodeToUser', () => {
    it('should create and save a new node', async () => {
      const nodeData = {
        label: 'New Node',
        gpuType: 'H100',
        gcoreInstanceId: 'gcore-789',
      };
      const newNode = { ...mockUserNode, ...nodeData };

      userNodeRepository.create.mockReturnValue(newNode as any);
      userNodeRepository.save.mockResolvedValue(newNode);

      const result = await service.assignNodeToUser('user-456', 'gonka1new123', nodeData);

      expect(userNodeRepository.create).toHaveBeenCalledWith({
        userId: 'user-456',
        nodeAddress: 'gonka1new123',
        ...nodeData,
      });
      expect(userNodeRepository.save).toHaveBeenCalledWith(newNode);
      expect(result).toEqual(newNode);
    });
  });

  describe('removeNodeFromUser', () => {
    it('should mark node as inactive', async () => {
      userNodeRepository.update.mockResolvedValue({ affected: 1 } as any);

      await service.removeNodeFromUser('user-456', 'gonka1abc123');

      expect(userNodeRepository.update).toHaveBeenCalledWith(
        { userId: 'user-456', nodeAddress: 'gonka1abc123' },
        { isActive: false },
      );
    });
  });

  describe('getPublicNetworkStats', () => {
    beforeEach(async () => {
      // Clear all mocks and recreate service to clear internal caches
      jest.clearAllMocks();

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          NodesService,
          {
            provide: ConfigService,
            useValue: configService,
          },
          {
            provide: getRepositoryToken(UserNode),
            useValue: userNodeRepository,
          },
        ],
      }).compile();

      service = module.get<NodesService>(NodesService);
    });

    const mockNode4Response = {
      active_participants: {
        participants: [
          {
            index: 'gonka1abc123',
            validator_key: 'validator1',
            weight: 1.0,
            inference_url: 'http://example.com',
            models: ['llama3', 'gpt-neo'],
            seed: {
              participant: 'gonka1abc123',
              epoch_index: 42,
              signature: 'sig123',
            },
            ml_nodes: [
              {
                ml_nodes: [
                  {
                    node_id: 'gpu1',
                    poc_weight: 1.0,
                    timeslot_allocation: [true, false],
                  },
                  {
                    node_id: 'gpu2',
                    poc_weight: 1.0,
                    timeslot_allocation: [true, true],
                  },
                ],
              },
            ],
          },
          {
            index: 'gonka1xyz456',
            validator_key: 'validator2',
            weight: 1.0,
            inference_url: 'http://example2.com',
            models: ['stable-diffusion'],
            seed: {
              participant: 'gonka1xyz456',
              epoch_index: 42,
              signature: 'sig456',
            },
            ml_nodes: [
              {
                ml_nodes: [
                  {
                    node_id: 'gpu3',
                    poc_weight: 1.0,
                    timeslot_allocation: [true],
                  },
                ],
              },
            ],
          },
        ],
      },
    };

    const mockChainStatus = {
      jsonrpc: '2.0',
      id: 1,
      result: {
        sync_info: {
          latest_block_height: '1000',
          latest_block_time: new Date(Date.now() - 30000).toISOString(), // 30 seconds ago
          catching_up: false,
        },
      },
    };

    const mockHyperfusionResponse = {
      epoch_id: 42,
      height: 100,
      current_block_height: 1000,
      current_block_timestamp: new Date().toISOString(),
      avg_block_time: 6,
      next_poc_start_block: 1500,
      set_new_validators_block: 1400,
      is_current: true,
      cached_at: new Date().toISOString(),
      total_assigned_rewards_gnk: 1000,
      participants: [
        {
          index: 'gonka1abc123',
          address: 'gonka1abc123',
          weight: 1.0,
          models: ['llama3'],
          is_jailed: false,
          node_healthy: true,
          missed_rate: 0.01,
          invalidation_rate: 0.02,
          ml_nodes_map: { gpu1: 1.0, gpu2: 1.0 },
        },
        {
          index: 'gonka1xyz456',
          address: 'gonka1xyz456',
          weight: 1.0,
          models: ['gpt-neo'],
          is_jailed: false,
          node_healthy: false,
          missed_rate: 0.05,
          invalidation_rate: 0.03,
          ml_nodes_map: { gpu3: 1.0 },
        },
      ],
    };

    beforeEach(() => {
      configService.get.mockImplementation((key: string) => {
        if (key === 'gonka.cacheTtlSeconds') return 120;
        if (key === 'gonka.chainRpcUrl') return 'https://node4.gonka.ai/chain-rpc/status';
        if (key === 'gonka.node4ParticipantsUrl') return 'https://node4.gonka.ai/v1/epochs/current/participants';
        if (key === 'gonka.hyperfusionUrl') return 'https://tracker.gonka.hyperfusion.io';
        if (key === 'gonka.freshBlockAgeSeconds') return 120;
        if (key === 'retry.maxRetries') return 3;
        if (key === 'retry.baseDelayMs') return 1000;
        if (key === 'retry.maxDelayMs') return 5000;
        return null;
      });
    });

    it('should fetch from all sources and merge data correctly', async () => {
      (axios.get as jest.Mock)
        .mockResolvedValueOnce({ data: mockNode4Response }) // node4 participants
        .mockResolvedValueOnce({ data: mockChainStatus }) // chain status
        .mockResolvedValueOnce({ data: mockHyperfusionResponse }); // hyperfusion

      const result = await service.getPublicNetworkStats();

      expect(axios.get).toHaveBeenCalledTimes(3);
      expect(result.currentEpoch).toBe(42); // From node4
      expect(result.totalParticipants).toBe(2); // From node4
      expect(result.totalGpus).toBe(3); // From node4 (2 + 1 GPUs)
      expect(result.uniqueModels).toEqual(['llama3', 'gpt-neo', 'stable-diffusion']); // From node4
      expect(result.healthyParticipants).toBe(1); // From Hyperfusion
      expect(result.catchingUp).toBe(1); // From Hyperfusion (2 - 1)
      expect(result.networkStatus).toBe('live'); // From chain status
      expect(result.blockAge).toBeGreaterThan(0);
    });

    it('should handle node4 success with Hyperfusion failure gracefully', async () => {
      (axios.get as jest.Mock)
        .mockResolvedValueOnce({ data: mockNode4Response }) // node4 success
        .mockResolvedValueOnce({ data: mockChainStatus }) // chain status success
        .mockRejectedValueOnce(new Error('Hyperfusion API error')); // hyperfusion fails

      const result = await service.getPublicNetworkStats();

      expect(result.currentEpoch).toBe(42); // From node4
      expect(result.totalParticipants).toBe(2); // From node4
      expect(result.totalGpus).toBe(3); // From node4
      expect(result.uniqueModels).toEqual(['llama3', 'gpt-neo', 'stable-diffusion']); // From node4
      expect(result.healthyParticipants).toBe(0); // Hyperfusion data unavailable
      expect(result.catchingUp).toBe(2); // Falls back to totalParticipants
      expect(result.timeToNextEpoch.totalSeconds).toBe(0); // No epoch time data
    });

    it('should fallback to Hyperfusion when node4 fails', async () => {
      (axios.get as jest.Mock)
        .mockRejectedValueOnce(new Error('Node4 API error')) // node4 fails
        .mockResolvedValueOnce({ data: mockChainStatus }) // chain status
        .mockResolvedValueOnce({ data: mockHyperfusionResponse }); // hyperfusion success

      const result = await service.getPublicNetworkStats();

      expect(result.currentEpoch).toBe(42); // From Hyperfusion
      expect(result.totalParticipants).toBe(2); // From Hyperfusion
      expect(result.totalGpus).toBe(3); // From Hyperfusion ml_nodes_map
      expect(result.healthyParticipants).toBe(1); // From Hyperfusion
      expect(result.catchingUp).toBe(1); // From Hyperfusion
    });

    it('should return empty stats when all sources fail', async () => {
      (axios.get as jest.Mock)
        .mockRejectedValueOnce(new Error('Node4 error'))
        .mockRejectedValueOnce(new Error('Chain error'))
        .mockRejectedValueOnce(new Error('Hyperfusion error'));

      const result = await service.getPublicNetworkStats();

      expect(result.currentEpoch).toBe(0);
      expect(result.totalParticipants).toBe(0);
      expect(result.totalGpus).toBe(0);
      expect(result.healthyParticipants).toBe(0);
      expect(result.networkStatus).toBe('unknown');
    });

    it('should cache node4 participants data on subsequent calls', async () => {
      (axios.get as jest.Mock)
        .mockResolvedValueOnce({ data: mockNode4Response })
        .mockResolvedValueOnce({ data: mockChainStatus })
        .mockResolvedValueOnce({ data: mockHyperfusionResponse });

      // First call
      await service.getPublicNetworkStats();
      expect(axios.get).toHaveBeenCalledTimes(3);

      jest.clearAllMocks();

      // Second call - should use cache
      (axios.get as jest.Mock)
        .mockResolvedValueOnce({ data: mockChainStatus }) // Only chain status fetched (shorter TTL)
        .mockResolvedValueOnce({ data: mockHyperfusionResponse }); // Hyperfusion might be cached too

      await service.getPublicNetworkStats();

      // Should not call node4 again due to cache
      const node4Calls = (axios.get as jest.Mock).mock.calls.filter(call =>
        call[0]?.includes('v1/epochs/current/participants')
      );
      expect(node4Calls.length).toBe(0);
    });

    it('should use node4 as primary source for epoch and participant data', async () => {
      (axios.get as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('v1/epochs/current/participants')) {
          return Promise.resolve({ data: mockNode4Response });
        }
        if (url.includes('chain-rpc/status')) {
          return Promise.resolve({ data: mockChainStatus });
        }
        if (url.includes('/api/v1/inference/current')) {
          return Promise.resolve({ data: { ...mockHyperfusionResponse, ml_nodes: [mockHyperfusionNode] } });
        }
        return Promise.reject(new Error(`Unexpected URL: ${url}`));
      });

      const result = await service.getPublicNetworkStats();

      // Verify node4 data is used as primary source
      expect(result.currentEpoch).toBe(42); // From node4 seed.epoch_index
      expect(result.totalParticipants).toBe(2); // From node4 participants.length
      expect(result.totalGpus).toBe(3); // From node4 ml_nodes count (2 + 1)
      expect(result.registeredModels).toBeGreaterThan(0); // Has models
    });

    it('should calculate network status as stale when block age exceeds threshold', async () => {
      const staleChainStatus = {
        ...mockChainStatus,
        result: {
          sync_info: {
            ...mockChainStatus.result.sync_info,
            latest_block_time: new Date(Date.now() - 150000).toISOString(), // 150 seconds ago
          },
        },
      };

      (axios.get as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('v1/epochs/current/participants')) {
          return Promise.resolve({ data: mockNode4Response });
        }
        if (url.includes('chain-rpc/status')) {
          return Promise.resolve({ data: staleChainStatus });
        }
        if (url.includes('/api/v1/inference/current')) {
          return Promise.resolve({ data: { ...mockHyperfusionResponse, ml_nodes: [mockHyperfusionNode] } });
        }
        return Promise.reject(new Error(`Unexpected URL: ${url}`));
      });

      const result = await service.getPublicNetworkStats();

      expect(result.networkStatus).toBe('stale');
      expect(result.blockAge).toBeGreaterThan(120);
    });

    it('should calculate time to next epoch from Hyperfusion data', async () => {
      (axios.get as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('v1/epochs/current/participants')) {
          return Promise.resolve({ data: mockNode4Response });
        }
        if (url.includes('chain-rpc/status')) {
          return Promise.resolve({ data: mockChainStatus });
        }
        if (url.includes('/api/v1/inference/current')) {
          return Promise.resolve({ data: { ...mockHyperfusionResponse, ml_nodes: [mockHyperfusionNode] } });
        }
        return Promise.reject(new Error(`Unexpected URL: ${url}`));
      });

      const result = await service.getPublicNetworkStats();

      // blocksRemaining = 1500 - 1000 = 500
      // totalSeconds = 500 * 6 = 3000
      expect(result.timeToNextEpoch.totalSeconds).toBe(3000);
      expect(result.timeToNextEpoch.hours).toBe(0);
      expect(result.timeToNextEpoch.minutes).toBe(50);
    });
  });
});
