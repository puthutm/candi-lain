import { pgTable, uuid, text, integer, timestamp, pgEnum, boolean } from "drizzle-orm/pg-core";
import { lmsSessions } from "./sessions";

export const lmsViconProviderEnum = pgEnum("lms_vicon_provider", ["jitsi_internal", "zoom", "google_meet", "custom_link"]);
export const lmsViconStatusEnum = pgEnum("lms_vicon_status", ["terjadwal", "berlangsung", "selesai"]);

export const videoConferences = pgTable("lms_video_conferences", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: uuid("session_id").references(() => lmsSessions.id, { onDelete: "cascade" }).notNull(),
  title: text("title").notNull(),
  provider: lmsViconProviderEnum("provider").default("jitsi_internal").notNull(),
  meetingLink: text("meeting_link").notNull(),
  scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
  durationMinutes: integer("duration_minutes").notNull(),
  autoAttendanceEnabled: boolean("auto_attendance_enabled").default(true).notNull(),
  status: lmsViconStatusEnum("status").default("terjadwal").notNull(),
  recordingUrl: text("recording_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const vcAttendances = pgTable("lms_vc_attendances", {
  id: uuid("id").primaryKey().defaultRandom(),
  videoConferenceId: uuid("video_conference_id").references(() => videoConferences.id, { onDelete: "cascade" }).notNull(),
  userId: uuid("user_id").notNull(), // SSO User ID ref
  joinedAt: timestamp("joined_at", { withTimezone: true }).defaultNow().notNull(),
  leftAt: timestamp("left_at", { withTimezone: true }),
  countedAsPresent: boolean("counted_as_present").default(false).notNull(),
});
