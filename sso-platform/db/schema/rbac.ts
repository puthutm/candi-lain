import { pgTable, uuid, text, boolean, timestamp, unique } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./users";
import { applications } from "./applications";

export const applicationRoles = pgTable("application_roles", {
  id: uuid("id").primaryKey().defaultRandom(),
  applicationId: uuid("application_id").references(() => applications.id, { onDelete: "cascade" }).notNull(),
  roleKey: text("role_key").notNull(),
  roleName: text("role_name").notNull(),
  description: text("description"),
  isDefault: boolean("is_default").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  unique("app_role_key_uq").on(table.applicationId, table.roleKey)
]);

export const permissions = pgTable("permissions", {
  id: uuid("id").primaryKey().defaultRandom(),
  applicationId: uuid("application_id").references(() => applications.id, { onDelete: "cascade" }).notNull(),
  permissionKey: text("permission_key").notNull(),
  description: text("description"),
}, (table) => [
  unique("app_permission_key_uq").on(table.applicationId, table.permissionKey)
]);

export const rolePermissions = pgTable("role_permissions", {
  id: uuid("id").primaryKey().defaultRandom(),
  roleId: uuid("role_id").references(() => applicationRoles.id, { onDelete: "cascade" }).notNull(),
  permissionId: uuid("permission_id").references(() => permissions.id, { onDelete: "cascade" }).notNull(),
});

export const userApplicationRoles = pgTable("user_application_roles", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  applicationId: uuid("application_id").references(() => applications.id, { onDelete: "cascade" }).notNull(),
  roleId: uuid("role_id").references(() => applicationRoles.id, { onDelete: "cascade" }).notNull(),
  grantedBy: uuid("granted_by").references(() => users.id, { onDelete: "set null" }),
  grantedAt: timestamp("granted_at", { withTimezone: true }).defaultNow().notNull(),
  status: text("status").default("active").notNull(), // "active" | "revoked"
});

// Relationships
export const applicationRolesRelations = relations(applicationRoles, ({ one, many }) => ({
  application: one(applications, {
    fields: [applicationRoles.applicationId],
    references: [applications.id],
  }),
  rolePermissions: many(rolePermissions),
  userApplicationRoles: many(userApplicationRoles),
}));

export const permissionsRelations = relations(permissions, ({ one, many }) => ({
  application: one(applications, {
    fields: [permissions.applicationId],
    references: [applications.id],
  }),
  rolePermissions: many(rolePermissions),
}));

export const rolePermissionsRelations = relations(rolePermissions, ({ one }) => ({
  role: one(applicationRoles, {
    fields: [rolePermissions.roleId],
    references: [applicationRoles.id],
  }),
  permission: one(permissions, {
    fields: [rolePermissions.permissionId],
    references: [permissions.id],
  }),
}));

export const userApplicationRolesRelations = relations(userApplicationRoles, ({ one }) => ({
  user: one(users, {
    fields: [userApplicationRoles.userId],
    references: [users.id],
  }),
  application: one(applications, {
    fields: [userApplicationRoles.applicationId],
    references: [applications.id],
  }),
  role: one(applicationRoles, {
    fields: [userApplicationRoles.roleId],
    references: [applicationRoles.id],
  }),
  grantedByUser: one(users, {
    fields: [userApplicationRoles.grantedBy],
    references: [users.id],
  }),
}));

export type ApplicationRole = typeof applicationRoles.$inferSelect;
export type NewApplicationRole = typeof applicationRoles.$inferInsert;
export type Permission = typeof permissions.$inferSelect;
export type NewPermission = typeof permissions.$inferInsert;
export type RolePermission = typeof rolePermissions.$inferSelect;
export type NewRolePermission = typeof rolePermissions.$inferInsert;
export type UserApplicationRole = typeof userApplicationRoles.$inferSelect;
export type NewUserApplicationRole = typeof userApplicationRoles.$inferInsert;
