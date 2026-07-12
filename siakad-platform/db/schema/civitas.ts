import { pgTable, uuid, text, integer, date, numeric } from "drizzle-orm/pg-core";
import { siakadStudyPrograms, siakadCurricula } from "./master";
import { users } from "./users";
import { pmbApplicants } from "./pmb";

export const siakadLecturers = pgTable("siakad_lecturers", {
  id: uuid("id").primaryKey().defaultRandom(),
  nidn: text("nidn").unique().notNull(),
  fullName: text("full_name").notNull(),
  studyProgramId: uuid("study_program_id").references(() => siakadStudyPrograms.id).notNull(), // Homebase
  position: text("position"), // Jabatan fungsional
  bkdLoad: numeric("bkd_load", { precision: 5, scale: 2 }).default("0.00").notNull(),
  userId: uuid("user_id").references(() => users.id), // Ref to SSO users
});

export const siakadStudents = pgTable("siakad_students", {
  id: uuid("id").primaryKey().defaultRandom(),
  nim: text("nim").unique(), // null before onboarding completes
  applicantId: uuid("applicant_id").references(() => pmbApplicants.id), // Ref to PMB applicants
  fullName: text("full_name").notNull(),
  birthPlace: text("birth_place").notNull(),
  birthDate: date("birth_date").notNull(),
  gender: text("gender", { enum: ["L", "P"] }).notNull(),
  religion: text("religion").notNull(),
  address: text("address").notNull(),
  studyProgramId: uuid("study_program_id").references(() => siakadStudyPrograms.id).notNull(),
  angkatan: integer("angkatan").notNull(),
  currentSemester: integer("current_semester").default(1).notNull(),
  academicStatus: text("academic_status", { enum: ["aktif", "cuti", "lulus", "keluar", "drop_out"] }).default("aktif").notNull(),
  dosenPaId: uuid("dosen_pa_id").references(() => siakadLecturers.id), // PA Advisor
  entryPath: text("entry_path", { enum: ["mandiri", "beasiswa", "karyawan", "transfer"] }).default("mandiri").notNull(),
  ipk: numeric("ipk", { precision: 3, scale: 2 }).default("0.00").notNull(),
  totalSksLulus: integer("total_sks_lulus").default(0).notNull(),
  curriculumId: uuid("curriculum_id").references(() => siakadCurricula.id),
  campusEmail: text("campus_email"),
  personalEmail: text("personal_email").notNull(),
  phone: text("phone").notNull(),
  emergencyContact: text("emergency_contact"),
  userId: uuid("user_id").references(() => users.id), // Ref to SSO users for login
  accountStatus: text("account_status", { enum: ["aktif", "suspend", "reset_pending"] }).default("aktif").notNull(),
});
