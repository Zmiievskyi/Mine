import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NodeRequest, RequestStatus } from './entities/node-request.entity';
import { CreateRequestDto } from './dto/create-request.dto';
import { UpdateRequestDto } from './dto/update-request.dto';

@Injectable()
export class RequestsService {
  constructor(
    @InjectRepository(NodeRequest)
    private requestsRepository: Repository<NodeRequest>,
  ) {}

  async create(userId: string, createRequestDto: CreateRequestDto): Promise<NodeRequest> {
    const request = this.requestsRepository.create({
      userId,
      ...createRequestDto,
      status: RequestStatus.PENDING,
    });
    return this.requestsRepository.save(request);
  }

  async findAllByUser(userId: string): Promise<NodeRequest[]> {
    return this.requestsRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findAll(): Promise<NodeRequest[]> {
    return this.requestsRepository.find({
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, userId?: string): Promise<NodeRequest> {
    const request = await this.requestsRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!request) {
      throw new NotFoundException('Request not found');
    }

    if (userId && request.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return request;
  }

  async update(
    id: string,
    updateRequestDto: UpdateRequestDto,
    adminId: string,
  ): Promise<NodeRequest> {
    const request = await this.findOne(id);

    if (updateRequestDto.status) {
      request.status = updateRequestDto.status;
      request.processedBy = adminId;
      request.processedAt = new Date();
    }

    if (updateRequestDto.adminNotes !== undefined) {
      request.adminNotes = updateRequestDto.adminNotes;
    }

    return this.requestsRepository.save(request);
  }

  async cancel(id: string, userId: string): Promise<NodeRequest> {
    const request = await this.findOne(id, userId);

    if (request.status !== RequestStatus.PENDING) {
      throw new ForbiddenException('Only pending requests can be cancelled');
    }

    request.status = RequestStatus.REJECTED;
    return this.requestsRepository.save(request);
  }

  async getStats(): Promise<{ pending: number; approved: number; completed: number }> {
    const [pending, approved, completed] = await Promise.all([
      this.requestsRepository.count({ where: { status: RequestStatus.PENDING } }),
      this.requestsRepository.count({ where: { status: RequestStatus.APPROVED } }),
      this.requestsRepository.count({ where: { status: RequestStatus.COMPLETED } }),
    ]);
    return { pending, approved, completed };
  }
}
