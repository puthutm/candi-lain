import { pgTable, uuid, text } from "drizzle-orm/pg-core";

export const siakadStudyPrograms = pgTable("siakad_study_programs", {
  id: uuid("id").primaryKey(),
  name: text("name").notNull(),
});

export const siakadStudents = pgTable("siakad_students", {
  id: uuid("id").primaryKey(),
  userId: uuid("user_id").notNull(),
  fullName: text("full_name").notNull(),
  studyProgramId: uuid("study_program_id").references(() => siakadStudyPrograms.id).notNull(),
  academicStatus: text("academic_status").notNull(),
});
