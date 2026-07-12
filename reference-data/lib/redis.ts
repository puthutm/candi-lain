import Redis from "ioredis";

const redisUrl = process.env.REDIS_URL || "redis://127.0.0.1:6379";

let redis: Redis;

try {
  redis = new Redis(redisUrl, {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      return Math.min(times * 50, 2000);
    },
  });

  redis.on("error", (error) => {
    console.error("Redis Connection Error:", error);
  });
} catch (error) {
  console.error("Failed to initialize Redis:", error);
  throw error;
}

export { redis };

export const cache = {
  async get<T>(key: string): Promise<T | null> {
    try {
      const data = await redis.get(key);
      if (!data) return null;
      return JSON.parse(data) as T;
    } catch (error) {
      console.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  },

  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      if (ttlSeconds) {
        await redis.set(key, serialized, "EX", ttlSeconds);
      } else {
        await redis.set(key, serialized);
      }
    } catch (error) {
      console.error(`Cache set error for key ${key}:`, error);
    }
  },

  async delete(key: string): Promise<void> {
    try {
      await redis.del(key);
    } catch (error) {
      console.error(`Cache delete error for key ${key}:`, error);
    }
  },
};

/**
 * Shared audit log queue pushing to SSO Core worker
 */
export const auditQueue = {
  queueName: "audit_event_queue",

  async push(event: any): Promise<void> {
    try {
      // Append actor field for reference logging
      await redis.rpush(this.queueName, JSON.stringify({
        ...event,
        createdAt: new Date().toISOString()
      }));
    } catch (error) {
      console.error("Audit queue push error:", error);
    }
  },
};
