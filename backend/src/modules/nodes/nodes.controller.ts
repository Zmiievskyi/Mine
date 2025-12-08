import { Controller, Get, Param, UseGuards, Request } from '@nestjs/common';
import { NodesService } from './nodes.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('nodes')
@UseGuards(JwtAuthGuard)
export class NodesController {
  constructor(private nodesService: NodesService) {}

  @Get()
  async getUserNodes(@Request() req) {
    return this.nodesService.getUserNodes(req.user.id);
  }

  @Get('dashboard')
  async getDashboardStats(@Request() req) {
    return this.nodesService.getDashboardStats(req.user.id);
  }

  @Get(':address')
  async getNodeByAddress(@Request() req, @Param('address') address: string) {
    return this.nodesService.getNodeByAddress(req.user.id, address);
  }
}
