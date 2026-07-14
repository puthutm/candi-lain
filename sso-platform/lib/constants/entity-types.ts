/**
 * Entity Type Constants for Audit Logging and Database Operations
 * Centralized to prevent string typos and ensure consistency across the application
 */

export const ENTITY_TYPES = {
  // System
  SYSTEM_SETTINGS: 'system_settings',
  APPLICATION: 'application',
  
  // Authentication & Authorization
  AUTHORIZATION_CODE: 'authorization_code',
  USER: 'user',
  ROLE: 'role',
  USER_ROLE: 'user_role',
  PERMISSION: 'permission',
  CONSENT: 'consent',
  
  // Reference Data
  REF_CATEGORY: 'ref_category',
  REFERENCE: 'reference',
  
  // Academic (SIAKAD)
  PROGRAM_STUDI: 'program_studi',
  STUDENT: 'student',
  COURSE: 'course',
  SEMESTER: 'semester',
  
  // LMS
  COURSE_CONTENT: 'course_content',
  ASSIGNMENT: 'assignment',
  FORUM: 'forum',
  
  // PMB
  APPLICANT: 'applicant',
  APPLICATION_FORM: 'application_form',
  PAYMENT: 'payment',
  
  // Finance (Keuangan)
  TRANSACTION: 'transaction',
  INVOICE: 'invoice',
  BUDGET: 'budget',
  
  // HR
  EMPLOYEE: 'employee',
  PAYROLL: 'payroll',
  ATTENDANCE: 'attendance',
  
  // Bank Konten
  QUESTION: 'soal',
  MATERIAL: 'materi',
  CATEGORY: 'kategori',
} as const;

/**
 * Entity ID for global/system-level configurations
 */
export const GLOBAL_ENTITY_ID = 'global';

/**
 * Audit Log Actions
 */
export const AUDIT_ACTIONS = {
  CREATE: 'create',
  READ: 'read',
  UPDATE: 'update',
  DELETE: 'delete',
  LOGIN: 'login',
  LOGOUT: 'logout',
  APPROVE: 'approve',
  REJECT: 'reject',
  SUBMIT: 'submit',
  VERIFY: 'verify',
  EXPORT: 'export',
  IMPORT: 'import',
} as const;

export type EntityType = (typeof ENTITY_TYPES)[keyof typeof ENTITY_TYPES];
export type AuditAction = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS];
