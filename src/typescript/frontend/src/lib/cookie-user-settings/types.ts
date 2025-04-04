import { AccountAddress } from "@aptos-labs/ts-sdk";
import { z } from "zod";

// Define Zod schema for settings validation
export const CookieUserSettingsSchema = z.object({
  homePageFilterFavorites: z.boolean().optional(),
  version: z.number().int().positive(),
  accountAddress: z
    .string()
    .refine((arg) => AccountAddress.isValid({ input: arg }).valid, {
      message: "Invalid account address format",
    })
    .optional()
    .nullable(),
});

// Derive TypeScript type from Zod schema
export type UserSettings = z.infer<typeof CookieUserSettingsSchema>;

// Constants
export const COOKIE_USER_SETTINGS_CURRENT_VERSION = 1;
export const COOKIE_USER_SETTINGS_NAME = "ec_user_settings";
export const COOKIE_USER_SETTINGS_MAX_AGE = 30 * 24 * 60 * 60; // 30 days in seconds

export const COOKIE_USER_SETTINGS_DEFAULT_STATE: UserSettings = {
  version: COOKIE_USER_SETTINGS_CURRENT_VERSION,
  homePageFilterFavorites: false,
  accountAddress: undefined,
};

export function validateSettings(settings: unknown): UserSettings | null {
  try {
    return CookieUserSettingsSchema.parse(settings);
  } catch (error) {
    console.error("Settings validation error:", error);
    return null;
  }
}
