import { pgTable, uuid, text, numeric, timestamp, date } from "drizzle-orm/pg-core";

/**
 * FR-5: Wisuda & Kegiatan Berbayar
 * Event akademik dengan target pendapatan & biaya sendiri
 */
export const paidEvents = pgTable("paid_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  eventType: text("event_type", { enum: ["wisuda", "seminar", "pelatihan", "lainnya"] }).default("wisuda").notNull(),
  targetRevenue: numeric("target_revenue", { precision: 12, scale: 2 }).default("0.00").notNull(),
  estimatedCost: numeric("estimated_cost", { precision: 12, scale: 2 }).default("0.00").notNull(),
  projectedSurplus: numeric("projected_surplus", { precision: 12, scale: 2 }).default("0.00").notNull(),
  status: text("status", { enum: ["draf", "aktif", "selesai", "dibatalkan"] }).default("draf").notNull(),
  startDate: date("start_date"),
  endDate: date("end_date"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

/**
 * Komponen biaya per event
 * FR-5.2: Tarif terperinci (Biaya Wisuda, Sertifikat, Toga, dll)
 */
export const eventFeeComponents = pgTable("event_fee_components", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventId: uuid("event_id").references(() => paidEvents.id, { onDelete: "cascade" }).notNull(),
  componentName: text("component_name").notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  description: text("description"),
});

/**
 * Pendaftaran peserta event
 * FR-5.3: Generate tagihan ke peserta & track status
 */
export const eventRegistrations = pgTable("event_registrations", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventId: uuid("event_id").references(() => paidEvents.id, { onDelete: "cascade" }).notNull(),
  studentUserId: uuid("student_user_id").notNull(),
  studentNameSnapshot: text("student_name_snapshot"),
  invoiceId: uuid("invoice_id"),
  status: text("status", { enum: ["terdaftar", "lunas", "batal"] }).default("terdaftar").notNull(),
  registeredAt: timestamp("registered_at", { withTimezone: true }).defaultNow().notNull(),
});
