import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../users/entities/user.entity';
import { UserNode } from '../users/entities/user-node.entity';
import { NodeRequest, RequestStatus } from '../requests/entities/node-request.entity';
import { AssignNodeDto, UpdateUserDto } from './dto';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(UserNode)
    private userNodesRepository: Repository<UserNode>,
    @InjectRepository(NodeRequest)
    private requestsRepository: Repository<NodeRequest>,
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

  async findAllUsers(): Promise<User[]> {
    return this.usersRepository.find({
      select: ['id', 'email', 'name', 'role', 'isActive', 'createdAt'],
      relations: ['nodes'],
      order: { createdAt: 'DESC' },
    });
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
    await this.findUserWithNodes(userId);

    const existingNode = await this.userNodesRepository.findOne({
      where: { nodeAddress: assignNodeDto.nodeAddress },
    });

    if (existingNode) {
      throw new ConflictException('This node is already assigned to a user');
    }

    const node = this.userNodesRepository.create({
      userId,
      nodeAddress: assignNodeDto.nodeAddress,
      label: assignNodeDto.label,
      gpuType: assignNodeDto.gpuType,
      gcoreInstanceId: assignNodeDto.gcoreInstanceId,
      notes: assignNodeDto.notes,
    });

    return this.userNodesRepository.save(node);
  }

  async removeNode(userId: string, nodeId: string): Promise<void> {
    const node = await this.userNodesRepository.findOne({
      where: { id: nodeId, userId },
    });

    if (!node) {
      throw new NotFoundException('Node not found or does not belong to this user');
    }

    await this.userNodesRepository.remove(node);
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
