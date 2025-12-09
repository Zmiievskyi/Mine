import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HealthService, HealthStatus } from './health.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private healthService: HealthService) {}

  @Get()
  @ApiOperation({ summary: 'Get overall health status' })
  @ApiResponse({ status: 200, description: 'Health status with component details' })
  async getHealth(): Promise<HealthStatus> {
    return this.healthService.check();
  }

  @Get('live')
  @ApiOperation({ summary: 'Kubernetes liveness probe' })
  @ApiResponse({ status: 200, description: 'Service is alive' })
  getLiveness(): { status: string } {
    return { status: 'ok' };
  }

  @Get('ready')
  @ApiOperation({ summary: 'Kubernetes readiness probe' })
  @ApiResponse({ status: 200, description: 'Service is ready to accept traffic' })
  async getReadiness(): Promise<{ status: string; details?: HealthStatus }> {
    const health = await this.healthService.check();
    const isReady = health.status === 'healthy' || health.status === 'degraded';

    return {
      status: isReady ? 'ok' : 'not_ready',
      details: health,
    };
  }
}
