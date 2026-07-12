import { pgTable, uuid, text } from "drizzle-orm/pg-core";

export const pmbApplicants = pgTable("pmb_applicants", {
  id: uuid("id").primaryKey().defaultRandom(),
  registrationNumber: text("registration_number").unique().notNull(),
  fullName: text("full_name").notNull(),
  email: text("email").unique().notNull(),
});
