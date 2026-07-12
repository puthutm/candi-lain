import { db } from "@/db";
import { applicationRoles, permissions, rolePermissions, userApplicationRoles } from "@/db/schema/rbac";
import { eq, and, sql } from "drizzle-orm";
import { auditQueue } from "../redis";

export class RBACService {
  /**
   * Create a new role for an application
   */
  static async createRole(params: {
    applicationId: string;
    roleKey: string;
    roleName: string;
    description?: string;
    isDefault?: boolean;
  }): Promise<typeof applicationRoles.$inferSelect> {
    // Validate roleKey format: alphanumeric + underscores only
    if (!/^[a-zA-Z0-9_]+$/.test(params.roleKey)) {
      throw new Error("Role key must be alphanumeric and contain only letters, numbers, and underscores");
    }

    // Check uniqueness per application
    const existing = await db
      .select()
      .from(applicationRoles)
      .where(
        and(
          eq(applicationRoles.applicationId, params.applicationId),
          eq(applicationRoles.roleKey, params.roleKey)
        )
      )
      .limit(1);

    if (existing[0]) {
      throw new Error(`Role key '${params.roleKey}' already exists for this application`);
    }

    const [role] = await db
      .insert(applicationRoles)
      .values({
        applicationId: params.applicationId,
        roleKey: params.roleKey,
        roleName: params.roleName,
        description: params.description || null,
        isDefault: params.isDefault ?? false,
      })
      .returning();

    if (!role) {
      throw new Error("Failed to create role");
    }

    await auditQueue.push({
      actorUserId: "system",
      action: "ROLE_CREATED",
      entityType: "role",
      entityId: role.id,
      metadata: { roleKey: params.roleKey, applicationId: params.applicationId },
    });

    return role;
  }

  /**
   * Update role details
   */
  static async updateRole(
    roleId: string,
    params: { roleName?: string; description?: string; isDefault?: boolean }
  ): Promise<typeof applicationRoles.$inferSelect> {
    const [updatedRole] = await db
      .update(applicationRoles)
      .set({
        roleName: params.roleName,
        description: params.description,
        isDefault: params.isDefault,
      })
      .where(eq(applicationRoles.id, roleId))
      .returning();

    if (!updatedRole) {
      throw new Error("Role not found");
    }

    return updatedRole;
  }

  /**
   * Delete a role (soft check: prevent if users are currently assigned active status)
   */
  static async deleteRole(roleId: string): Promise<void> {
    const activeAssignments = await db
      .select()
      .from(userApplicationRoles)
      .where(
        and(
          eq(userApplicationRoles.roleId, roleId),
          eq(userApplicationRoles.status, "active")
        )
      )
      .limit(1);

    if (activeAssignments[0]) {
      throw new Error("Cannot delete role: active users are currently assigned to this role");
    }

    await db.delete(applicationRoles).where(eq(applicationRoles.id, roleId));
  }

  /**
   * Fetch all roles for an application
   */
  static async getRolesByApplication(applicationId: string): Promise<Array<typeof applicationRoles.$inferSelect>> {
    return db
      .select()
      .from(applicationRoles)
      .where(eq(applicationRoles.applicationId, applicationId));
  }

  /**
   * Create a permission for an application
   */
  static async createPermission(params: {
    applicationId: string;
    permissionKey: string; // format: "resource:action"
    description?: string;
  }): Promise<typeof permissions.$inferSelect> {
    // Validate permissionKey format: "resource:action" e.g., "invoice:approve"
    if (!/^[a-zA-Z0-9_-]+:[a-zA-Z0-9_-]+$/.test(params.permissionKey)) {
      throw new Error("Permission key must follow the 'resource:action' format (e.g. invoice:approve)");
    }

    // Check uniqueness per application
    const existing = await db
      .select()
      .from(permissions)
      .where(
        and(
          eq(permissions.applicationId, params.applicationId),
          eq(permissions.permissionKey, params.permissionKey)
        )
      )
      .limit(1);

    if (existing[0]) {
      throw new Error(`Permission key '${params.permissionKey}' already exists for this application`);
    }

    const [permission] = await db
      .insert(permissions)
      .values({
        applicationId: params.applicationId,
        permissionKey: params.permissionKey,
        description: params.description || null,
      })
      .returning();

    if (!permission) {
      throw new Error("Failed to create permission");
    }

    return permission;
  }

  /**
   * Delete a permission
   */
  static async deletePermission(permissionId: string): Promise<void> {
    await db.delete(permissions).where(eq(permissions.id, permissionId));
  }

  /**
   * Link permission to a role
   */
  static async assignPermissionToRole(roleId: string, permissionId: string): Promise<void> {
    // Check if link already exists
    const existing = await db
      .select()
      .from(rolePermissions)
      .where(
        and(
          eq(rolePermissions.roleId, roleId),
          eq(rolePermissions.permissionId, permissionId)
        )
      )
      .limit(1);

    if (existing[0]) return;

    await db.insert(rolePermissions).values({
      roleId,
      permissionId,
    });
  }

  /**
   * Unlink permission from a role
   */
  static async removePermissionFromRole(roleId: string, permissionId: string): Promise<void> {
    await db
      .delete(rolePermissions)
      .where(
        and(
          eq(rolePermissions.roleId, roleId),
          eq(rolePermissions.permissionId, permissionId)
        )
      );
  }

  /**
   * Assign a role to a user
   */
  static async assignRoleToUser(params: {
    userId: string;
    applicationId: string;
    roleId: string;
    grantedBy: string;
  }): Promise<typeof userApplicationRoles.$inferSelect> {
    // Verify role belongs to application
    const roleList = await db
      .select()
      .from(applicationRoles)
      .where(eq(applicationRoles.id, params.roleId))
      .limit(1);
    
    const role = roleList[0];
    if (!role || role.applicationId !== params.applicationId) {
      throw new Error("Role does not belong to the specified application");
    }

    // Check for existing assignment
    const existingList = await db
      .select()
      .from(userApplicationRoles)
      .where(
        and(
          eq(userApplicationRoles.userId, params.userId),
          eq(userApplicationRoles.applicationId, params.applicationId),
          eq(userApplicationRoles.roleId, params.roleId)
        )
      )
      .limit(1);

    const existing = existingList[0];
    let result: typeof userApplicationRoles.$inferSelect;

    if (existing) {
      if (existing.status === "active") {
        throw new Error("Role is already assigned and active for this user");
      }

      // Reactivate revoked assignment
      const [updated] = await db
        .update(userApplicationRoles)
        .set({
          status: "active",
          grantedBy: params.grantedBy,
          grantedAt: new Date(),
        })
        .where(eq(userApplicationRoles.id, existing.id))
        .returning();
      
      if (!updated) throw new Error("Failed to reactivate assignment");
      result = updated;
    } else {
      // Create new assignment
      const [inserted] = await db
        .insert(userApplicationRoles)
        .values({
          userId: params.userId,
          applicationId: params.applicationId,
          roleId: params.roleId,
          grantedBy: params.grantedBy,
          status: "active",
        })
        .returning();

      if (!inserted) throw new Error("Failed to create assignment");
      result = inserted;
    }

    await auditQueue.push({
      actorUserId: params.grantedBy,
      action: "ROLE_ASSIGNED",
      entityType: "user_role",
      entityId: result.id,
      metadata: {
        userId: params.userId,
        applicationId: params.applicationId,
        roleId: params.roleId,
        roleKey: role.roleKey,
      },
    });

    return result;
  }

  /**
   * Revoke a role from a user
   */
  static async revokeRoleFromUser(userId: string, applicationId: string, roleId: string): Promise<void> {
    const existingList = await db
      .select()
      .from(userApplicationRoles)
      .where(
        and(
          eq(userApplicationRoles.userId, userId),
          eq(userApplicationRoles.applicationId, applicationId),
          eq(userApplicationRoles.roleId, roleId),
          eq(userApplicationRoles.status, "active")
        )
      )
      .limit(1);

    const existing = existingList[0];
    if (!existing) return;

    await db
      .update(userApplicationRoles)
      .set({ status: "revoked" })
      .where(eq(userApplicationRoles.id, existing.id));

    await auditQueue.push({
      actorUserId: "system",
      action: "ROLE_REVOKED",
      entityType: "user_role",
      entityId: existing.id,
      metadata: { userId, applicationId, roleId },
    });
  }

  /**
   * Fetch user active roles ordered by grantedAt
   */
  static async getUserRoles(
    userId: string,
    applicationId: string
  ): Promise<Array<typeof applicationRoles.$inferSelect>> {
    const rolesList = await db
      .select({
        id: applicationRoles.id,
        applicationId: applicationRoles.applicationId,
        roleKey: applicationRoles.roleKey,
        roleName: applicationRoles.roleName,
        description: applicationRoles.description,
        isDefault: applicationRoles.isDefault,
        createdAt: applicationRoles.createdAt,
      })
      .from(userApplicationRoles)
      .innerJoin(applicationRoles, eq(userApplicationRoles.roleId, applicationRoles.id))
      .where(
        and(
          eq(userApplicationRoles.userId, userId),
          eq(userApplicationRoles.applicationId, applicationId),
          eq(userApplicationRoles.status, "active")
        )
      )
      .orderBy(userApplicationRoles.grantedAt);

    return rolesList;
  }

  /**
   * Fetch aggregated permissions for a user's active roles on an application
   */
  static async getUserPermissions(
    userId: string,
    applicationId: string
  ): Promise<Array<typeof permissions.$inferSelect>> {
    const activeRoles = await db
      .select({ id: applicationRoles.id })
      .from(userApplicationRoles)
      .innerJoin(applicationRoles, eq(userApplicationRoles.roleId, applicationRoles.id))
      .where(
        and(
          eq(userApplicationRoles.userId, userId),
          eq(userApplicationRoles.applicationId, applicationId),
          eq(userApplicationRoles.status, "active")
        )
      );

    const roleIds = activeRoles.map(r => r.id);
    if (roleIds.length === 0) return [];

    // Aggregate unique permissions from these roles
    const permissionList = await db
      .selectDistinct({
        id: permissions.id,
        applicationId: permissions.applicationId,
        permissionKey: permissions.permissionKey,
        description: permissions.description,
      })
      .from(rolePermissions)
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(
        and(
          sql`${rolePermissions.roleId} IN ${roleIds}`,
          eq(permissions.applicationId, applicationId)
        )
      );

    return permissionList;
  }
}
