import { registerAs } from '@nestjs/config';

const DEV_SECRET = 'minegnk-dev-secret-do-not-use-in-production';

export default registerAs('jwt', () => {
  const secret = process.env.JWT_SECRET;
  const nodeEnv = process.env.NODE_ENV;

  // Only allow dev secret in explicit local development or test environments
  const allowDevSecret = nodeEnv === 'development' || nodeEnv === 'test';

  if (!allowDevSecret && !secret) {
    throw new Error(
      `JWT_SECRET is required. Current NODE_ENV="${nodeEnv}". ` +
        'Set JWT_SECRET or use NODE_ENV=development for local dev.',
    );
  }

  if (secret && secret.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters');
  }

  return {
    secret: secret || DEV_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  };
});
