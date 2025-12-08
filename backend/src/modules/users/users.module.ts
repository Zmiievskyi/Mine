import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { UserNode } from './entities/user-node.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, UserNode])],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
