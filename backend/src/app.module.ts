import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import {
  appConfig,
  databaseConfig,
  jwtConfig,
  gonkaConfig,
  googleConfig,
  retryConfig,
  throttlerConfig,
} from './config';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { NodesModule } from './modules/nodes/nodes.module';
import { RequestsModule } from './modules/requests/requests.module';
import { AdminModule } from './modules/admin/admin.module';
import { HealthModule } from './modules/health/health.module';
import { User } from './modules/users/entities/user.entity';
import { UserNode } from './modules/users/entities/user-node.entity';
import { NodeRequest } from './modules/requests/entities/node-request.entity';
import { Node } from './modules/nodes/entities/node.entity';
import { NodeStatsCache } from './modules/nodes/entities/node-stats-cache.entity';
import { EarningsHistory } from './modules/nodes/entities/earnings-history.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        appConfig,
        databaseConfig,
        jwtConfig,
        gonkaConfig,
        googleConfig,
        retryConfig,
        throttlerConfig,
      ],
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => [
        {
          name: 'short',
          ttl: configService.get<number>('throttler.short.ttl') ?? 1000,
          limit: configService.get<number>('throttler.short.limit') ?? 3,
        },
        {
          name: 'medium',
          ttl: configService.get<number>('throttler.medium.ttl') ?? 10000,
          limit: configService.get<number>('throttler.medium.limit') ?? 20,
        },
        {
          name: 'long',
          ttl: configService.get<number>('throttler.long.ttl') ?? 60000,
          limit: configService.get<number>('throttler.long.limit') ?? 100,
        },
      ],
      inject: [ConfigService],
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
        entities: [
          User,
          UserNode,
          NodeRequest,
          Node,
          NodeStatsCache,
          EarningsHistory,
        ],
        synchronize: configService.get<boolean>('database.synchronize'),
        logging: configService.get<boolean>('database.logging'),
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    UsersModule,
    NodesModule,
    RequestsModule,
    AdminModule,
    HealthModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
