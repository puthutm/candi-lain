import { pgEnum } from "drizzle-orm/pg-core";

export const userStatusEnum = pgEnum("user_status", [
  "active",
  "inactive",
  "locked",
]);

export const applicationStatusEnum = pgEnum("application_status", [
  "active",
  "inactive",
]);

export const roleAssignmentStatusEnum = pgEnum("role_assignment_status", [
  "active",
  "revoked",
]);

export const organizationTypeEnum = pgEnum("organization_type", [
  "company",
  "division",
  "department",
  "unit",
]);
