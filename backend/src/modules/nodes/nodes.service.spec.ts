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
});
