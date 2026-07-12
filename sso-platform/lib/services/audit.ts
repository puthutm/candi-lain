import { db } from "@/db";
import { auditLogs } from "@/db/schema/audit";
import { auditQueue } from "../redis";
import { eq, and, gte, lte, desc } from "drizzle-orm";

export interface AuditQueryParams {
  actorUserId?: string;
  action?: string;
  entityType?: string;
  entityId?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export class AuditService {
  /**
   * Log an event by pushing to Redis queue (non-blocking)
   */
  static async log(params: {
    actorUserId: string;
    action: string;
    entityType: string;
    entityId: string;
    metadata?: Record<string, any>;
  }): Promise<void> {
    await auditQueue.push({
      actorUserId: params.actorUserId,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      metadata: params.metadata || null,
      createdAt: new Date().toISOString(),
    });
  }

  /**
   * Process pending items from Redis queue and bulk insert them into DB
   * Returns number of processed events
   */
  static async processQueue(batchSize: number = 100): Promise<number> {
    const events: any[] = [];

    for (let i = 0; i < batchSize; i++) {
      const event = await auditQueue.pop();
      if (!event) break;
      events.push(event);
    }

    if (events.length === 0) return 0;

    const valuesToInsert = events.map((e) => ({
      actorUserId: e.actorUserId,
      action: e.action,
      entityType: e.entityType,
      entityId: e.entityId,
      metadata: e.metadata,
      createdAt: new Date(e.createdAt),
    }));

    await db.insert(auditLogs).values(valuesToInsert);
    return valuesToInsert.length;
  }

  /**
   * Background queue worker loop. Periodically runs queue processing.
   */
  private static workerActive = false;

  static startQueueWorker(intervalMs: number = 5000): void {
    if (this.workerActive) return;
    this.workerActive = true;

    const run = async () => {
      try {
        let processedCount = 0;
        do {
          processedCount = await this.processQueue();
        } while (processedCount > 0);
      } catch (err) {
        console.error("Audit worker failed to process queue:", err);
      } finally {
        setTimeout(run, intervalMs);
      }
    };

    setTimeout(run, intervalMs);
  }

  /**
   * Query audit logs with pagination and filters
   */
  static async query(params: AuditQueryParams): Promise<Array<typeof auditLogs.$inferSelect>> {
    const conditions = [];

    if (params.actorUserId) {
      conditions.push(eq(auditLogs.actorUserId, params.actorUserId));
    }
    if (params.action) {
      conditions.push(eq(auditLogs.action, params.action));
    }
    if (params.entityType) {
      conditions.push(eq(auditLogs.entityType, params.entityType));
    }
    if (params.entityId) {
      conditions.push(eq(auditLogs.entityId, params.entityId));
    }
    if (params.startDate) {
      conditions.push(gte(auditLogs.createdAt, params.startDate));
    }
    if (params.endDate) {
      conditions.push(lte(auditLogs.createdAt, params.endDate));
    }

    const baseQuery = db
      .select()
      .from(auditLogs)
      .orderBy(desc(auditLogs.createdAt));

    if (conditions.length > 0) {
      baseQuery.where(and(...conditions));
    }

    const limit = params.limit ?? 50;
    const offset = params.offset ?? 0;

    return baseQuery.limit(limit).offset(offset);
  }

  /**
   * Retrieve recent logs for a specific user
   */
  static async getRecentActivity(
    userId: string,
    limit: number = 10
  ): Promise<Array<typeof auditLogs.$inferSelect>> {
    return db
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.actorUserId, userId))
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit);
  }
}

// Start background worker loop automatically when the module loads
AuditService.startQueueWorker();

