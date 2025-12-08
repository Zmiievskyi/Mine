import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { appConfig, databaseConfig, jwtConfig, gonkaConfig } from './config';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { NodesModule } from './modules/nodes/nodes.module';
import { User } from './modules/users/entities/user.entity';
import { UserNode } from './modules/users/entities/user-node.entity';
import { NodeRequest } from './modules/requests/entities/node-request.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, jwtConfig, gonkaConfig],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('database.host'),
        port: configService.get<number>('database.port'),
        username: configService.get<string>('database.username'),
        password: configService.get<string>('database.password'),
        database: configService.get<string>('database.database'),
        entities: [User, UserNode, NodeRequest],
        synchronize: configService.get<boolean>('database.synchronize'),
        logging: configService.get<boolean>('database.logging'),
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    UsersModule,
    NodesModule,
  ],
})
export class AppModule {}
