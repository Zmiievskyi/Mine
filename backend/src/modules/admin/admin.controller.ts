import {
  Controller,
  Get,
  Put,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Res,
  Request,
} from '@nestjs/common';
import type { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { AdminAnalyticsService } from './admin-analytics.service';
import { AdminExportService } from './admin-export.service';
import { PricingService } from '../pricing/pricing.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import {
  AssignNodeDto,
  UpdateUserDto,
  UuidParamDto,
  NodeParamsDto,
  AdminNodesQueryDto,
  AdminUsersQueryDto,
} from './dto';
import { UpdatePricingDto, PricingResponseDto } from '../pricing/dto';
import { User } from '../users/entities/user.entity';
import { UserNode } from '../users/entities/user-node.entity';
import { PaginationQueryDto } from '../../common/dto';

@ApiTags('admin')
@ApiBearerAuth('JWT-auth')
@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  constructor(
    private adminService: AdminService,
    private analyticsService: AdminAnalyticsService,
    private exportService: AdminExportService,
    private pricingService: PricingService,
  ) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get admin dashboard statistics' })
  @ApiResponse({ status: 200, description: 'Dashboard stats' })
  @ApiResponse({ status: 403, description: 'Admin access required' })
  async getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  @Get('nodes')
  @ApiOperation({ summary: 'Get all nodes across all users with live stats' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: ['healthy', 'jailed', 'offline', 'all'] })
  @ApiQuery({ name: 'gpuType', required: false, type: String })
  @ApiQuery({ name: 'userId', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'sortBy', required: false, enum: ['earnings', 'uptime', 'user', 'createdAt'] })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  @ApiResponse({ status: 200, description: 'Paginated list of all nodes with stats' })
  async getAllNodes(@Query() query: AdminNodesQueryDto) {
    return this.adminService.getAllNodesWithStats(query);
  }

  @Get('nodes/health')
  @ApiOperation({ summary: 'Get network health overview' })
  @ApiResponse({ status: 200, description: 'Network health statistics' })
  async getNetworkHealth() {
    return this.analyticsService.getNetworkHealthOverview();
  }

  @Get('analytics')
  @ApiOperation({ summary: 'Get analytics data for admin dashboard' })
  @ApiResponse({ status: 200, description: 'Analytics data' })
  async getAnalytics() {
    return this.analyticsService.getAnalytics();
  }

  @Get('users/export')
  @ApiOperation({ summary: 'Export users to CSV' })
  @ApiResponse({ status: 200, description: 'CSV file' })
  async exportUsers(@Res({ passthrough: true }) res: Response) {
    const csv = await this.exportService.exportUsersCsv();
    res.set({
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="users-${new Date().toISOString().split('T')[0]}.csv"`,
    });
    return csv;
  }

  @Get('nodes/export')
  @ApiOperation({ summary: 'Export nodes to CSV' })
  @ApiResponse({ status: 200, description: 'CSV file' })
  async exportNodes(@Res({ passthrough: true }) res: Response) {
    const csv = await this.exportService.exportNodesCsv();
    res.set({
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="nodes-${new Date().toISOString().split('T')[0]}.csv"`,
    });
    return csv;
  }

  @Get('requests/export')
  @ApiOperation({ summary: 'Export requests to CSV' })
  @ApiResponse({ status: 200, description: 'CSV file' })
  async exportRequests(@Res({ passthrough: true }) res: Response) {
    const csv = await this.exportService.exportRequestsCsv();
    res.set({
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="requests-${new Date().toISOString().split('T')[0]}.csv"`,
    });
    return csv;
  }

  @Get('users')
  @ApiOperation({ summary: 'Get all users (paginated with search/filter)' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search by email or name' })
  @ApiQuery({ name: 'role', required: false, enum: ['user', 'admin', 'all'], description: 'Filter by role' })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean, description: 'Filter by active status' })
  @ApiQuery({ name: 'sortBy', required: false, enum: ['nodeCount', 'createdAt', 'email'], description: 'Sort field' })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'], description: 'Sort order' })
  @ApiResponse({ status: 200, description: 'Paginated list of users' })
  async findAllUsers(@Query() query: AdminUsersQueryDto) {
    const result = await this.adminService.findAllUsers(query);
    return {
      data: result.data.map((user) => this.transformUserSummary(user)),
      meta: result.meta,
    };
  }

  @Get('users/:id')
  @ApiOperation({ summary: 'Get user by ID with nodes and live stats' })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiResponse({ status: 200, description: 'User details with nodes and live stats' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 400, description: 'Invalid UUID format' })
  async findUser(@Param() params: UuidParamDto) {
    return this.adminService.findUserWithLiveStats(params.id);
  }

  @Put('users/:id')
  @ApiOperation({ summary: 'Update user role or status' })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiResponse({ status: 200, description: 'User updated' })
  @ApiResponse({ status: 400, description: 'Invalid UUID format' })
  async updateUser(
    @Param() params: UuidParamDto,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    const user = await this.adminService.updateUser(params.id, updateUserDto);
    return this.transformUser(user);
  }

  @Post('users/:id/nodes')
  @ApiOperation({ summary: 'Assign a node to user' })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiResponse({ status: 201, description: 'Node assigned' })
  @ApiResponse({ status: 409, description: 'Node already assigned' })
  @ApiResponse({ status: 400, description: 'Invalid UUID format' })
  async assignNode(
    @Param() params: UuidParamDto,
    @Body() assignNodeDto: AssignNodeDto,
  ) {
    const node = await this.adminService.assignNode(params.id, assignNodeDto);
    return this.transformNode(node);
  }

  @Delete('users/:userId/nodes/:nodeId')
  @ApiOperation({ summary: 'Remove node from user' })
  @ApiParam({ name: 'userId', description: 'User UUID' })
  @ApiParam({ name: 'nodeId', description: 'Node UUID' })
  @ApiResponse({ status: 200, description: 'Node removed' })
  @ApiResponse({ status: 400, description: 'Invalid UUID format' })
  async removeNode(@Param() params: NodeParamsDto) {
    await this.adminService.removeNode(params.userId, params.nodeId);
    return { success: true };
  }

  @Put('users/:userId/nodes/:nodeId')
  @ApiOperation({ summary: 'Update node details' })
  @ApiParam({ name: 'userId', description: 'User UUID' })
  @ApiParam({ name: 'nodeId', description: 'Node UUID' })
  @ApiResponse({ status: 200, description: 'Node updated' })
  @ApiResponse({ status: 400, description: 'Invalid UUID format' })
  async updateNode(
    @Param() params: NodeParamsDto,
    @Body() updateData: Partial<AssignNodeDto>,
  ) {
    const node = await this.adminService.updateNode(params.userId, params.nodeId, updateData);
    return this.transformNode(node);
  }

  // Pricing Management
  @Get('pricing')
  @ApiOperation({ summary: 'Get all GPU pricing configs' })
  @ApiResponse({ status: 200, description: 'List of pricing configs', type: [PricingResponseDto] })
  async getAllPricing(): Promise<PricingResponseDto[]> {
    return this.pricingService.getAllPricing();
  }

  @Put('pricing/:gpuType')
  @ApiOperation({ summary: 'Update GPU pricing' })
  @ApiParam({ name: 'gpuType', description: 'GPU type (A100, H100, H200)' })
  @ApiResponse({ status: 200, description: 'Pricing updated', type: PricingResponseDto })
  @ApiResponse({ status: 404, description: 'GPU type not found' })
  async updatePricing(
    @Param('gpuType') gpuType: string,
    @Body() dto: UpdatePricingDto,
    @Request() req,
  ): Promise<PricingResponseDto> {
    return this.pricingService.updatePricing(gpuType, dto, req.user.id);
  }

  private transformUserSummary(user: User & { nodeCount?: number }) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      nodeCount: user.nodeCount || 0,
    };
  }

  private transformUser(user: User) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      nodes: user.nodes?.map((node: UserNode) => this.transformNode(node)) || [],
    };
  }

  private transformNode(node: UserNode) {
    return {
      id: node.id,
      nodeAddress: node.nodeAddress,
      label: node.label,
      gpuType: node.gpuType,
      gcoreInstanceId: node.gcoreInstanceId,
      notes: node.notes,
      isActive: node.isActive,
      createdAt: node.createdAt,
    };
  }
}
