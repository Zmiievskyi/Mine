import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NodesController } from './nodes.controller';
import { NodesService } from './nodes.service';
import { UserNode } from '../users/entities/user-node.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserNode])],
  controllers: [NodesController],
  providers: [NodesService],
  exports: [NodesService],
})
export class NodesModule {}
