import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminAnalyticsService } from './admin-analytics.service';
import { AdminExportService } from './admin-export.service';
import { User } from '../users/entities/user.entity';
import { UserNode } from '../users/entities/user-node.entity';
import { NodeRequest } from '../requests/entities/node-request.entity';
import { NodesModule } from '../nodes/nodes.module';

@Module({
  imports: [TypeOrmModule.forFeature([User, UserNode, NodeRequest]), NodesModule],
  controllers: [AdminController],
  providers: [AdminService, AdminAnalyticsService, AdminExportService],
})
export class AdminModule {}
