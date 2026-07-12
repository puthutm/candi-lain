import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { lmsClasses } from "./classes";

export const lmsForumPosts = pgTable("lms_forum_posts", {
  id: uuid("id").primaryKey().defaultRandom(),
  classId: uuid("class_id").references(() => lmsClasses.id, { onDelete: "cascade" }).notNull(),
  authorName: text("author_name").notNull(),
  authorRole: text("author_role").notNull(), // 'dosen' | 'mahasiswa'
  authorUserId: text("author_user_id").notNull(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  type: text("type").default("question").notNull(), // 'pengumuman' | 'berkas' | 'tugas' | 'kuis' | 'vicon' | 'materi'
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const lmsForumReplies = pgTable("lms_forum_replies", {
  id: uuid("id").primaryKey().defaultRandom(),
  postId: uuid("post_id").references(() => lmsForumPosts.id, { onDelete: "cascade" }).notNull(),
  authorName: text("author_name").notNull(),
  authorRole: text("author_role").notNull(),
  authorUserId: text("author_user_id").notNull(),
  body: text("body").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
