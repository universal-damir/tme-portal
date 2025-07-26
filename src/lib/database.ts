import { Pool, PoolClient } from 'pg';
import { createClient } from 'redis';

// PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Redis client for session storage
const redisUrl = process.env.REDIS_URL;
let redisConfig;

if (redisUrl) {
  try {
    const url = new URL(redisUrl);
    redisConfig = {
      socket: {
        host: url.hostname,
        port: parseInt(url.port) || 6379,
      },
      password: decodeURIComponent(url.password),
    };
  } catch (error) {
    console.error('Failed to parse Redis URL:', error);
    redisConfig = { url: redisUrl };
  }
} else {
  redisConfig = { url: 'redis://localhost:6379' };
}

const redis = createClient(redisConfig);

redis.on('error', (err) => console.error('Redis Client Error', err));

// Initialize Redis connection only when needed (not during build)
let redisConnected = false;
async function ensureRedisConnection() {
  if (!redisConnected && !redis.isOpen) {
    try {
      await redis.connect();
      redisConnected = true;
    } catch (error) {
      console.error('Failed to connect to Redis:', error);
    }
  }
}

// Database query function with error handling
export async function query(text: string, params?: any[]): Promise<any> {
  const client: PoolClient = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Transaction helper
export async function transaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client: PoolClient = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export { redis, pool, ensureRedisConnection };
export default { query, transaction, redis, pool, ensureRedisConnection };