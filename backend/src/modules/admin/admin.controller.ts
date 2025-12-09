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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { AssignNodeDto, UpdateUserDto, UuidParamDto, NodeParamsDto } from './dto';
import { User } from '../users/entities/user.entity';
import { UserNode } from '../users/entities/user-node.entity';
import { PaginationQueryDto } from '../../common/dto';

@ApiTags('admin')
@ApiBearerAuth('JWT-auth')
@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get admin dashboard statistics' })
  @ApiResponse({ status: 200, description: 'Dashboard stats' })
  @ApiResponse({ status: 403, description: 'Admin access required' })
  async getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  @Get('users')
  @ApiOperation({ summary: 'Get all users (paginated)' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' })
  @ApiResponse({ status: 200, description: 'Paginated list of users' })
  async findAllUsers(@Query() pagination: PaginationQueryDto) {
    const result = await this.adminService.findAllUsers(pagination);
    return {
      data: result.data.map((user) => this.transformUserSummary(user)),
      meta: result.meta,
    };
  }

  @Get('users/:id')
  @ApiOperation({ summary: 'Get user by ID with nodes' })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiResponse({ status: 200, description: 'User details with nodes' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 400, description: 'Invalid UUID format' })
  async findUser(@Param() params: UuidParamDto) {
    const user = await this.adminService.findUserWithNodes(params.id);
    return this.transformUser(user);
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
