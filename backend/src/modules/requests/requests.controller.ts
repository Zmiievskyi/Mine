import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { RequestsService } from './requests.service';
import { CreateRequestDto, UpdateRequestDto, AdminRequestsQueryDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { EmailVerifiedGuard } from '../auth/guards/email-verified.guard';
import { NodeRequest } from './entities/node-request.entity';

@ApiTags('requests')
@ApiBearerAuth('JWT-auth')
@Controller('requests')
@UseGuards(JwtAuthGuard)
export class RequestsController {
  constructor(private requestsService: RequestsService) {}

  @Post()
  @UseGuards(EmailVerifiedGuard)
  @ApiOperation({ summary: 'Create a new node request' })
  @ApiResponse({ status: 201, description: 'Request created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 403, description: 'Email verification required' })
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
  @ApiOperation({ summary: 'Get all requests (admin only, paginated with filters)' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' })
  @ApiQuery({ name: 'status', required: false, enum: ['pending', 'approved', 'rejected', 'completed', 'all'] })
  @ApiQuery({ name: 'gpuType', required: false, type: String })
  @ApiQuery({ name: 'userEmail', required: false, type: String })
  @ApiQuery({ name: 'dateFrom', required: false, type: String, description: 'ISO date string' })
  @ApiQuery({ name: 'dateTo', required: false, type: String, description: 'ISO date string' })
  @ApiQuery({ name: 'sortBy', required: false, enum: ['createdAt', 'status', 'gpuType'] })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  @ApiResponse({ status: 200, description: 'Paginated requests with user info' })
  @ApiResponse({ status: 403, description: 'Admin access required' })
  async findAll(@Query() query: AdminRequestsQueryDto) {
    const result = await this.requestsService.findAll(query);
    return {
      data: result.data.map((r) => this.transformRequestWithUser(r)),
      meta: result.meta,
    };
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
