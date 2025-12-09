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
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { AssignNodeDto, UpdateUserDto } from './dto';

@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('dashboard')
  async getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  @Get('users')
  async findAllUsers() {
    const users = await this.adminService.findAllUsers();
    return users.map((user) => this.transformUser(user));
  }

  @Get('users/:id')
  async findUser(@Param('id') id: string) {
    const user = await this.adminService.findUserWithNodes(id);
    return this.transformUser(user);
  }

  @Put('users/:id')
  async updateUser(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    const user = await this.adminService.updateUser(id, updateUserDto);
    return this.transformUser(user);
  }

  @Post('users/:id/nodes')
  async assignNode(
    @Param('id') userId: string,
    @Body() assignNodeDto: AssignNodeDto,
  ) {
    const node = await this.adminService.assignNode(userId, assignNodeDto);
    return this.transformNode(node);
  }

  @Delete('users/:userId/nodes/:nodeId')
  async removeNode(
    @Param('userId') userId: string,
    @Param('nodeId') nodeId: string,
  ) {
    await this.adminService.removeNode(userId, nodeId);
    return { success: true };
  }

  @Put('users/:userId/nodes/:nodeId')
  async updateNode(
    @Param('userId') userId: string,
    @Param('nodeId') nodeId: string,
    @Body() updateData: Partial<AssignNodeDto>,
  ) {
    const node = await this.adminService.updateNode(userId, nodeId, updateData);
    return this.transformNode(node);
  }

  private transformUser(user: any) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      nodes: user.nodes?.map((node: any) => this.transformNode(node)) || [],
    };
  }

  private transformNode(node: any) {
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
