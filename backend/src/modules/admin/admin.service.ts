import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { UserNode } from '../users/entities/user-node.entity';
import { NodeRequest, RequestStatus } from '../requests/entities/node-request.entity';
import { AssignNodeDto, UpdateUserDto, AdminNodesQueryDto, AdminUsersQueryDto } from './dto';
import {
  PaginationQueryDto,
  PaginatedResponse,
  createPaginatedResponse,
} from '../../common/dto';
import { NodesService, HyperfusionNode } from '../nodes/nodes.service';
import { getNodeStatus } from '../../common/utils';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(UserNode)
    private userNodesRepository: Repository<UserNode>,
    @InjectRepository(NodeRequest)
    private requestsRepository: Repository<NodeRequest>,
    @InjectDataSource()
    private dataSource: DataSource,
    private nodesService: NodesService,
  ) {}

  async getDashboardStats() {
    const [totalUsers, totalNodes, pendingRequests, approvedRequests] =
      await Promise.all([
        this.usersRepository.count(),
        this.userNodesRepository.count({ where: { isActive: true } }),
        this.requestsRepository.count({ where: { status: RequestStatus.PENDING } }),
        this.requestsRepository.count({ where: { status: RequestStatus.APPROVED } }),
      ]);

    return {
      totalUsers,
      totalNodes,
      pendingRequests,
      approvedRequests,
    };
  }

  async findAllUsers(
    query: AdminUsersQueryDto,
  ): Promise<PaginatedResponse<User>> {
    const { page = 1, limit = 20, search, role, isActive, sortBy, sortOrder = 'desc' } = query;
    const skip = (page - 1) * limit;

    // Use QueryBuilder to select users with node count instead of loading all nodes
    const queryBuilder = this.usersRepository
      .createQueryBuilder('user')
      .select([
        'user.id',
        'user.email',
        'user.name',
        'user.role',
        'user.isActive',
        'user.emailVerified',
        'user.provider',
        'user.createdAt',
      ])
      .loadRelationCountAndMap('user.nodeCount', 'user.nodes', 'nodes', (qb) =>
        qb.where('nodes.isActive = :isActive', { isActive: true }),
      );

    // Apply search filter
    if (search) {
      queryBuilder.andWhere(
        '(user.email ILIKE :search OR user.name ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Apply role filter
    if (role && role !== 'all') {
      queryBuilder.andWhere('user.role = :role', { role });
    }

    // Apply active status filter
    if (isActive !== undefined) {
      queryBuilder.andWhere('user.isActive = :isActive', { isActive });
    }

    // Apply sorting
    const order = sortOrder.toUpperCase() as 'ASC' | 'DESC';
    if (sortBy === 'email') {
      queryBuilder.orderBy('user.email', order);
    } else if (sortBy === 'createdAt') {
      queryBuilder.orderBy('user.createdAt', order);
    } else {
      // Default sort by createdAt
      queryBuilder.orderBy('user.createdAt', 'DESC');
    }

    queryBuilder.skip(skip).take(limit);

    const [users, total] = await queryBuilder.getManyAndCount();

    // If sorting by nodeCount, we need to sort in memory after loading
    if (sortBy === 'nodeCount') {
      users.sort((a: any, b: any) => {
        const diff = (a.nodeCount || 0) - (b.nodeCount || 0);
        return sortOrder === 'desc' ? -diff : diff;
      });
    }

    return createPaginatedResponse(users, total, page, limit);
  }

  async findUserWithNodes(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id },
      select: ['id', 'email', 'name', 'role', 'isActive', 'emailVerified', 'provider', 'createdAt'],
      relations: ['nodes'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findUserWithLiveStats(id: string) {
    const user = await this.findUserWithNodes(id);
    const allHyperfusionNodes = await this.fetchAllHyperfusionNodes();
    const statsMap = new Map(allHyperfusionNodes.map((s) => [s.address, s]));

    const nodesWithStats = user.nodes.map((node) => {
      const stats = statsMap.get(node.nodeAddress);
      return {
        id: node.id,
        nodeAddress: node.nodeAddress,
        label: node.label,
        gpuType: node.gpuType,
        gcoreInstanceId: node.gcoreInstanceId,
        notes: node.notes,
        isActive: node.isActive,
        createdAt: node.createdAt,
        status: getNodeStatus(stats),
        earnings: stats ? parseFloat(stats.earned_coins) : 0,
        inferenceCount: stats?.inference_count || 0,
        missedRate: stats?.missed_rate || 0,
        uptime: stats ? 100 - (stats.missed_rate || 0) : 0,
      };
    });

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      nodes: nodesWithStats,
    };
  }

  async updateUser(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findUserWithNodes(id);

    if (updateUserDto.role !== undefined) {
      user.role = updateUserDto.role;
    }

    if (updateUserDto.isActive !== undefined) {
      user.isActive = updateUserDto.isActive;
    }

    return this.usersRepository.save(user);
  }

  async assignNode(userId: string, assignNodeDto: AssignNodeDto): Promise<UserNode> {
    const node = await this.dataSource.transaction(async (manager) => {
      // Verify user exists
      const user = await manager.findOne(User, { where: { id: userId } });
      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Check for existing node with pessimistic lock to prevent race condition
      const existingNode = await manager.findOne(UserNode, {
        where: { nodeAddress: assignNodeDto.nodeAddress },
        lock: { mode: 'pessimistic_write' },
      });

      if (existingNode) {
        throw new ConflictException('This node is already assigned to a user');
      }

      const newNode = manager.create(UserNode, {
        userId,
        nodeAddress: assignNodeDto.nodeAddress,
        label: assignNodeDto.label,
        gpuType: assignNodeDto.gpuType,
        gcoreInstanceId: assignNodeDto.gcoreInstanceId,
        notes: assignNodeDto.notes,
      });

      return manager.save(newNode);
    });

    this.logger.log(
      `Node assigned: ${assignNodeDto.nodeAddress} -> user ${userId} (GPU: ${assignNodeDto.gpuType || 'N/A'})`,
    );
    return node;
  }

  async removeNode(userId: string, nodeId: string): Promise<void> {
    const node = await this.userNodesRepository.findOne({
      where: { id: nodeId, userId },
    });

    if (!node) {
      throw new NotFoundException('Node not found or does not belong to this user');
    }

    const nodeAddress = node.nodeAddress;
    await this.userNodesRepository.remove(node);

    this.logger.warn(`Node removed: ${nodeAddress} from user ${userId}`);
  }

  async updateNode(
    userId: string,
    nodeId: string,
    updateData: Partial<AssignNodeDto>,
  ): Promise<UserNode> {
    const node = await this.userNodesRepository.findOne({
      where: { id: nodeId, userId },
    });

    if (!node) {
      throw new NotFoundException('Node not found or does not belong to this user');
    }

    Object.assign(node, updateData);
    return this.userNodesRepository.save(node);
  }

  async getAllNodesWithStats(query: AdminNodesQueryDto) {
    const { page = 1, limit = 20, status, gpuType, userId, search, sortBy, sortOrder = 'desc' } = query;

    // Build query for nodes with user info
    const queryBuilder = this.userNodesRepository
      .createQueryBuilder('node')
      .leftJoinAndSelect('node.user', 'user')
      .where('node.isActive = :isActive', { isActive: true });

    // Apply filters
    if (gpuType) {
      queryBuilder.andWhere('node.gpuType = :gpuType', { gpuType });
    }
    if (userId) {
      queryBuilder.andWhere('node.userId = :userId', { userId });
    }
    if (search) {
      queryBuilder.andWhere('node.nodeAddress ILIKE :search', { search: `%${search}%` });
    }

    // Get all nodes first (we need to merge with live stats)
    const allNodes = await queryBuilder.getMany();

    // Fetch live stats from Hyperfusion
    const allHyperfusionNodes = await this.fetchAllHyperfusionNodes();
    const statsMap = new Map(allHyperfusionNodes.map((s) => [s.address, s]));

    // Merge nodes with stats
    let nodesWithStats = allNodes.map((node) => {
      const stats = statsMap.get(node.nodeAddress);
      const nodeStatus = getNodeStatus(stats);
      return {
        id: node.id,
        nodeAddress: node.nodeAddress,
        label: node.label,
        gpuType: node.gpuType,
        isActive: node.isActive,
        createdAt: node.createdAt,
        user: node.user ? { id: node.user.id, email: node.user.email, name: node.user.name } : null,
        status: nodeStatus,
        earnings: stats ? parseFloat(stats.earned_coins) : 0,
        inferenceCount: stats?.inference_count || 0,
        missedRate: stats?.missed_rate || 0,
        weight: stats?.weight || 0,
        models: stats?.models || [],
      };
    });

    // Filter by status if specified
    if (status && status !== 'all') {
      nodesWithStats = nodesWithStats.filter((n) => n.status === status);
    }

    // Sort
    if (sortBy) {
      nodesWithStats.sort((a, b) => {
        let comparison = 0;
        switch (sortBy) {
          case 'earnings':
            comparison = a.earnings - b.earnings;
            break;
          case 'user':
            comparison = (a.user?.email || '').localeCompare(b.user?.email || '');
            break;
          case 'createdAt':
            comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
            break;
        }
        return sortOrder === 'desc' ? -comparison : comparison;
      });
    }

    // Paginate
    const total = nodesWithStats.length;
    const skip = (page - 1) * limit;
    const paginatedNodes = nodesWithStats.slice(skip, skip + limit);

    return createPaginatedResponse(paginatedNodes, total, page, limit);
  }

  private async fetchAllHyperfusionNodes(): Promise<HyperfusionNode[]> {
    try {
      return await this.nodesService.getAllHyperfusionNodes();
    } catch {
      return [];
    }
  }
}
