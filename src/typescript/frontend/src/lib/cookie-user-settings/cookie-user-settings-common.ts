import type { ResponseCookie } from "next/dist/compiled/@edge-runtime/cookies";

import type { UserSettings, UserSettingsWithVersion } from "./types";
import {
  COOKIE_USER_SETTINGS_CURRENT_VERSION,
  COOKIE_USER_SETTINGS_DEFAULT_STATE,
  COOKIE_USER_SETTINGS_MAX_AGE,
  COOKIE_USER_SETTINGS_NAME,
  validateSettings,
} from "./types";

export interface CookieStore {
  get: (name: string) => { value: string } | undefined;
  set: (name: string, value: string, options: Partial<ResponseCookie>) => void;
  delete: (name: string) => void;
}

// Common implementation that can be used in both client and server environments
export class CookieUserSettingsManager {
  protected cookieStore: CookieStore;

  constructor(cookieStore: CookieStore) {
    this.cookieStore = cookieStore;
  }

  /**
   * Get all user settings
   */
  getSettings(): UserSettings {
    try {
      const settingsCookie = this.cookieStore.get(COOKIE_USER_SETTINGS_NAME);
      if (!settingsCookie) {
        return COOKIE_USER_SETTINGS_DEFAULT_STATE;
      }

      const parsedSettings = JSON.parse(settingsCookie.value);
      const validatedSettings = validateSettings(parsedSettings);

      if (!validatedSettings || validatedSettings.version < COOKIE_USER_SETTINGS_CURRENT_VERSION) {
        // Optionally delete the old cookie here if needed
        // this.clearSettings();
        return COOKIE_USER_SETTINGS_DEFAULT_STATE;
      }

      return validatedSettings;
    } catch (error) {
      console.error("Error reading settings:", error);
      // Optionally attempt to clear corrupted cookie
      // try { this.clearSettings(); } catch (clearError) { console.error("Failed to clear corrupted settings cookie:", clearError); }
      return COOKIE_USER_SETTINGS_DEFAULT_STATE;
    }
  }

  /**
   * Get a specific setting value
   */
  getSetting<K extends keyof Omit<UserSettings, "version">>(key: K): UserSettings[K] {
    const settings = this.getSettings();
    // Provide default value if key doesn't exist on potentially outdated settings object
    return settings[key] ?? COOKIE_USER_SETTINGS_DEFAULT_STATE[key];
  }

  /**
   * Save all settings
   */
  saveSettings(settings: Omit<UserSettings, "version">): void {
    try {
      const newSettings: UserSettingsWithVersion = {
        ...COOKIE_USER_SETTINGS_DEFAULT_STATE, // Ensure all keys are present
        ...settings,
        version: COOKIE_USER_SETTINGS_CURRENT_VERSION,
      };

      const validatedSettings = validateSettings(newSettings);
      if (!validatedSettings) {
        // This should ideally not happen if validation logic is correct and input is typed.
        console.error("Invalid settings object constructed:", newSettings);
        throw new Error("Internal error: Invalid settings object constructed");
      }

      this.cookieStore.set(COOKIE_USER_SETTINGS_NAME, JSON.stringify(validatedSettings), {
        maxAge: COOKIE_USER_SETTINGS_MAX_AGE,
        path: "/",
        secure: false,
        httpOnly: false,
        sameSite: "strict",
      });
    } catch (error) {
      console.error("Error saving settings:", error);
      throw error;
    }
  }

  /**
   * Save a single setting
   */
  saveSetting<K extends keyof Omit<UserSettings, "version">>(key: K, value: UserSettings[K]): void {
    const currentSettings = this.getSettings();
    const newSettingsData = {
      ...currentSettings,
      [key]: value,
    };
    this.saveSettings(newSettingsData);
  }

  /**
   * Clear all settings by deleting the cookie
   */
  clearSettings(): void {
    try {
      this.cookieStore.delete(COOKIE_USER_SETTINGS_NAME);
    } catch (error) {
      console.error("Error clearing settings:", error);
      // Rethrow to allow calling code to handle the error
      throw error;
    }
  }

  /**
   * Reset settings to their default state
   */
  resetSettings(): void {
    this.saveSettings(COOKIE_USER_SETTINGS_DEFAULT_STATE);
  }
}
