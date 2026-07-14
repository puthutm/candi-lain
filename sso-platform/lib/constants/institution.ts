/**
 * Institution Configuration Constants
 * Centralized institution/branding information
 */

export const INSTITUTION = {
  NAME: process.env.INSTITUTION_NAME || 'Universitas Siber Asia',
  SHORT_NAME: process.env.INSTITUTION_SHORT_NAME || 'UNSIA',
  ACRONYM: process.env.INSTITUTION_ACRONYM || 'UNSIA',
  DOMAIN: process.env.INSTITUTION_DOMAIN || 'unsia.ac.id',
  WEBSITE: process.env.INSTITUTION_WEBSITE || 'https://unsia.ac.id',
  EMAIL_DOMAIN: process.env.INSTITUTION_EMAIL_DOMAIN || '@unsia.ac.id',
  
  // Storage & Media
  STORAGE_BASE_URL: process.env.STORAGE_BASE_URL || 'http://storage.unsia.ac.id',
  CDN_URL: process.env.CDN_URL || process.env.STORAGE_BASE_URL || 'http://storage.unsia.ac.id',
  
  // Contact Information
  SUPPORT_EMAIL: process.env.SUPPORT_EMAIL || 'support@unsia.ac.id',
  ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'admin@unsia.ac.id',
  PHONE: process.env.INSTITUTION_PHONE || '+62-XXX-XXXX',
  ADDRESS: process.env.INSTITUTION_ADDRESS || 'Jakarta, Indonesia',
  
  // Branding
  LOGO_URL: process.env.LOGO_URL || `${process.env.STORAGE_BASE_URL}/logo.png`,
  FAVICON_URL: process.env.FAVICON_URL || `${process.env.STORAGE_BASE_URL}/favicon.ico`,
  PRIMARY_COLOR: process.env.PRIMARY_COLOR || '#003366',
  SECONDARY_COLOR: process.env.SECONDARY_COLOR || '#006699',
} as const;

/**
 * Get institution email for specific domain
 */
export function getInstitutionEmail(username: string): string {
  return `${username}${INSTITUTION.EMAIL_DOMAIN}`;
}

/**
 * Get institution name with optional format
 */
export function getInstitutionDisplayName(format: 'full' | 'short' | 'acronym' = 'full'): string {
  switch (format) {
    case 'short':
      return INSTITUTION.SHORT_NAME;
    case 'acronym':
      return INSTITUTION.ACRONYM;
    case 'full':
    default:
      return INSTITUTION.NAME;
  }
}
