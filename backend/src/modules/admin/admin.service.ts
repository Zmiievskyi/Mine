import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { User, UserRole } from '../users/entities/user.entity';
import { UserNode } from '../users/entities/user-node.entity';
import { NodeRequest, RequestStatus } from '../requests/entities/node-request.entity';
import { AssignNodeDto, UpdateUserDto } from './dto';
import {
  PaginationQueryDto,
  PaginatedResponse,
  createPaginatedResponse,
} from '../../common/dto';

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
    pagination: PaginationQueryDto,
  ): Promise<PaginatedResponse<User>> {
    const { page = 1, limit = 20 } = pagination;
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
        'user.createdAt',
      ])
      .loadRelationCountAndMap('user.nodeCount', 'user.nodes', 'nodes', (qb) =>
        qb.where('nodes.isActive = :isActive', { isActive: true }),
      )
      .orderBy('user.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    const [users, total] = await queryBuilder.getManyAndCount();

    return createPaginatedResponse(users, total, page, limit);
  }

  async findUserWithNodes(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id },
      select: ['id', 'email', 'name', 'role', 'isActive', 'createdAt'],
      relations: ['nodes'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
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
}
