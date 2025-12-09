import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { AdminService } from './admin.service';
import { User, UserRole } from '../users/entities/user.entity';
import { UserNode } from '../users/entities/user-node.entity';
import { NodeRequest, RequestStatus } from '../requests/entities/node-request.entity';
import { AssignNodeDto, UpdateUserDto } from './dto';

describe('AdminService', () => {
  let service: AdminService;
  let usersRepository: jest.Mocked<Repository<User>>;
  let userNodesRepository: jest.Mocked<Repository<UserNode>>;
  let requestsRepository: jest.Mocked<Repository<NodeRequest>>;

  const mockUser: User = {
    id: 'user-123',
    email: 'test@example.com',
    password: 'hashedPassword',
    name: 'Test User',
    role: UserRole.USER,
    isActive: true,
    nodes: [],
    requests: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUserNode: UserNode = {
    id: 'node-123',
    userId: 'user-123',
    nodeAddress: 'gonka1abc123',
    label: 'Node 1',
    gpuType: 'RTX 4090',
    gcoreInstanceId: 'gcore-123',
    notes: 'Test node',
    isActive: true,
    user: mockUser,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            count: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(UserNode),
          useValue: {
            count: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            remove: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(NodeRequest),
          useValue: {
            count: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
    usersRepository = module.get(getRepositoryToken(User));
    userNodesRepository = module.get(getRepositoryToken(UserNode));
    requestsRepository = module.get(getRepositoryToken(NodeRequest));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getDashboardStats', () => {
    it('should return correct dashboard statistics', async () => {
      usersRepository.count.mockResolvedValue(50);
      userNodesRepository.count.mockResolvedValue(120);
      requestsRepository.count
        .mockResolvedValueOnce(15)
        .mockResolvedValueOnce(30);

      const result = await service.getDashboardStats();

      expect(usersRepository.count).toHaveBeenCalledTimes(1);
      expect(userNodesRepository.count).toHaveBeenCalledWith({ where: { isActive: true } });
      expect(requestsRepository.count).toHaveBeenNthCalledWith(1, {
        where: { status: RequestStatus.PENDING },
      });
      expect(requestsRepository.count).toHaveBeenNthCalledWith(2, {
        where: { status: RequestStatus.APPROVED },
      });
      expect(result).toEqual({
        totalUsers: 50,
        totalNodes: 120,
        pendingRequests: 15,
        approvedRequests: 30,
      });
    });

    it('should return zeros when no data exists', async () => {
      usersRepository.count.mockResolvedValue(0);
      userNodesRepository.count.mockResolvedValue(0);
      requestsRepository.count.mockResolvedValue(0);

      const result = await service.getDashboardStats();

      expect(result).toEqual({
        totalUsers: 0,
        totalNodes: 0,
        pendingRequests: 0,
        approvedRequests: 0,
      });
    });
  });

  describe('findAllUsers', () => {
    it('should return all users with their nodes', async () => {
      const users = [mockUser, { ...mockUser, id: 'user-456', email: 'user2@example.com' }];
      usersRepository.find.mockResolvedValue(users);

      const result = await service.findAllUsers();

      expect(usersRepository.find).toHaveBeenCalledWith({
        select: ['id', 'email', 'name', 'role', 'isActive', 'createdAt'],
        relations: ['nodes'],
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual(users);
    });
  });

  describe('findUserWithNodes', () => {
    it('should return user with nodes if found', async () => {
      const userWithNodes = { ...mockUser, nodes: [mockUserNode] };
      usersRepository.findOne.mockResolvedValue(userWithNodes);

      const result = await service.findUserWithNodes('user-123');

      expect(usersRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        select: ['id', 'email', 'name', 'role', 'isActive', 'createdAt'],
        relations: ['nodes'],
      });
      expect(result).toEqual(userWithNodes);
    });

    it('should throw NotFoundException if user not found', async () => {
      usersRepository.findOne.mockResolvedValue(null);

      await expect(service.findUserWithNodes('invalid-id')).rejects.toThrow(
        new NotFoundException('User not found'),
      );

      expect(usersRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'invalid-id' },
        select: ['id', 'email', 'name', 'role', 'isActive', 'createdAt'],
        relations: ['nodes'],
      });
    });
  });

  describe('updateUser', () => {
    it('should update user role', async () => {
      const updateDto: UpdateUserDto = { role: UserRole.ADMIN };
      const updatedUser = { ...mockUser, role: UserRole.ADMIN };

      usersRepository.findOne.mockResolvedValue(mockUser);
      usersRepository.save.mockResolvedValue(updatedUser);

      const result = await service.updateUser('user-123', updateDto);

      expect(usersRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ role: UserRole.ADMIN }),
      );
      expect(result.role).toBe(UserRole.ADMIN);
    });

    it('should update user active status', async () => {
      const updateDto: UpdateUserDto = { isActive: false };
      const updatedUser = { ...mockUser, isActive: false };

      usersRepository.findOne.mockResolvedValue(mockUser);
      usersRepository.save.mockResolvedValue(updatedUser);

      const result = await service.updateUser('user-123', updateDto);

      expect(usersRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ isActive: false }),
      );
      expect(result.isActive).toBe(false);
    });

    it('should throw NotFoundException if user not found', async () => {
      usersRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updateUser('invalid-id', { role: UserRole.ADMIN }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('assignNode', () => {
    const assignNodeDto: AssignNodeDto = {
      nodeAddress: 'gonka1new456',
      label: 'New Node',
      gpuType: 'H100',
      gcoreInstanceId: 'gcore-456',
      notes: 'New node assignment',
    };

    it('should successfully assign a new node to user', async () => {
      const newNode = { ...mockUserNode, ...assignNodeDto };

      usersRepository.findOne.mockResolvedValue(mockUser);
      userNodesRepository.findOne.mockResolvedValue(null);
      userNodesRepository.create.mockReturnValue(newNode as any);
      userNodesRepository.save.mockResolvedValue(newNode);

      const result = await service.assignNode('user-123', assignNodeDto);

      expect(usersRepository.findOne).toHaveBeenCalled();
      expect(userNodesRepository.findOne).toHaveBeenCalledWith({
        where: { nodeAddress: assignNodeDto.nodeAddress },
      });
      expect(userNodesRepository.create).toHaveBeenCalledWith({
        userId: 'user-123',
        nodeAddress: assignNodeDto.nodeAddress,
        label: assignNodeDto.label,
        gpuType: assignNodeDto.gpuType,
        gcoreInstanceId: assignNodeDto.gcoreInstanceId,
        notes: assignNodeDto.notes,
      });
      expect(result).toEqual(newNode);
    });

    it('should throw ConflictException if node address already exists', async () => {
      usersRepository.findOne.mockResolvedValue(mockUser);
      userNodesRepository.findOne.mockResolvedValue(mockUserNode);

      await expect(service.assignNode('user-123', assignNodeDto)).rejects.toThrow(
        new ConflictException('This node is already assigned to a user'),
      );

      expect(userNodesRepository.create).not.toHaveBeenCalled();
      expect(userNodesRepository.save).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if user does not exist', async () => {
      usersRepository.findOne.mockResolvedValue(null);

      await expect(service.assignNode('invalid-id', assignNodeDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('removeNode', () => {
    it('should successfully remove a node', async () => {
      userNodesRepository.findOne.mockResolvedValue(mockUserNode);
      userNodesRepository.remove.mockResolvedValue(mockUserNode);

      await service.removeNode('user-123', 'node-123');

      expect(userNodesRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'node-123', userId: 'user-123' },
      });
      expect(userNodesRepository.remove).toHaveBeenCalledWith(mockUserNode);
    });

    it('should throw NotFoundException if node not found', async () => {
      userNodesRepository.findOne.mockResolvedValue(null);

      await expect(service.removeNode('user-123', 'invalid-node-id')).rejects.toThrow(
        new NotFoundException('Node not found or does not belong to this user'),
      );

      expect(userNodesRepository.remove).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if node belongs to different user', async () => {
      userNodesRepository.findOne.mockResolvedValue(null);

      await expect(service.removeNode('user-456', 'node-123')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateNode', () => {
    it('should successfully update a node', async () => {
      const updateData: Partial<AssignNodeDto> = {
        label: 'Updated Label',
        notes: 'Updated notes',
      };
      const updatedNode = { ...mockUserNode, ...updateData };

      userNodesRepository.findOne.mockResolvedValue(mockUserNode);
      userNodesRepository.save.mockResolvedValue(updatedNode);

      const result = await service.updateNode('user-123', 'node-123', updateData);

      expect(userNodesRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'node-123', userId: 'user-123' },
      });
      expect(userNodesRepository.save).toHaveBeenCalledWith(
        expect.objectContaining(updateData),
      );
      expect(result.label).toBe('Updated Label');
      expect(result.notes).toBe('Updated notes');
    });

    it('should throw NotFoundException if node not found', async () => {
      userNodesRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updateNode('user-123', 'invalid-node-id', { label: 'New Label' }),
      ).rejects.toThrow(new NotFoundException('Node not found or does not belong to this user'));

      expect(userNodesRepository.save).not.toHaveBeenCalled();
    });
  });
});
