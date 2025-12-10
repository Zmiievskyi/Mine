import { DataSource } from 'typeorm';
import { config } from 'dotenv';

// Load environment variables
config();

const isProduction = process.env.NODE_ENV === 'production';

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'minegnk',
  password: process.env.DB_PASSWORD || 'minegnk',
  database: process.env.DB_DATABASE || 'minegnk',
  entities: isProduction
    ? ['dist/src/modules/**/entities/*.entity.js']
    : ['src/modules/**/entities/*.entity.ts'],
  migrations: isProduction
    ? ['dist/src/migrations/*.js']
    : ['src/migrations/*.ts'],
  synchronize: false,
  logging: true,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});
