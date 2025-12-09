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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { RequestsService } from './requests.service';
import { CreateRequestDto, UpdateRequestDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { NodeRequest } from './entities/node-request.entity';

@ApiTags('requests')
@ApiBearerAuth('JWT-auth')
@Controller('requests')
@UseGuards(JwtAuthGuard)
export class RequestsController {
  constructor(private requestsService: RequestsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new node request' })
  @ApiResponse({ status: 201, description: 'Request created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  async create(@Request() req, @Body() createRequestDto: CreateRequestDto) {
    const request = await this.requestsService.create(req.user.id, createRequestDto);
    return this.transformRequest(request);
  }

  @Get('my')
  @ApiOperation({ summary: 'Get current user requests' })
  @ApiResponse({ status: 200, description: 'List of user requests' })
  async getMyRequests(@Request() req) {
    const requests = await this.requestsService.findAllByUser(req.user.id);
    return requests.map((r) => this.transformRequest(r));
  }

  @Get('stats')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Get request statistics (admin only)' })
  @ApiResponse({ status: 200, description: 'Request statistics' })
  @ApiResponse({ status: 403, description: 'Admin access required' })
  async getStats() {
    return this.requestsService.getStats();
  }

  @Get()
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Get all requests (admin only)' })
  @ApiResponse({ status: 200, description: 'All requests with user info' })
  @ApiResponse({ status: 403, description: 'Admin access required' })
  async findAll() {
    const requests = await this.requestsService.findAll();
    return requests.map((r) => this.transformRequestWithUser(r));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get request by ID' })
  @ApiParam({ name: 'id', description: 'Request UUID' })
  @ApiResponse({ status: 200, description: 'Request details' })
  @ApiResponse({ status: 404, description: 'Request not found' })
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
  @ApiOperation({ summary: 'Update request status (admin only)' })
  @ApiParam({ name: 'id', description: 'Request UUID' })
  @ApiResponse({ status: 200, description: 'Request updated' })
  @ApiResponse({ status: 403, description: 'Admin access required' })
  async update(
    @Request() req,
    @Param('id') id: string,
    @Body() updateRequestDto: UpdateRequestDto,
  ) {
    const request = await this.requestsService.update(id, updateRequestDto, req.user.id);
    return this.transformRequest(request);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Cancel a pending request' })
  @ApiParam({ name: 'id', description: 'Request UUID' })
  @ApiResponse({ status: 200, description: 'Request cancelled' })
  @ApiResponse({ status: 400, description: 'Cannot cancel non-pending request' })
  async cancel(@Request() req, @Param('id') id: string) {
    const request = await this.requestsService.cancel(id, req.user.id);
    return this.transformRequest(request);
  }

  private transformRequest(request: NodeRequest) {
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

  private transformRequestWithUser(request: NodeRequest) {
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
