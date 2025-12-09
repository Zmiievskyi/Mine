import { registerAs } from '@nestjs/config';

export default registerAs('retry', () => ({
  maxRetries: parseInt(process.env.RETRY_MAX_ATTEMPTS || '3', 10),
  baseDelayMs: parseInt(process.env.RETRY_BASE_DELAY_MS || '1000', 10),
  maxDelayMs: parseInt(process.env.RETRY_MAX_DELAY_MS || '10000', 10),
  backoffFactor: parseFloat(process.env.RETRY_BACKOFF_FACTOR || '2'),
}));
