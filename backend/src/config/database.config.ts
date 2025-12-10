import { registerAs } from '@nestjs/config';

export default registerAs('database', () => {
  // Synchronize must be explicitly enabled via DB_SYNCHRONIZE=true
  // This prevents accidental schema mutations in staging/preview environments
  const synchronize = process.env.DB_SYNCHRONIZE === 'true';

  if (synchronize && process.env.NODE_ENV === 'production') {
    console.warn(
      '⚠️  WARNING: DB_SYNCHRONIZE=true in production. This can cause data loss!',
    );
  }

  return {
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'minegnk',
    password: process.env.DB_PASSWORD || 'minegnk',
    database: process.env.DB_DATABASE || 'minegnk',
    synchronize,
    logging: process.env.NODE_ENV === 'development',
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  };
});
