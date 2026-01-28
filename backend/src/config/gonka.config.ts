import { registerAs } from '@nestjs/config';

export default registerAs('gonka', () => ({
  hyperfusionUrl:
    process.env.HYPERFUSION_URL || 'https://tracker.gonka.hyperfusion.io',
  gonkaApiNodes: (
    process.env.GONKA_API_NODES ||
    'http://node1.gonka.ai:8000,http://node2.gonka.ai:8000,http://node3.gonka.ai:8000'
  ).split(','),
  cacheTtlSeconds: parseInt(process.env.GONKA_CACHE_TTL || '120', 10),
  chainRpcUrl:
    process.env.GONKA_CHAIN_RPC_URL || 'https://node4.gonka.ai/chain-rpc/status',
  freshBlockAgeSeconds: parseInt(
    process.env.GONKA_FRESH_BLOCK_AGE_SECONDS || '120',
    10,
  ),
  node4ParticipantsUrl:
    process.env.NODE4_PARTICIPANTS_URL ||
    'https://node4.gonka.ai/v1/epochs/current/participants',
}));
