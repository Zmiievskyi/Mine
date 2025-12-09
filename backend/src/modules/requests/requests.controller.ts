import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { RequestsService } from './requests.service';
import { CreateRequestDto, UpdateRequestDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';

@Controller('requests')
@UseGuards(JwtAuthGuard)
export class RequestsController {
  constructor(private requestsService: RequestsService) {}

  @Post()
  async create(@Request() req, @Body() createRequestDto: CreateRequestDto) {
    const request = await this.requestsService.create(req.user.id, createRequestDto);
    return this.transformRequest(request);
  }

  @Get('my')
  async getMyRequests(@Request() req) {
    const requests = await this.requestsService.findAllByUser(req.user.id);
    return requests.map((r) => this.transformRequest(r));
  }

  @Get('stats')
  @UseGuards(AdminGuard)
  async getStats() {
    return this.requestsService.getStats();
  }

  @Get()
  @UseGuards(AdminGuard)
  async findAll() {
    const requests = await this.requestsService.findAll();
    return requests.map((r) => this.transformRequestWithUser(r));
  }

  @Get(':id')
  async findOne(@Request() req, @Param('id') id: string) {
    const isAdmin = req.user.role === 'admin';
    const request = await this.requestsService.findOne(
      id,
      isAdmin ? undefined : req.user.id,
    );
    return this.transformRequest(request);
  }

  @Put(':id')
  @UseGuards(AdminGuard)
  async update(
    @Request() req,
    @Param('id') id: string,
    @Body() updateRequestDto: UpdateRequestDto,
  ) {
    const request = await this.requestsService.update(id, updateRequestDto, req.user.id);
    return this.transformRequest(request);
  }

  @Delete(':id')
  async cancel(@Request() req, @Param('id') id: string) {
    const request = await this.requestsService.cancel(id, req.user.id);
    return this.transformRequest(request);
  }

  private transformRequest(request: any) {
    return {
      id: request.id,
      gpuType: request.gpuType,
      gpuCount: request.gpuCount,
      region: request.region,
      message: request.message,
      status: request.status,
      adminNotes: request.adminNotes,
      createdAt: request.createdAt,
      updatedAt: request.updatedAt,
      processedAt: request.processedAt,
    };
  }

  private transformRequestWithUser(request: any) {
    return {
      ...this.transformRequest(request),
      user: request.user
        ? {
            id: request.user.id,
            email: request.user.email,
            name: request.user.name,
          }
        : null,
    };
  }
}
