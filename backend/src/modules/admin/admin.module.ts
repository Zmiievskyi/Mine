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
import { PricingModule } from '../pricing/pricing.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserNode, NodeRequest]),
    NodesModule,
    PricingModule,
    UsersModule,
  ],
  controllers: [AdminController],
  providers: [AdminService, AdminAnalyticsService, AdminExportService],
  exports: [],
})
export class AdminModule {}
