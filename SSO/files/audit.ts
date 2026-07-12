import { pgTable, uuid, varchar, text, timestamp } from "drizzle-orm/pg-core";
import { users } from "./users";

// Tidak ada hard delete untuk data identitas/konfigurasi — semua perubahan
// penting (login, revoke token, ubah role, ubah konfigurasi aplikasi)
// tercatat di sini (BR-06 / FR-7).
export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  actorUserId: uuid("actor_user_id").references(() => users.id),
  action: varchar("action", { length: 100 }).notNull(), // mis. "APPLICATION_CREATED"
  entityType: varchar("entity_type", { length: 100 }).notNull(), // mis. "application"
  entityId: varchar("entity_id", { length: 255 }).notNull(),
  metadata: text("metadata"), // JSON bebas, detail perubahan
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
