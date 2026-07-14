import fs from "fs";
import path from "path";

export interface SSOSettings {
  institutionName: string;
  institutionShortName: string;
  portalName: string;
  sessionLifetime: number;
  allowSelfRegistration: boolean;
  mfaPolicy: string;
}

const SETTINGS_FILE_PATH = path.join(process.cwd(), "lib", "sso-settings.json");

const defaultSettings: SSOSettings = {
  institutionName: process.env.NEXT_PUBLIC_INSTITUTION_NAME || "Universitas Siber Asia",
  institutionShortName: process.env.NEXT_PUBLIC_INSTITUTION_SHORT_NAME || "UNSIA",
  portalName: process.env.NEXT_PUBLIC_PORTAL_NAME || "SSO Portal",
  sessionLifetime: Number(process.env.SESSION_MAX_AGE) || 3600,
  allowSelfRegistration: true,
  mfaPolicy: "optional",
};

export class SettingsService {
  static getSettings(): SSOSettings {
    try {
      if (fs.existsSync(SETTINGS_FILE_PATH)) {
        const content = fs.readFileSync(SETTINGS_FILE_PATH, "utf-8");
        return { ...defaultSettings, ...JSON.parse(content) };
      }
    } catch (e) {
      console.error("Error reading settings file, using defaults:", e);
    }
    return defaultSettings;
  }

  static saveSettings(settings: Partial<SSOSettings>): boolean {
    try {
      const current = this.getSettings();
      const updated = { ...current, ...settings };
      // Ensure directory exists
      const dir = path.dirname(SETTINGS_FILE_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(SETTINGS_FILE_PATH, JSON.stringify(updated, null, 2), "utf-8");
      return true;
    } catch (e) {
      console.error("Error saving settings file:", e);
      return false;
    }
  }
}
