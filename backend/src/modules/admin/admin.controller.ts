import {
  Controller,
  Get,
  Put,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { AssignNodeDto, UpdateUserDto } from './dto';
import { User } from '../users/entities/user.entity';
import { UserNode } from '../users/entities/user-node.entity';

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
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({ status: 200, description: 'List of all users' })
  async findAllUsers() {
    const users = await this.adminService.findAllUsers();
    return users.map((user) => this.transformUser(user));
  }

  @Get('users/:id')
  @ApiOperation({ summary: 'Get user by ID with nodes' })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiResponse({ status: 200, description: 'User details with nodes' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findUser(@Param('id') id: string) {
    const user = await this.adminService.findUserWithNodes(id);
    return this.transformUser(user);
  }

  @Put('users/:id')
  @ApiOperation({ summary: 'Update user role or status' })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiResponse({ status: 200, description: 'User updated' })
  async updateUser(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    const user = await this.adminService.updateUser(id, updateUserDto);
    return this.transformUser(user);
  }

  @Post('users/:id/nodes')
  @ApiOperation({ summary: 'Assign a node to user' })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiResponse({ status: 201, description: 'Node assigned' })
  @ApiResponse({ status: 409, description: 'Node already assigned' })
  async assignNode(
    @Param('id') userId: string,
    @Body() assignNodeDto: AssignNodeDto,
  ) {
    const node = await this.adminService.assignNode(userId, assignNodeDto);
    return this.transformNode(node);
  }

  @Delete('users/:userId/nodes/:nodeId')
  @ApiOperation({ summary: 'Remove node from user' })
  @ApiParam({ name: 'userId', description: 'User UUID' })
  @ApiParam({ name: 'nodeId', description: 'Node UUID' })
  @ApiResponse({ status: 200, description: 'Node removed' })
  async removeNode(
    @Param('userId') userId: string,
    @Param('nodeId') nodeId: string,
  ) {
    await this.adminService.removeNode(userId, nodeId);
    return { success: true };
  }

  @Put('users/:userId/nodes/:nodeId')
  @ApiOperation({ summary: 'Update node details' })
  @ApiParam({ name: 'userId', description: 'User UUID' })
  @ApiParam({ name: 'nodeId', description: 'Node UUID' })
  @ApiResponse({ status: 200, description: 'Node updated' })
  async updateNode(
    @Param('userId') userId: string,
    @Param('nodeId') nodeId: string,
    @Body() updateData: Partial<AssignNodeDto>,
  ) {
    const node = await this.adminService.updateNode(userId, nodeId, updateData);
    return this.transformNode(node);
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
