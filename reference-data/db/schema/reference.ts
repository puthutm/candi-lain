import { pgTable, uuid, text, boolean, integer, timestamp, jsonb, unique } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./users";

export const refCategories = pgTable("ref_categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: text("code").unique().notNull(),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const refItems = pgTable("ref_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  categoryId: uuid("category_id").references(() => refCategories.id, { onDelete: "cascade" }).notNull(),
  parentId: uuid("parent_id").references((): any => refItems.id, { onDelete: "set null" }),
  code: text("code").notNull(),
  name: text("name").notNull(),
  extraValue: jsonb("extra_value"),
  sortOrder: integer("sort_order").default(0).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  unique("category_item_code_uq").on(table.categoryId, table.code)
]);

export const organizations = pgTable("organizations", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: text("code").unique().notNull(),
  name: text("name").notNull(),
  parentId: uuid("parent_id").references((): any => organizations.id, { onDelete: "set null" }),
  type: text("type").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const userOrganizations = pgTable("user_organizations", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  organizationId: uuid("organization_id").references(() => organizations.id, { onDelete: "cascade" }).notNull(),
  positionRefItemId: uuid("position_ref_item_id").references(() => refItems.id, { onDelete: "set null" }),
  isPrimary: boolean("is_primary").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// Relations
export const refCategoriesRelations = relations(refCategories, ({ many }) => ({
  items: many(refItems),
}));

export const refItemsRelations = relations(refItems, ({ one, many }) => ({
  category: one(refCategories, {
    fields: [refItems.categoryId],
    references: [refCategories.id],
  }),
  parent: one(refItems, {
    fields: [refItems.parentId],
    references: [refItems.id],
    relationName: "refItemsHierarchy",
  }),
  children: many(refItems, {
    relationName: "refItemsHierarchy",
  }),
  userOrganizations: many(userOrganizations),
}));

export const organizationsRelations = relations(organizations, ({ one, many }) => ({
  parent: one(organizations, {
    fields: [organizations.parentId],
    references: [organizations.id],
    relationName: "organizationsHierarchy",
  }),
  children: many(organizations, {
    relationName: "organizationsHierarchy",
  }),
  userOrganizations: many(userOrganizations),
}));

export const userOrganizationsRelations = relations(userOrganizations, ({ one }) => ({
  user: one(users, {
    fields: [userOrganizations.userId],
    references: [users.id],
  }),
  organization: one(organizations, {
    fields: [userOrganizations.organizationId],
    references: [organizations.id],
  }),
  position: one(refItems, {
    fields: [userOrganizations.positionRefItemId],
    references: [refItems.id],
  }),
}));

export type RefCategory = typeof refCategories.$inferSelect;
export type RefItem = typeof refItems.$inferSelect;
export type Organization = typeof organizations.$inferSelect;
export type UserOrganization = typeof userOrganizations.$inferSelect;
