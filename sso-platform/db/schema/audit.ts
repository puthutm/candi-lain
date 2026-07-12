import { pgTable, uuid, text, timestamp, jsonb, index } from "drizzle-orm/pg-core";

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  actorUserId: text("actor_user_id").notNull(), // Can be user ID or "system"
  action: text("action").notNull(), // "LOGIN_SUCCESS", "LOGIN_FAILURE", "TOKEN_ISSUED", etc.
  entityType: text("entity_type").notNull(), // "user", "application", "role", etc.
  entityId: text("entity_id").notNull(), // ID of the modified entity
  metadata: jsonb("metadata"), // Extra context/payload
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("audit_actor_idx").on(table.actorUserId),
  index("audit_action_idx").on(table.action),
  index("audit_entity_idx").on(table.entityType, table.entityId),
  index("audit_created_at_idx").on(table.createdAt)
]);

export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;
