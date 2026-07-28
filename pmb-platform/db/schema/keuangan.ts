import { pgTable, uuid, text, numeric, timestamp } from "drizzle-orm/pg-core";

/**
 * Cross-platform reference: pmb_fee_rates table is owned by keuangan-platform
 * but queried from pmb-platform since both share the same PostgreSQL database.
 */
export const pmbFeeRates = pgTable("pmb_fee_rates", {
  id: uuid("id").primaryKey().defaultRandom(),
  waveLabel: text("wave_label").notNull(),
  registrationFee: numeric("registration_fee", { precision: 12, scale: 2 }).default("0.00").notNull(),
  examFee: numeric("exam_fee", { precision: 12, scale: 2 }).default("0.00").notNull(),
  reregistrationFee: numeric("reregistration_fee", { precision: 12, scale: 2 }).default("0.00").notNull(),
  matriculationFee: numeric("matriculation_fee", { precision: 12, scale: 2 }).default("0.00").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
