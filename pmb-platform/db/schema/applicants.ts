import { pgTable, uuid, text, boolean, timestamp, date, jsonb } from "drizzle-orm/pg-core";
import { pmbWaves, pmbEntryPaths, pmbStudyPrograms } from "./master";

export const pmbApplicants = pgTable("pmb_applicants", {
  id: uuid("id").primaryKey().defaultRandom(),
  registrationNumber: text("registration_number").unique().notNull(),
  fullName: text("full_name").notNull(),
  email: text("email").unique().notNull(),
  phone: text("phone").notNull(),
  passwordHash: text("password_hash").notNull(),
  waveId: uuid("wave_id").references(() => pmbWaves.id).notNull(),
  entryPathId: uuid("entry_path_id").references(() => pmbEntryPaths.id).notNull(),
  studyProgramId: uuid("study_program_id").references(() => pmbStudyPrograms.id).notNull(),
  currentStage: text("current_stage", {
    enum: [
      "peminat",
      "pendaftar",
      "isi_biodata",
      "unggah_berkas",
      "siap_ujian",
      "sedang_ujian",
      "selesai_ujian",
      "diterima",
      "tidak_lulus"
    ]
  }).default("peminat").notNull(),
  paymentStatus: text("payment_status", { enum: ["belum_bayar", "lunas"] }).default("belum_bayar").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const pmbApplicantProfiles = pgTable("pmb_applicant_profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  applicantId: uuid("applicant_id").references(() => pmbApplicants.id, { onDelete: "cascade" }).unique().notNull(),
  nik: text("nik").notNull(),
  birthPlace: text("birth_place").notNull(),
  birthDate: date("birth_date").notNull(),
  gender: text("gender", { enum: ["L", "P"] }).notNull(),
  address: text("address").notNull(),
  parentName: text("parent_name").notNull(),
  photoUrl: text("photo_url"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const pmbDocumentTypes = pgTable("pmb_document_types", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(), // KTP, Ijazah/SKL, Rapor, Pas Foto
  code: text("code").unique().notNull(),
  isRequired: boolean("is_required").default(true).notNull(),
  appliesToRule: jsonb("applies_to_rule"),
});

export const pmbApplicantDocuments = pgTable("pmb_applicant_documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  applicantId: uuid("applicant_id").references(() => pmbApplicants.id, { onDelete: "cascade" }).notNull(),
  documentTypeId: uuid("document_type_id").references(() => pmbDocumentTypes.id).notNull(),
  fileUrl: text("file_url").notNull(),
  status: text("status", {
    enum: ["belum_upload", "menunggu_verifikasi", "terverifikasi", "perlu_revisi"]
  }).default("belum_upload").notNull(),
  revisionNote: text("revision_note"),
  verifiedByStaffId: uuid("verified_by_staff_id"), // Refers to SSO Core users.id
  verifiedAt: timestamp("verified_at", { withTimezone: true }),
  uploadedAt: timestamp("uploaded_at", { withTimezone: true }).defaultNow().notNull(),
});

export const pmbApplicantStatusHistory = pgTable("pmb_applicant_status_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  applicantId: uuid("applicant_id").references(() => pmbApplicants.id, { onDelete: "cascade" }).notNull(),
  fromStage: text("from_stage").notNull(),
  toStage: text("to_stage").notNull(),
  changedByStaffId: uuid("changed_by_staff_id"), // Refers to SSO Core users.id, null if system automated
  note: text("note"),
  changedAt: timestamp("changed_at", { withTimezone: true }).defaultNow().notNull(),
});
