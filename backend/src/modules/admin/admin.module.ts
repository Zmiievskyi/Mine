import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { User } from '../users/entities/user.entity';
import { UserNode } from '../users/entities/user-node.entity';
import { NodeRequest } from '../requests/entities/node-request.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, UserNode, NodeRequest])],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
