import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_GUARD } from '@nestjs/core';
import {
  appConfig,
  databaseConfig,
  jwtConfig,
  gonkaConfig,
  googleConfig,
  githubConfig,
  telegramConfig,
  retryConfig,
  throttlerConfig,
  s3Config,
} from './config';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { NodesModule } from './modules/nodes/nodes.module';
import { RequestsModule } from './modules/requests/requests.module';
import { AdminModule } from './modules/admin/admin.module';
import { HealthModule } from './modules/health/health.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { User } from './modules/users/entities/user.entity';
import { UserNode } from './modules/users/entities/user-node.entity';
import { NodeRequest } from './modules/requests/entities/node-request.entity';
import { PricingConfig } from './modules/pricing/entities/pricing-config.entity';

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
        githubConfig,
        telegramConfig,
        retryConfig,
        throttlerConfig,
        s3Config,
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
          PricingConfig,
        ],
        autoLoadEntities: true,
        synchronize: configService.get<boolean>('database.synchronize'),
        logging: configService.get<boolean>('database.logging'),
        ssl: configService.get('database.ssl'),
      }),
      inject: [ConfigService],
    }),
    ScheduleModule.forRoot(),
    AuthModule,
    UsersModule,
    NodesModule,
    RequestsModule,
    AdminModule,
    HealthModule,
    UploadsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
