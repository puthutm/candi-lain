import Redis from "ioredis";
import { env } from "./env";

const redisUrl = env.REDIS_URL || "redis://127.0.0.1:6379";

let redis: Redis;

try {
  redis = new Redis(redisUrl, {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      const delay = Math.min(times * 50, 2000);
      return delay;
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

/**
 * Cache helpers for standard caching usage
 */
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

  async exists(key: string): Promise<boolean> {
    try {
      const count = await redis.exists(key);
      return count > 0;
    } catch (error) {
      console.error(`Cache exists error for key ${key}:`, error);
      return false;
    }
  },
};

/**
 * Audit Log Queue helpers for asynchronous event logging
 */
export const auditQueue = {
  queueName: "audit_event_queue",

  async push(event: any): Promise<void> {
    try {
      await redis.rpush(this.queueName, JSON.stringify(event));
    } catch (error) {
      console.error("Audit queue push error:", error);
    }
  },

  async pop(): Promise<any | null> {
    try {
      const data = await redis.lpop(this.queueName);
      if (!data) return null;
      return JSON.parse(data);
    } catch (error) {
      console.error("Audit queue pop error:", error);
      return null;
    }
  },

  async size(): Promise<number> {
    try {
      return await redis.llen(this.queueName);
    } catch (error) {
      console.error("Audit queue size error:", error);
      return 0;
    }
  },
};

/**
 * Reusable fixed-window rate limiter in Redis
 */
export async function rateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<{ success: boolean; limit: number; remaining: number }> {
  try {
    const current = await redis.incr(key);
    if (current === 1) {
      await redis.expire(key, windowSeconds);
    }
    const remaining = Math.max(0, limit - current);
    return {
      success: current <= limit,
      limit,
      remaining,
    };
  } catch (error) {
    console.error(`Rate limiter error for key ${key}:`, error);
    // Fail-open in case of Redis issues to prevent service outage
    return {
      success: true,
      limit,
      remaining: limit,
    };
  }
}
