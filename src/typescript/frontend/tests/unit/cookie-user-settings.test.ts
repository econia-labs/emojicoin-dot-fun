import {
  COOKIE_USER_SETTINGS_DEFAULT_STATE,
  COOKIE_USER_SETTINGS_MAX_AGE,
  COOKIE_USER_SETTINGS_NAME,
} from "lib/cookie-user-settings/types";
import { cookies } from "next/headers";

import {
  clearSettings,
  getSetting,
  getSettings,
  saveSetting,
  saveSettings,
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
      expect(settings).toEqual(COOKIE_USER_SETTINGS_DEFAULT_STATE);
    });

    it("should return default settings when cookie is invalid JSON", async () => {
      mockCookieStore.get.mockReturnValue({ value: "invalid json" });

      const settings = await getSettings();
      expect(settings).toEqual(COOKIE_USER_SETTINGS_DEFAULT_STATE);
    });

    it("should return default settings when version is outdated", async () => {
      mockCookieStore.get.mockReturnValue({
        value: JSON.stringify({ version: 0, accountAddress: ACCOUNT_ADDRESS_1 }),
      });

      const settings = await getSettings();
      expect(settings).toEqual(COOKIE_USER_SETTINGS_DEFAULT_STATE);
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
        COOKIE_USER_SETTINGS_NAME,
        JSON.stringify({
          version: 1,
          accountAddress: ACCOUNT_ADDRESS_1,
        }),
        expect.objectContaining({
          maxAge: COOKIE_USER_SETTINGS_MAX_AGE,
          path: "/",
          sameSite: "strict",
        })
      );
    });

    it("should throw error for invalid settings", async () => {
      const invalidSettings = {
        accountAddress: "wrong address", // Should be a valid address
      };

      await expect(saveSettings(invalidSettings)).rejects.toThrow();
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
        COOKIE_USER_SETTINGS_NAME,
        JSON.stringify({
          version: 1,
          accountAddress: ACCOUNT_ADDRESS_2,
        }),
        expect.any(Object)
      );
    });
  });

  describe("clearSettings", () => {
    it("should delete the settings cookie", async () => {
      await clearSettings();

      expect(mockCookieStore.delete).toHaveBeenCalledWith(COOKIE_USER_SETTINGS_NAME);
    });
  });
});
