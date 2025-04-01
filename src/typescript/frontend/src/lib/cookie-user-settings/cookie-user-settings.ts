"use server";

import { AccountAddress } from "@aptos-labs/ts-sdk";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { z } from "zod";

// Define Zod schema for settings validation
export const UserSettingsSchema = z.object({
  version: z.number().int().positive(),
  accountAddress: z
    .string()
    .refine((arg) => AccountAddress.isValid({ input: arg }), {
      message: "Invalid account address format",
    })
    .optional()
    .nullable(),
});

// Derive TypeScript type from Zod schema
export type UserSettings = z.infer<typeof UserSettingsSchema>;

// Constants
export const CURRENT_VERSION = 1;
export const COOKIE_NAME = "ec_user_settings";
export const COOKIE_MAX_AGE = 30 * 24 * 60 * 60; // 30 days in seconds

export const DEFAULT_SETTINGS: UserSettings = {
  version: CURRENT_VERSION,
  accountAddress: undefined,
};

function validateSettings(settings: unknown): UserSettings | null {
  try {
    return UserSettingsSchema.parse(settings);
  } catch (error) {
    console.error("Settings validation error:", error);
    return null;
  }
}

/**
 * Get all user settings
 */
export async function getSettings(): Promise<UserSettings> {
  try {
    const cookieStore = cookies();
    const settingsCookie = cookieStore.get(COOKIE_NAME);

    if (!settingsCookie) {
      return DEFAULT_SETTINGS;
    }

    const parsedSettings = JSON.parse(settingsCookie.value);
    const validatedSettings = validateSettings(parsedSettings);

    if (!validatedSettings || validatedSettings.version < CURRENT_VERSION) {
      return DEFAULT_SETTINGS;
    }

    return validatedSettings;
  } catch (error) {
    console.error("Error reading settings:", error);
    return DEFAULT_SETTINGS;
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
      version: CURRENT_VERSION,
    };

    const validatedSettings = validateSettings(newSettings);
    if (!validatedSettings) {
      throw new Error("Invalid settings object");
    }

    cookieStore.set(COOKIE_NAME, JSON.stringify(validatedSettings), {
      maxAge: COOKIE_MAX_AGE,
      path: "/",
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    // Revalidate all pages that might use these settings
    revalidatePath("/");
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
    cookieStore.delete(COOKIE_NAME);
    revalidatePath("/");
  } catch (error) {
    console.error("Error clearing settings:", error);
    throw error;
  }
}
