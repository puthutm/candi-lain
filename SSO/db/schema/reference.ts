import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  boolean,
  timestamp,
  uniqueIndex,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";
import { organizationTypeEnum } from "./enums";
import { users } from "./users";

// ---------------------------------------------------------------------------
// Modul reference data ini SENGAJA dibuat generik & tidak menempel ke
// aplikasi/modul manapun (BR-05 / FR-6). Kategori baru (mis. "Jabatan",
// "Status Pegawai", "Grade") cukup ditambahkan sebagai data, bukan tabel
// baru — inilah yang membuatnya reusable saat modul-modul ERP dibangun.
// ---------------------------------------------------------------------------

export const refCategories = pgTable("ref_categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: varchar("code", { length: 100 }).notNull(), // mis. "JABATAN", "UNIT_KERJA"
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
}, (table) => ({
  codeUnique: uniqueIndex("ref_categories_code_unique").on(table.code),
}));

export const refItems = pgTable("ref_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  categoryId: uuid("category_id")
    .notNull()
    .references(() => refCategories.id, { onDelete: "cascade" }),
  // Self-reference untuk item berjenjang, mis. Unit Kerja > Sub Unit
  parentId: uuid("parent_id").references((): AnyPgColumn => refItems.id),
  code: varchar("code", { length: 100 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  extraValue: text("extra_value"), // JSON bebas, mis. { "grade": 5 }
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
}, (table) => ({
  itemUnique: uniqueIndex("ref_items_category_code_unique").on(
    table.categoryId,
    table.code,
  ),
}));

// Struktur unit organisasi — dipisah dari ref_items karena punya kebutuhan
// query/hirarki yang lebih spesifik (dipakai luas oleh modul HRIS/ERP nanti).
export const organizations = pgTable("organizations", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: varchar("code", { length: 100 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  parentId: uuid("parent_id").references((): AnyPgColumn => organizations.id),
  type: organizationTypeEnum("type").notNull().default("department"),
  isActive: boolean("is_active").notNull().default(true),
}, (table) => ({
  codeUnique: uniqueIndex("organizations_code_unique").on(table.code),
}));

export const userOrganizations = pgTable("user_organizations", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  // Merujuk ke ref_items berkategori "JABATAN"
  positionRefItemId: uuid("position_ref_item_id").references(
    (): AnyPgColumn => refItems.id,
  ),
  isPrimary: boolean("is_primary").notNull().default(false),
}, (table) => ({
  userOrgUnique: uniqueIndex("user_organizations_unique").on(
    table.userId,
    table.organizationId,
  ),
}));
