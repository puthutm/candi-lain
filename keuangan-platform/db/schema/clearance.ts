import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";

export const financeClearanceStatus = pgTable("finance_clearance_status", {
  id: uuid("id").primaryKey().defaultRandom(),
  studentUserId: uuid("student_user_id").unique().notNull(),
  status: text("status", { enum: ["aktif", "tertahan"] }).default("aktif").notNull(),
  reason: text("reason"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
