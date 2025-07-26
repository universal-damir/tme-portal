// Environment Configuration - Auto-detect development vs Docker vs Production
// This prevents recurring database/Redis connection issues

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
}

export interface RedisConfig {
  socket: {
    host: string;
    port: number;
  };
  password?: string;
}

// Detect current environment
function detectEnvironment(): 'docker' | 'local' | 'production' {
  // Production check
  if (process.env.NODE_ENV === 'production') {
    return 'production';
  }
  
  // Docker environment check
  if (process.env.DOCKER_ENV === 'true' || 
      process.env.DATABASE_URL?.includes('@postgres:') ||
      process.env.REDIS_URL?.includes('@redis:')) {
    return 'docker';
  }
  
  // Default to local development
  return 'local';
}

export function getDatabaseConfig(): DatabaseConfig {
  const env = detectEnvironment();
  
  switch (env) {
    case 'production':
    case 'docker':
      // Use environment variables as-is for Docker/Production
      const dbUrl = process.env.DATABASE_URL;
      if (dbUrl) {
        try {
          const url = new URL(dbUrl);
          return {
            host: url.hostname,
            port: parseInt(url.port) || 5432,
            database: url.pathname.slice(1),
            user: url.username,
            password: decodeURIComponent(url.password),
          };
        } catch (error) {
          console.error('Failed to parse DATABASE_URL:', error);
        }
      }
      // Fallback for Docker
      return {
        host: env === 'docker' ? 'postgres' : 'localhost',
        port: 5432,
        database: 'tme_portal',
        user: 'tme_user',
        password: process.env.POSTGRES_PASSWORD || 'secure_password',
      };
      
    case 'local':
    default:
      // Local development with Docker PostgreSQL exposed
      return {
        host: 'localhost',
        port: 5434, // Docker PostgreSQL exposed port
        database: 'tme_portal',
        user: 'tme_user',
        password: 'secure_password',
      };
  }
}

export function getRedisConfig(): RedisConfig {
  const env = detectEnvironment();
  
  switch (env) {
    case 'production':
    case 'docker':
      // Use environment variables for Docker/Production
      const redisUrl = process.env.REDIS_URL;
      if (redisUrl) {
        try {
          const url = new URL(redisUrl);
          return {
            socket: {
              host: url.hostname,
              port: parseInt(url.port) || 6379,
            },
            password: url.password ? decodeURIComponent(url.password) : undefined,
          };
        } catch (error) {
          console.error('Failed to parse REDIS_URL:', error);
        }
      }
      // Fallback for Docker
      return {
        socket: {
          host: env === 'docker' ? 'redis' : 'localhost',
          port: 6379,
        },
        password: process.env.REDIS_PASSWORD,
      };
      
    case 'local':
    default:
      // Local development with local Redis
      return {
        socket: {
          host: 'localhost',
          port: 6379,
        },
        // No password for local Redis
      };
  }
}

// Debug logging
const currentEnv = detectEnvironment();
console.log(`🔧 Environment detected: ${currentEnv}`);
console.log(`🔧 Database config:`, getDatabaseConfig());
console.log(`🔧 Redis config:`, getRedisConfig());