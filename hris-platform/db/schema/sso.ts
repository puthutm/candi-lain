import { pgTable, uuid, text, timestamp, boolean } from "drizzle-orm/pg-core";

export const ssoUsers = pgTable("users", {
  id: uuid("id").primaryKey(),
  username: text("username").unique().notNull(),
  email: text("email").unique().notNull(),
  passwordHash: text("password_hash").notNull(),
  fullName: text("full_name").notNull(),
  status: text("status").default("active").notNull(),
});

export const ssoApplications = pgTable("applications", {
  id: uuid("id").primaryKey(),
  name: text("name").notNull(),
  clientId: text("client_id").unique().notNull(),
});

export const ssoApplicationRoles = pgTable("application_roles", {
  id: uuid("id").primaryKey(),
  applicationId: uuid("application_id").notNull(),
  roleKey: text("role_key").notNull(),
  roleName: text("role_name").notNull(),
});

export const ssoUserApplicationRoles = pgTable("user_application_roles", {
  id: uuid("id").primaryKey(),
  userId: uuid("user_id").notNull(),
  applicationId: uuid("application_id").notNull(),
  roleId: uuid("role_id").notNull(),
  status: text("status").default("active").notNull(),
});

export const ssoOauthAuthorizationCodes = pgTable("oauth_authorization_codes", {
  id: uuid("id").primaryKey(),
  code: text("code").unique().notNull(),
  userId: uuid("user_id").notNull(),
  applicationId: uuid("application_id").notNull(),
  redirectUri: text("redirect_uri").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  used: boolean("used").default(false).notNull(),
});
