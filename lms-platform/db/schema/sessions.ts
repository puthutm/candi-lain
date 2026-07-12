import { pgTable, uuid, text, integer, timestamp, pgEnum, jsonb, date, numeric } from "drizzle-orm/pg-core";
import { lmsClasses } from "./classes";

export const lmsSessionMethodEnum = pgEnum("lms_session_method", ["daring_sinkronus", "daring_asinkronus", "hybrid"]);
export const lmsSessionStatusEnum = pgEnum("lms_session_status", ["belum_dimulai", "berlangsung", "selesai"]);
export const lmsMaterialTypeEnum = pgEnum("lms_material_type", ["dokumen", "video", "tautan"]);
export const lmsPublishModeEnum = pgEnum("lms_publish_mode", ["sekarang", "terjadwal"]);
export const lmsVerificationStatusEnum = pgEnum("lms_verification_status", ["menunggu_prodi", "menunggu_bpm", "terbit", "revisi"]);
export const lmsSubmissionStatusEnum = pgEnum("lms_submission_status", ["belum_dikerjakan", "draft", "terkirim", "dinilai"]);
export const lmsVideoSourceTypeEnum = pgEnum("lms_video_source_type", ["upload_mp4", "youtube_url"]);
export const lmsQuestionTypeEnum = pgEnum("lms_question_type", ["pilihan_ganda", "esai"]);

export const lmsSessions = pgTable("lms_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  classId: uuid("class_id").references(() => lmsClasses.id, { onDelete: "cascade" }).notNull(),
  sessionNumber: integer("session_number").notNull(),
  topic: text("topic").notNull(),
  description: text("description"),
  sessionDate: date("session_date"),
  startTime: text("start_time"), // time string as HH:MM
  endTime: text("end_time"), // time string as HH:MM
  method: lmsSessionMethodEnum("method").default("daring_asinkronus").notNull(),
  status: lmsSessionStatusEnum("status").default("belum_dimulai").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const lmsMaterials = pgTable("lms_materials", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: uuid("session_id").references(() => lmsSessions.id, { onDelete: "cascade" }).notNull(),
  materialType: lmsMaterialTypeEnum("material_type").notNull(),
  title: text("title").notNull(),
  fileUrl: text("file_url").notNull(),
  durationSeconds: integer("duration_seconds"), // for video materials
  publishMode: lmsPublishModeEnum("publish_mode").default("sekarang").notNull(),
  scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
  verificationStatus: lmsVerificationStatusEnum("verification_status").default("menunggu_prodi").notNull(),
  verifiedByProdiUserId: uuid("verified_by_prodi_user_id"),
  verifiedByProdiAt: timestamp("verified_by_prodi_at", { withTimezone: true }),
  verifiedByBpmUserId: uuid("verified_by_bpm_user_id"),
  verifiedByBpmAt: timestamp("verified_by_bpm_at", { withTimezone: true }),
  revisionNote: text("revision_note"),
  viewCount: integer("view_count").default(0).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const lmsAssignments = pgTable("lms_assignments", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: uuid("session_id").references(() => lmsSessions.id, { onDelete: "cascade" }).notNull(),
  title: text("title").notNull(),
  instructions: text("instructions").notNull(),
  attachmentUrl: text("attachment_url"),
  deadline: timestamp("deadline", { withTimezone: true }),
  weightPercent: numeric("weight_percent", { precision: 5, scale: 2 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const assignmentSubmissions = pgTable("lms_assignment_submissions", {
  id: uuid("id").primaryKey().defaultRandom(),
  assignmentId: uuid("assignment_id").references(() => lmsAssignments.id, { onDelete: "cascade" }).notNull(),
  studentUserId: uuid("student_user_id").notNull(), // SSO User ID ref
  answerText: text("answer_text"),
  attachmentUrl: text("attachment_url"),
  status: lmsSubmissionStatusEnum("status").default("belum_dikerjakan").notNull(),
  submittedAt: timestamp("submitted_at", { withTimezone: true }),
  score: numeric("score", { precision: 5, scale: 2 }),
  feedback: text("feedback"),
  gradedByUserId: uuid("graded_by_user_id"),
  gradedAt: timestamp("graded_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const submissionAnnotations = pgTable("lms_submission_annotations", {
  id: uuid("id").primaryKey().defaultRandom(),
  submissionId: uuid("submission_id").references(() => assignmentSubmissions.id, { onDelete: "cascade" }).notNull(),
  pageNumber: integer("page_number").notNull(),
  position: jsonb("position").notNull(), // coordinate properties like x, y, width, height
  note: text("note").notNull(),
  createdByUserId: uuid("created_by_user_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const interactiveVideos = pgTable("lms_interactive_videos", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: uuid("session_id").references(() => lmsSessions.id, { onDelete: "cascade" }).notNull(),
  title: text("title").notNull(),
  sourceType: lmsVideoSourceTypeEnum("source_type").default("upload_mp4").notNull(),
  videoUrl: text("video_url").notNull(),
  durationSeconds: integer("duration_seconds"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const videoMarkers = pgTable("lms_video_markers", {
  id: uuid("id").primaryKey().defaultRandom(),
  interactiveVideoId: uuid("interactive_video_id").references(() => interactiveVideos.id, { onDelete: "cascade" }).notNull(),
  timestampSeconds: integer("timestamp_seconds").notNull(),
  questionText: text("question_text").notNull(),
  questionType: lmsQuestionTypeEnum("question_type").default("pilihan_ganda").notNull(),
  options: jsonb("options"), // array of options for multiple choice questions
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const videoMarkerAnswers = pgTable("lms_video_marker_answers", {
  id: uuid("id").primaryKey().defaultRandom(),
  markerId: uuid("marker_id").references(() => videoMarkers.id, { onDelete: "cascade" }).notNull(),
  studentUserId: uuid("student_user_id").notNull(),
  answerText: text("answer_text").notNull(),
  answeredAt: timestamp("answered_at", { withTimezone: true }).defaultNow().notNull(),
});
