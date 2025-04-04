"use server";

import { cookies } from "next/headers";

import type { UserSettings } from "./types";
import {
  COOKIE_USER_SETTINGS_CURRENT_VERSION,
  COOKIE_USER_SETTINGS_DEFAULT_STATE,
  COOKIE_USER_SETTINGS_MAX_AGE,
  COOKIE_USER_SETTINGS_NAME,
  validateSettings,
} from "./types";

/**
 * Get all user settings
 */
export async function getSettings(): Promise<UserSettings> {
  try {
    const cookieStore = cookies();
    const settingsCookie = cookieStore.get(COOKIE_USER_SETTINGS_NAME);

    if (!settingsCookie) {
      return COOKIE_USER_SETTINGS_DEFAULT_STATE;
    }

    const parsedSettings = JSON.parse(settingsCookie.value);
    const validatedSettings = validateSettings(parsedSettings);

    if (!validatedSettings || validatedSettings.version < COOKIE_USER_SETTINGS_CURRENT_VERSION) {
      return COOKIE_USER_SETTINGS_DEFAULT_STATE;
    }

    return validatedSettings;
  } catch (error) {
    console.error("Error reading settings:", error);
    return COOKIE_USER_SETTINGS_DEFAULT_STATE;
  }
}

/**
 * Get a specific setting value
 */
export async function getSetting<K extends keyof Omit<UserSettings, "version">>(
  key: K
): Promise<UserSettings[K]> {
  const settings = await getSettings();
  return settings[key];
}

/**
 * Save all settings
 */
export async function saveSettings(settings: Omit<UserSettings, "version">): Promise<void> {
  try {
    const cookieStore = cookies();
    const newSettings: UserSettings = {
      ...settings,
      version: COOKIE_USER_SETTINGS_CURRENT_VERSION,
    };

    const validatedSettings = validateSettings(newSettings);
    if (!validatedSettings) {
      throw new Error("Invalid settings object");
    }

    cookieStore.set(COOKIE_USER_SETTINGS_NAME, JSON.stringify(validatedSettings), {
      maxAge: COOKIE_USER_SETTINGS_MAX_AGE,
      path: "/",
      secure: process.env.NODE_ENV === "production",
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
export async function saveSetting<K extends keyof Omit<UserSettings, "version">>(
  key: K,
  value: UserSettings[K]
): Promise<void> {
  const currentSettings = await getSettings();
  await saveSettings({
    ...currentSettings,
    [key]: value,
  });
}

/**
 * Clear all settings
 */
export async function clearSettings(): Promise<void> {
  try {
    const cookieStore = cookies();
    cookieStore.delete(COOKIE_USER_SETTINGS_NAME);
  } catch (error) {
    console.error("Error clearing settings:", error);
    throw error;
  }
}
