import { db } from "@/db";
import { refCategories, refItems, organizations, userOrganizations } from "@/db/schema/reference";
import { eq, and } from "drizzle-orm";
import { auditQueue } from "../redis";

export interface RefItemTree {
  id: string;
  categoryId: string;
  parentId: string | null;
  code: string;
  name: string;
  extraValue: any | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  children: RefItemTree[];
}

export interface OrgTree {
  id: string;
  code: string;
  name: string;
  parentId: string | null;
  type: string;
  isActive: boolean;
  createdAt: Date;
  children: OrgTree[];
}

export class ReferenceDataService {
  // ==========================================
  // Category Management
  // ==========================================

  static async createCategory(params: {
    code: string;
    name: string;
    description?: string;
  }): Promise<typeof refCategories.$inferSelect> {
    const cleanCode = params.code.toUpperCase().trim();
    if (!/^[A-Z0-9_]+$/.test(cleanCode)) {
      throw new Error("Category code must be alphanumeric in UPPERCASE and contain only letters, numbers, and underscores");
    }

    const existing = await db
      .select()
      .from(refCategories)
      .where(eq(refCategories.code, cleanCode))
      .limit(1);

    if (existing[0]) {
      throw new Error(`Category code '${cleanCode}' already exists`);
    }

    const [category] = await db
      .insert(refCategories)
      .values({
        code: cleanCode,
        name: params.name,
        description: params.description || null,
      })
      .returning();

    if (!category) throw new Error("Failed to create category");

    await auditQueue.push({
      actorUserId: "system",
      action: "REFERENCE_DATA_CREATED",
      entityType: "ref_category",
      entityId: category.id,
      metadata: { code: cleanCode },
    });

    return category;
  }

  static async updateCategory(
    categoryId: string,
    params: { name?: string; description?: string }
  ): Promise<typeof refCategories.$inferSelect> {
    const [updated] = await db
      .update(refCategories)
      .set({
        name: params.name,
        description: params.description,
      })
      .where(eq(refCategories.id, categoryId))
      .returning();

    if (!updated) throw new Error("Category not found");
    return updated;
  }

  static async deleteCategory(categoryId: string): Promise<void> {
    const activeItems = await db
      .select()
      .from(refItems)
      .where(
        and(
          eq(refItems.categoryId, categoryId),
          eq(refItems.isActive, true)
        )
      )
      .limit(1);

    if (activeItems[0]) {
      throw new Error("Cannot delete category containing active items");
    }

    await db.delete(refCategories).where(eq(refCategories.id, categoryId));
  }

  static async getCategories(): Promise<Array<typeof refCategories.$inferSelect>> {
    return db.select().from(refCategories).orderBy(refCategories.createdAt);
  }

  static async getCategoryByCode(code: string): Promise<typeof refCategories.$inferSelect | null> {
    const list = await db
      .select()
      .from(refCategories)
      .where(eq(refCategories.code, code.toUpperCase()))
      .limit(1);
    return list[0] || null;
  }

  // ==========================================
  // Item Management
  // ==========================================

  static async createItem(params: {
    categoryId: string;
    parentId?: string | null;
    code: string;
    name: string;
    extraValue?: Record<string, any>;
    sortOrder?: number;
    isActive?: boolean;
  }): Promise<typeof refItems.$inferSelect> {
    const cleanCode = params.code.trim();

    if (params.extraValue) {
      const jsonSize = Buffer.byteLength(JSON.stringify(params.extraValue));
      if (jsonSize > 10 * 1024) {
        throw new Error("extraValue JSON payload size exceeds the 10KB limit");
      }
    }

    const existing = await db
      .select()
      .from(refItems)
      .where(
        and(
          eq(refItems.categoryId, params.categoryId),
          eq(refItems.code, cleanCode)
        )
      )
      .limit(1);

    if (existing[0]) {
      throw new Error(`Item code '${cleanCode}' already exists for this category`);
    }

    if (params.parentId) {
      const parent = await db
        .select()
        .from(refItems)
        .where(eq(refItems.id, params.parentId))
        .limit(1);
      
      if (!parent[0] || parent[0].categoryId !== params.categoryId) {
        throw new Error("Parent item does not belong to the same category");
      }
    }

    const [item] = await db
      .insert(refItems)
      .values({
        categoryId: params.categoryId,
        parentId: params.parentId || null,
        code: cleanCode,
        name: params.name,
        extraValue: params.extraValue || null,
        sortOrder: params.sortOrder ?? 0,
        isActive: params.isActive ?? true,
      })
      .returning();

    if (!item) throw new Error("Failed to create item");

    return item;
  }

  static async updateItem(
    itemId: string,
    params: {
      parentId?: string | null;
      code?: string;
      name?: string;
      extraValue?: Record<string, any>;
      sortOrder?: number;
      isActive?: boolean;
    }
  ): Promise<typeof refItems.$inferSelect> {
    const currentList = await db.select().from(refItems).where(eq(refItems.id, itemId)).limit(1);
    const current = currentList[0];
    if (!current) throw new Error("Item not found");

    if (params.extraValue) {
      const jsonSize = Buffer.byteLength(JSON.stringify(params.extraValue));
      if (jsonSize > 10 * 1024) {
        throw new Error("extraValue JSON payload size exceeds the 10KB limit");
      }
    }

    if (params.parentId !== undefined) {
      if (params.parentId === itemId) {
        throw new Error("An item cannot be its own parent");
      }

      if (params.parentId) {
        const parentList = await db.select().from(refItems).where(eq(refItems.id, params.parentId)).limit(1);
        const parent = parentList[0];
        if (!parent || parent.categoryId !== current.categoryId) {
          throw new Error("Parent item does not belong to the same category");
        }

        let currentParentId: string | null = params.parentId;
        while (currentParentId) {
          if (currentParentId === itemId) {
            throw new Error("Circular parent reference detected");
          }
          const nextParentList = await db.select({ parentId: refItems.parentId }).from(refItems).where(eq(refItems.id, currentParentId)).limit(1);
          currentParentId = nextParentList[0]?.parentId || null;
        }
      }
    }

    const [updated] = await db
      .update(refItems)
      .set({
        parentId: params.parentId === undefined ? current.parentId : params.parentId,
        code: params.code === undefined ? current.code : params.code.trim(),
        name: params.name === undefined ? current.name : params.name,
        extraValue: params.extraValue === undefined ? current.extraValue : params.extraValue,
        sortOrder: params.sortOrder === undefined ? current.sortOrder : params.sortOrder,
        isActive: params.isActive === undefined ? current.isActive : params.isActive,
      })
      .where(eq(refItems.id, itemId))
      .returning();

    if (!updated) throw new Error("Item not found during update");
    return updated;
  }

  static async deleteItem(itemId: string): Promise<void> {
    await db
      .update(refItems)
      .set({ isActive: false })
      .where(eq(refItems.id, itemId));
  }

  static async getItemsByCategory(categoryCode: string): Promise<Array<typeof refItems.$inferSelect>> {
    const category = await this.getCategoryByCode(categoryCode);
    if (!category) return [];

    return db
      .select()
      .from(refItems)
      .where(
        and(
          eq(refItems.categoryId, category.id),
          eq(refItems.isActive, true)
        )
      )
      .orderBy(refItems.sortOrder);
  }

  static async getItemHierarchy(categoryCode: string): Promise<RefItemTree[]> {
    const category = await this.getCategoryByCode(categoryCode);
    if (!category) return [];

    const allItems = await db
      .select()
      .from(refItems)
      .where(
        and(
          eq(refItems.categoryId, category.id),
          eq(refItems.isActive, true)
        )
      )
      .orderBy(refItems.sortOrder);

    const buildTree = (parentId: string | null): RefItemTree[] => {
      return allItems
        .filter(item => item.parentId === parentId)
        .map(item => ({
          ...item,
          children: buildTree(item.id),
        }));
    };

    return buildTree(null);
  }

  // ==========================================
  // Organization Management
  // ==========================================

  static async createOrganization(params: {
    code: string;
    name: string;
    parentId?: string | null;
    type: "company" | "division" | "department" | string;
    isActive?: boolean;
  }): Promise<typeof organizations.$inferSelect> {
    const cleanCode = params.code.trim();

    const existing = await db
      .select()
      .from(organizations)
      .where(eq(organizations.code, cleanCode))
      .limit(1);

    if (existing[0]) {
      throw new Error(`Organization unit code '${cleanCode}' already exists`);
    }

    const [org] = await db
      .insert(organizations)
      .values({
        code: cleanCode,
        name: params.name,
        parentId: params.parentId || null,
        type: params.type,
        isActive: params.isActive ?? true,
      })
      .returning();

    if (!org) throw new Error("Failed to create organization unit");

    return org;
  }

  static async updateOrganization(
    orgId: string,
    params: {
      name?: string;
      parentId?: string | null;
      type?: "company" | "division" | "department" | string;
      isActive?: boolean;
    }
  ): Promise<typeof organizations.$inferSelect> {
    const currentList = await db.select().from(organizations).where(eq(organizations.id, orgId)).limit(1);
    const current = currentList[0];
    if (!current) throw new Error("Organization unit not found");

    if (params.parentId !== undefined) {
      if (params.parentId === orgId) {
        throw new Error("An organization unit cannot be its own parent");
      }

      if (params.parentId) {
        let currentParentId: string | null = params.parentId;
        while (currentParentId) {
          if (currentParentId === orgId) {
            throw new Error("Circular reference detected in organization tree");
          }
          const nextParentList = await db
            .select({ parentId: organizations.parentId })
            .from(organizations)
            .where(eq(organizations.id, currentParentId))
            .limit(1);
          currentParentId = nextParentList[0]?.parentId || null;
        }
      }
    }

    const [updated] = await db
      .update(organizations)
      .set({
        name: params.name === undefined ? current.name : params.name,
        parentId: params.parentId === undefined ? current.parentId : params.parentId,
        type: params.type === undefined ? current.type : params.type,
        isActive: params.isActive === undefined ? current.isActive : params.isActive,
      })
      .where(eq(organizations.id, orgId))
      .returning();

    if (!updated) throw new Error("Failed to update organization unit");
    return updated;
  }

  static async getOrganizationHierarchy(): Promise<OrgTree[]> {
    const allOrgs = await db
      .select()
      .from(organizations)
      .where(eq(organizations.isActive, true))
      .orderBy(organizations.code);

    const buildTree = (parentId: string | null): OrgTree[] => {
      return allOrgs
        .filter(org => org.parentId === parentId)
        .map(org => ({
          ...org,
          children: buildTree(org.id),
        }));
    };

    return buildTree(null);
  }

  // ==========================================
  // User Organization assignment
  // ==========================================

  static async assignUserToOrganization(params: {
    userId: string;
    organizationId: string;
    positionRefItemId?: string;
    isPrimary?: boolean;
  }): Promise<void> {
    const isPrimary = params.isPrimary ?? false;

    if (params.positionRefItemId) {
      const positionItem = await db
        .select()
        .from(refItems)
        .where(eq(refItems.id, params.positionRefItemId))
        .limit(1);

      if (!positionItem[0]) {
        throw new Error("Position reference item not found");
      }
    }

    await db.transaction(async (tx) => {
      if (isPrimary) {
        await tx
          .update(userOrganizations)
          .set({ isPrimary: false })
          .where(eq(userOrganizations.userId, params.userId));
      }

      const existing = await tx
        .select()
        .from(userOrganizations)
        .where(
          and(
            eq(userOrganizations.userId, params.userId),
            eq(userOrganizations.organizationId, params.organizationId)
          )
        )
        .limit(1);

      if (existing[0]) {
        await tx
          .update(userOrganizations)
          .set({
            positionRefItemId: params.positionRefItemId || null,
            isPrimary,
          })
          .where(eq(userOrganizations.id, existing[0].id));
      } else {
        await tx.insert(userOrganizations).values({
          userId: params.userId,
          organizationId: params.organizationId,
          positionRefItemId: params.positionRefItemId || null,
          isPrimary,
        });
      }
    });

    await auditQueue.push({
      actorUserId: "system",
      action: "REFERENCE_DATA_UPDATED",
      entityType: "user_organization",
      entityId: params.userId,
      metadata: { orgId: params.organizationId, isPrimary },
    });
  }
}
