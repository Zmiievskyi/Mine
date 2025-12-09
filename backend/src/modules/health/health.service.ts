import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import axios from 'axios';

export interface ServiceHealth {
  status: 'up' | 'down';
  responseTime?: number;
  error?: string;
}

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  services: {
    database: ServiceHealth;
    hyperfusion: ServiceHealth;
  };
  uptime: number;
}

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);
  private readonly startTime = Date.now();

  constructor(
    private configService: ConfigService,
    @InjectDataSource()
    private dataSource: DataSource,
  ) {}

  async check(): Promise<HealthStatus> {
    const [database, hyperfusion] = await Promise.all([
      this.checkDatabase(),
      this.checkHyperfusion(),
    ]);

    const status = this.determineOverallStatus(database, hyperfusion);

    return {
      status,
      timestamp: new Date().toISOString(),
      services: {
        database,
        hyperfusion,
      },
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
    };
  }

  private async checkDatabase(): Promise<ServiceHealth> {
    const start = Date.now();
    try {
      await this.dataSource.query('SELECT 1');
      return {
        status: 'up',
        responseTime: Date.now() - start,
      };
    } catch (error) {
      this.logger.error('Database health check failed', error);
      return {
        status: 'down',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async checkHyperfusion(): Promise<ServiceHealth> {
    const start = Date.now();
    try {
      const url = this.configService.get<string>('gonka.hyperfusionUrl');
      await axios.get(`${url}/api/v1/inference/current`, {
        timeout: 5000,
      });
      return {
        status: 'up',
        responseTime: Date.now() - start,
      };
    } catch (error) {
      this.logger.warn('Hyperfusion health check failed', error);
      return {
        status: 'down',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private determineOverallStatus(
    database: ServiceHealth,
    hyperfusion: ServiceHealth,
  ): 'healthy' | 'degraded' | 'unhealthy' {
    // Database is critical - if down, we're unhealthy
    if (database.status === 'down') {
      return 'unhealthy';
    }

    // Hyperfusion down means degraded (we can still serve cached data)
    if (hyperfusion.status === 'down') {
      return 'degraded';
    }

    return 'healthy';
  }
}
