import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

import {
  clearSettings,
  COOKIE_MAX_AGE,
  DEFAULT_SETTINGS,
  getSetting,
  getSettings,
  saveSetting,
  saveSettings,
  UserSettingsSchema,
} from "../../src/lib/cookie-user-settings/cookie-user-settings";

const ACCOUNT_ADDRESS_1 = "0x000000000000000000000000000000000000000000000000000000000000000A";
const ACCOUNT_ADDRESS_2 = "0x000000000000000000000000000000000000000000000000000000000000000B";

// Mock next/headers and next/cache
jest.mock("next/headers", () => ({
  cookies: jest.fn(() => ({
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
  })),
}));

jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
}));

describe("Cookie Storage with Server Actions", () => {
  let mockCookieStore: {
    get: jest.Mock;
    set: jest.Mock;
    delete: jest.Mock;
  };

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();

    // Setup cookie store mock
    mockCookieStore = {
      get: jest.fn(),
      set: jest.fn(),
      delete: jest.fn(),
    };
    (cookies as jest.Mock).mockReturnValue(mockCookieStore);
  });

  describe("getSettings", () => {
    it("should return default settings when no cookie exists", async () => {
      mockCookieStore.get.mockReturnValue(null);

      const settings = await getSettings();
      expect(settings).toEqual(DEFAULT_SETTINGS);
    });

    it("should return default settings when cookie is invalid JSON", async () => {
      mockCookieStore.get.mockReturnValue({ value: "invalid json" });

      const settings = await getSettings();
      expect(settings).toEqual(DEFAULT_SETTINGS);
    });

    it("should return default settings when version is outdated", async () => {
      mockCookieStore.get.mockReturnValue({
        value: JSON.stringify({ version: 0, accountAddress: ACCOUNT_ADDRESS_1 }),
      });

      const settings = await getSettings();
      expect(settings).toEqual(DEFAULT_SETTINGS);
    });

    it("should return valid settings from cookie", async () => {
      const validSettings = {
        version: 1,
        accountAddress: ACCOUNT_ADDRESS_1,
      };
      mockCookieStore.get.mockReturnValue({
        value: JSON.stringify(validSettings),
      });

      const settings = await getSettings();
      expect(settings).toEqual(validSettings);
    });
  });

  describe("getSetting", () => {
    it("should return specific setting value", async () => {
      const validSettings = {
        version: 1,
        accountAddress: ACCOUNT_ADDRESS_1,
      };
      mockCookieStore.get.mockReturnValue({
        value: JSON.stringify(validSettings),
      });

      const address = await getSetting("accountAddress");
      expect(address).toBe(ACCOUNT_ADDRESS_1);
    });
  });

  describe("saveSettings", () => {
    it("should save valid settings", async () => {
      await saveSettings({ accountAddress: ACCOUNT_ADDRESS_1 });

      expect(mockCookieStore.set).toHaveBeenCalledWith(
        "user_settings",
        JSON.stringify({
          version: 1,
          accountAddress: ACCOUNT_ADDRESS_1,
        }),
        expect.objectContaining({
          maxAge: COOKIE_MAX_AGE,
          path: "/",
          sameSite: "strict",
        })
      );
      expect(revalidatePath).toHaveBeenCalledWith("/");
    });

    it("should throw error for invalid settings", async () => {
      const invalidSettings = {
        accountAddress: 123, // Should be string
      };

      await expect(saveSettings(invalidSettings as any)).rejects.toThrow();
    });
  });

  describe("saveSetting", () => {
    it("should update single setting", async () => {
      // Setup existing settings
      mockCookieStore.get.mockReturnValue({
        value: JSON.stringify({
          version: 1,
          accountAddress: ACCOUNT_ADDRESS_1,
        }),
      });

      await saveSetting("accountAddress", ACCOUNT_ADDRESS_2);

      expect(mockCookieStore.set).toHaveBeenCalledWith(
        "user_settings",
        JSON.stringify({
          version: 1,
          accountAddress: ACCOUNT_ADDRESS_2,
        }),
        expect.any(Object)
      );
      expect(revalidatePath).toHaveBeenCalledWith("/");
    });
  });

  describe("clearSettings", () => {
    it("should delete the settings cookie", async () => {
      await clearSettings();

      expect(mockCookieStore.delete).toHaveBeenCalledWith("user_settings");
      expect(revalidatePath).toHaveBeenCalledWith("/");
    });
  });

  describe("Schema Validation", () => {
    it("should validate correct settings", () => {
      const validSettings = {
        version: 1,
        accountAddress: ACCOUNT_ADDRESS_1,
      };

      const result = UserSettingsSchema.safeParse(validSettings);
      expect(result.success).toBe(true);
    });

    it("should reject invalid version", () => {
      const invalidSettings = {
        version: -1,
        accountAddress: ACCOUNT_ADDRESS_1,
      };

      const result = UserSettingsSchema.safeParse(invalidSettings);
      expect(result.success).toBe(false);
    });

    it("should allow null accountAddress", () => {
      const settings = {
        version: 1,
        accountAddress: null,
      };

      const result = UserSettingsSchema.safeParse(settings);
      expect(result.success).toBe(true);
    });
  });
});
