import { pgTable, uuid, text, boolean, integer } from "drizzle-orm/pg-core";

export const organizationUnits = pgTable("organization_units", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: text("code").unique().notNull(),
  name: text("name").notNull(),
  type: text("type", { enum: ["fakultas", "prodi", "biro", "unit"] }).notNull(),
  parentId: uuid("parent_id"),
});

export const positions = pgTable("positions", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  abbreviation: text("abbreviation").notNull(),
  functionalAllowance: integer("functional_allowance").default(0).notNull(),
  rankGroup: text("rank_group").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
});
