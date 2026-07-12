import { pgTable, uuid, text, boolean, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { pmbApplicants } from "./applicants";

export const pmbMessageTemplates = pgTable("pmb_message_templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(), // Welcome Email, Payment Reminder, Acceptance Letter
  triggerEvent: text("trigger_event").notNull(),
  channel: text("channel", { enum: ["email", "whatsapp"] }).notNull(),
  subject: text("subject"),
  body: text("body").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
});

export const pmbCampaigns = pgTable("pmb_campaigns", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  segmentFilter: jsonb("segment_filter"),
  channel: text("channel", { enum: ["email", "whatsapp"] }).notNull(),
  scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
  status: text("status", { enum: ["draft", "terjadwal", "terkirim"] }).default("draft").notNull(),
  sentCount: integer("sent_count").default(0).notNull(),
  openedCount: integer("opened_count").default(0).notNull(),
  clickedCount: integer("clicked_count").default(0).notNull(),
});

export const pmbAutomationWorkflows = pgTable("pmb_automation_workflows", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  triggerEvent: text("trigger_event").notNull(), // form_submitted, 3_hari_tanpa_bayar, payment_confirmed
  delayMinutes: integer("delay_minutes").default(0).notNull(),
  messageTemplateId: uuid("message_template_id").references(() => pmbMessageTemplates.id, { onDelete: "cascade" }).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
});

export const pmbMessageLogs = pgTable("pmb_message_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  applicantId: uuid("applicant_id").references(() => pmbApplicants.id, { onDelete: "cascade" }).notNull(),
  messageTemplateId: uuid("message_template_id").references(() => pmbMessageTemplates.id, { onDelete: "set null" }),
  campaignId: uuid("campaign_id").references(() => pmbCampaigns.id, { onDelete: "set null" }),
  channel: text("channel", { enum: ["email", "whatsapp"] }).notNull(),
  status: text("status", { enum: ["terkirim", "gagal", "dibuka", "diklik"] }).notNull(),
  sentAt: timestamp("sent_at", { withTimezone: true }).defaultNow().notNull(),
});
