import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { roleAssignmentStatusEnum } from "./enums";
import { applications } from "./applications";
import { users } from "./users";

// Inti dari "role dinamis sesuai aplikasi luar": App Owner bisa membuat role
// baru khusus aplikasinya sendiri, kapan saja, tanpa melibatkan tim SSO.
export const applicationRoles = pgTable("application_roles", {
  id: uuid("id").primaryKey().defaultRandom(),
  applicationId: uuid("application_id")
    .notNull()
    .references(() => applications.id, { onDelete: "cascade" }),
  roleKey: varchar("role_key", { length: 100 }).notNull(), // mis. "finance_approver"
  roleName: varchar("role_name", { length: 255 }).notNull(), // mis. "Finance Approver"
  description: text("description"),
  isDefault: boolean("is_default").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
}, (table) => ({
  roleKeyUnique: uniqueIndex("application_roles_key_unique").on(
    table.applicationId,
    table.roleKey,
  ),
}));

// Permission granular opsional, juga didefinisikan per aplikasi
export const permissions = pgTable("permissions", {
  id: uuid("id").primaryKey().defaultRandom(),
  applicationId: uuid("application_id")
    .notNull()
    .references(() => applications.id, { onDelete: "cascade" }),
  permissionKey: varchar("permission_key", { length: 100 }).notNull(), // mis. "invoice:approve"
  description: text("description"),
}, (table) => ({
  permissionKeyUnique: uniqueIndex("permissions_key_unique").on(
    table.applicationId,
    table.permissionKey,
  ),
}));

export const rolePermissions = pgTable("role_permissions", {
  id: uuid("id").primaryKey().defaultRandom(),
  roleId: uuid("role_id")
    .notNull()
    .references(() => applicationRoles.id, { onDelete: "cascade" }),
  permissionId: uuid("permission_id")
    .notNull()
    .references(() => permissions.id, { onDelete: "cascade" }),
}, (table) => ({
  rolePermissionUnique: uniqueIndex("role_permissions_unique").on(
    table.roleId,
    table.permissionId,
  ),
}));

// Assignment role ke user, khusus untuk satu aplikasi.
// Inilah yang dibaca saat token/userinfo diterbitkan untuk menyusun klaim role.
export const userApplicationRoles = pgTable("user_application_roles", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  applicationId: uuid("application_id")
    .notNull()
    .references(() => applications.id, { onDelete: "cascade" }),
  roleId: uuid("role_id")
    .notNull()
    .references(() => applicationRoles.id, { onDelete: "cascade" }),
  grantedBy: uuid("granted_by").references(() => users.id),
  grantedAt: timestamp("granted_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  status: roleAssignmentStatusEnum("status").notNull().default("active"),
}, (table) => ({
  assignmentUnique: uniqueIndex("user_application_roles_unique").on(
    table.userId,
    table.applicationId,
    table.roleId,
  ),
}));
