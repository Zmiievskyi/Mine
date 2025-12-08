import { registerAs } from '@nestjs/config';

export default registerAs('gonka', () => ({
  hyperfusionUrl:
    process.env.HYPERFUSION_URL || 'https://tracker.gonka.hyperfusion.io',
  gonkaApiNodes: (
    process.env.GONKA_API_NODES ||
    'http://node1.gonka.ai:8000,http://node2.gonka.ai:8000,http://node3.gonka.ai:8000'
  ).split(','),
  cacheTtlSeconds: parseInt(process.env.GONKA_CACHE_TTL || '120', 10),
}));
