import { registerAs } from '@nestjs/config';

const DEV_SECRET = 'minegnk-dev-secret-do-not-use-in-production';

export default registerAs('jwt', () => {
  const secret = process.env.JWT_SECRET;
  const isProduction = process.env.NODE_ENV === 'production';

  if (isProduction && !secret) {
    throw new Error('JWT_SECRET must be set in production environment');
  }

  if (isProduction && secret && secret.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters in production');
  }

  return {
    secret: secret || DEV_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  };
});
