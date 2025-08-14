import { Pool, PoolClient } from 'pg';
import { createClient } from 'redis';
import { getDatabaseConfig, getRedisConfig } from './env-config';

// Auto-detected database configuration
const dbConfig = getDatabaseConfig();
const pool = new Pool({
  host: dbConfig.host,
  port: dbConfig.port,
  database: dbConfig.database,
  user: dbConfig.user,
  password: dbConfig.password,
  max: 100,  // Increased from 20 to handle 100 concurrent users
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,  // Increased from 2s to 5s for better stability
  statement_timeout: 10000,  // Kill queries running longer than 10 seconds
  query_timeout: 10000,  // Overall query timeout
});

// Auto-detected Redis configuration
const redisConfig = getRedisConfig();
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