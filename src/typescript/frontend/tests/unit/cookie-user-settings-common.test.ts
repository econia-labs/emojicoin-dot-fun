import type { CookieStore } from "lib/cookie-user-settings/cookie-user-settings-common";
import { CookieUserSettingsManager } from "lib/cookie-user-settings/cookie-user-settings-common";
import type { UserSettings, UserSettingsWithVersion } from "lib/cookie-user-settings/types";
import {
  COOKIE_USER_SETTINGS_CURRENT_VERSION,
  COOKIE_USER_SETTINGS_DEFAULT_STATE,
  COOKIE_USER_SETTINGS_MAX_AGE,
  COOKIE_USER_SETTINGS_NAME,
} from "lib/cookie-user-settings/types";

// Valid Aptos account addresses for testing
const ACCOUNT_ADDRESS_1 = "0x000000000000000000000000000000000000000000000000000000000000000A";
const ACCOUNT_ADDRESS_2 = "0x000000000000000000000000000000000000000000000000000000000000000B";

describe("CookieUserSettingsManager", () => {
  // Mock implementation of CookieStore
  let mockCookieStore: jest.Mocked<CookieStore>;
  let manager: CookieUserSettingsManager;

  // Spy on console.error to test error handling
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    // Create a mock cookie store
    mockCookieStore = {
      get: jest.fn(),
      set: jest.fn(),
      delete: jest.fn(),
    };

    // Create a new manager instance with the mock store
    manager = new CookieUserSettingsManager(mockCookieStore);

    // Spy on console.error
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
  });

  afterEach(() => {
    // Restore console.error
    consoleErrorSpy.mockRestore();
  });

  describe("getSettings", () => {
    it("should return default settings when no cookie exists", () => {
      // Mock cookie store to return undefined (no cookie)
      mockCookieStore.get.mockReturnValue(undefined);

      const settings = manager.getSettings();

      // Should return default settings
      expect(settings).toEqual(COOKIE_USER_SETTINGS_DEFAULT_STATE);
      // Should have called get with the correct cookie name
      expect(mockCookieStore.get).toHaveBeenCalledWith(COOKIE_USER_SETTINGS_NAME);
    });

    it("should return default settings when cookie value is invalid JSON", () => {
      // Mock cookie store to return invalid JSON
      mockCookieStore.get.mockReturnValue({ value: "not valid json" });

      const settings = manager.getSettings();

      // Should return default settings
      expect(settings).toEqual(COOKIE_USER_SETTINGS_DEFAULT_STATE);
      // Should log the error
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it("should return default settings when validation fails", () => {
      // Mock cookie store to return JSON that won't pass validation
      mockCookieStore.get.mockReturnValue({
        value: JSON.stringify({
          version: COOKIE_USER_SETTINGS_CURRENT_VERSION,
          accountAddress: "invalid-address", // Invalid address format
        }),
      });

      const settings = manager.getSettings();

      // Should return default settings
      expect(settings).toEqual(COOKIE_USER_SETTINGS_DEFAULT_STATE);
    });

    it("should return default settings when version is outdated", () => {
      // Mock cookie store to return settings with outdated version
      mockCookieStore.get.mockReturnValue({
        value: JSON.stringify({
          version: COOKIE_USER_SETTINGS_CURRENT_VERSION - 1, // Outdated version
          accountAddress: ACCOUNT_ADDRESS_1,
        }),
      });

      const settings = manager.getSettings();

      // Should return default settings
      expect(settings).toEqual(COOKIE_USER_SETTINGS_DEFAULT_STATE);
    });

    it("should return valid settings from cookie", () => {
      // Valid settings with current version
      const validSettings: UserSettingsWithVersion = {
        version: COOKIE_USER_SETTINGS_CURRENT_VERSION,
        accountAddress: ACCOUNT_ADDRESS_1,
        homePageFilterFavorites: true,
      };

      // Mock cookie store to return valid settings
      mockCookieStore.get.mockReturnValue({ value: JSON.stringify(validSettings) });

      const settings = manager.getSettings();

      // Should return the valid settings
      expect(settings).toEqual(validSettings);
    });
  });

  describe("getSetting", () => {
    it("should return specific setting value", () => {
      // Valid settings with current version
      const validSettings: UserSettingsWithVersion = {
        version: COOKIE_USER_SETTINGS_CURRENT_VERSION,
        accountAddress: ACCOUNT_ADDRESS_1,
        homePageFilterFavorites: true,
      };

      // Mock cookie store to return valid settings
      mockCookieStore.get.mockReturnValue({ value: JSON.stringify(validSettings) });

      // Get a specific setting
      const accountAddress = manager.getSetting("accountAddress");
      const homePageFilterFavorites = manager.getSetting("homePageFilterFavorites");

      // Should return the correct values
      expect(accountAddress).toBe(ACCOUNT_ADDRESS_1);
      expect(homePageFilterFavorites).toBe(true);
    });

    it("should return default value when setting doesn't exist in cookie", () => {
      // Settings missing homePageFilterFavorites
      const partialSettings: UserSettingsWithVersion = {
        version: COOKIE_USER_SETTINGS_CURRENT_VERSION,
        accountAddress: ACCOUNT_ADDRESS_1,
      };

      // Mock cookie store to return partial settings
      mockCookieStore.get.mockReturnValue({ value: JSON.stringify(partialSettings) });

      // Get the missing setting
      const homePageFilterFavorites = manager.getSetting("homePageFilterFavorites");

      // Should return the default value
      expect(homePageFilterFavorites).toBe(
        COOKIE_USER_SETTINGS_DEFAULT_STATE.homePageFilterFavorites
      );
    });

    it("should return default value when cookie doesn't exist", () => {
      // Mock cookie store to return undefined (no cookie)
      mockCookieStore.get.mockReturnValue(undefined);

      // Get a setting
      const accountAddress = manager.getSetting("accountAddress");

      // Should return the default value
      expect(accountAddress).toBe(COOKIE_USER_SETTINGS_DEFAULT_STATE.accountAddress);
    });
  });

  describe("saveSettings", () => {
    it("should save valid settings with correct version", () => {
      // Settings to save (without version)
      const settingsToSave: UserSettings = {
        accountAddress: ACCOUNT_ADDRESS_1,
        homePageFilterFavorites: true,
      };

      // Expected settings to be saved (with version)
      const expectedSavedSettings: UserSettingsWithVersion = {
        ...settingsToSave,
        version: COOKIE_USER_SETTINGS_CURRENT_VERSION,
      };

      // Save the settings
      manager.saveSettings(settingsToSave);

      // Should have called set with the correct parameters
      expect(mockCookieStore.set).toHaveBeenCalledWith(
        COOKIE_USER_SETTINGS_NAME,
        expect.any(String),
        {
          maxAge: COOKIE_USER_SETTINGS_MAX_AGE,
          path: "/",
          secure: false,
          httpOnly: false,
          sameSite: "strict",
        }
      );

      // Verify the JSON content by parsing it back to an object
      const actualJSON = mockCookieStore.set.mock.calls[0][1];
      expect(JSON.parse(actualJSON)).toEqual(expectedSavedSettings);
    });

    it("should merge with default settings to ensure all keys are present", () => {
      // Partial settings to save
      const partialSettings: Partial<UserSettings> = {
        accountAddress: ACCOUNT_ADDRESS_1,
        // homePageFilterFavorites is missing
      };

      // Expected settings to be saved (with all keys and version)
      const expectedSavedSettings: UserSettingsWithVersion = {
        ...COOKIE_USER_SETTINGS_DEFAULT_STATE,
        ...partialSettings,
        version: COOKIE_USER_SETTINGS_CURRENT_VERSION,
      };

      // Save the partial settings
      manager.saveSettings(partialSettings as UserSettings);

      // Should have called set with the correct parameters
      expect(mockCookieStore.set).toHaveBeenCalledWith(
        COOKIE_USER_SETTINGS_NAME,
        expect.any(String),
        expect.any(Object)
      );

      // Verify the JSON content by parsing it back to an object
      const actualJSON = mockCookieStore.set.mock.calls[0][1];
      expect(JSON.parse(actualJSON)).toEqual(expectedSavedSettings);
    });

    it("should throw error when validation fails", () => {
      // Invalid settings
      const invalidSettings = {
        accountAddress: "invalid-address", // Invalid address format
      };

      // Attempt to save invalid settings
      expect(() => {
        manager.saveSettings(invalidSettings as UserSettings);
      }).toThrow();

      // Should not have called set
      expect(mockCookieStore.set).not.toHaveBeenCalled();
      // Should have logged the error
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it("should handle cookie store errors", () => {
      // Mock cookie store to throw an error
      mockCookieStore.set.mockImplementation(() => {
        throw new Error("Cookie store error");
      });

      // Valid settings
      const validSettings: UserSettings = {
        accountAddress: ACCOUNT_ADDRESS_1,
      };

      // Attempt to save settings
      expect(() => {
        manager.saveSettings(validSettings);
      }).toThrow("Cookie store error");

      // Should have logged the error
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe("saveSetting", () => {
    it("should update a single setting while preserving others", () => {
      // Existing settings in the cookie
      const existingSettings: UserSettingsWithVersion = {
        version: COOKIE_USER_SETTINGS_CURRENT_VERSION,
        accountAddress: ACCOUNT_ADDRESS_1,
        homePageFilterFavorites: false,
      };

      // Mock cookie store to return existing settings
      mockCookieStore.get.mockReturnValue({ value: JSON.stringify(existingSettings) });

      // Update a single setting
      manager.saveSetting("accountAddress", ACCOUNT_ADDRESS_2);

      // Expected settings after update
      const expectedSettings: UserSettingsWithVersion = {
        ...existingSettings,
        accountAddress: ACCOUNT_ADDRESS_2,
      };

      // Should have called set with the updated settings
      expect(mockCookieStore.set).toHaveBeenCalledWith(
        COOKIE_USER_SETTINGS_NAME,
        expect.any(String),
        expect.any(Object)
      );

      // Verify the JSON content by parsing it back to an object
      const actualJSON = mockCookieStore.set.mock.calls[0][1];
      expect(JSON.parse(actualJSON)).toEqual(expectedSettings);
    });

    it("should create settings with defaults when cookie doesn't exist", () => {
      // Mock cookie store to return undefined (no cookie)
      mockCookieStore.get.mockReturnValue(undefined);

      // Set a single setting
      manager.saveSetting("accountAddress", ACCOUNT_ADDRESS_1);

      // Expected settings
      const expectedSettings: UserSettingsWithVersion = {
        ...COOKIE_USER_SETTINGS_DEFAULT_STATE,
        accountAddress: ACCOUNT_ADDRESS_1,
        version: COOKIE_USER_SETTINGS_CURRENT_VERSION,
      };

      // Should have called set with the expected settings
      expect(mockCookieStore.set).toHaveBeenCalledWith(
        COOKIE_USER_SETTINGS_NAME,
        expect.any(String),
        expect.any(Object)
      );

      // Verify the JSON content by parsing it back to an object
      const actualJSON = mockCookieStore.set.mock.calls[0][1];
      expect(JSON.parse(actualJSON)).toEqual(expectedSettings);
    });
  });

  describe("clearSettings", () => {
    it("should delete the settings cookie", () => {
      // Clear settings
      manager.clearSettings();

      // Should have called delete with the correct cookie name
      expect(mockCookieStore.delete).toHaveBeenCalledWith(COOKIE_USER_SETTINGS_NAME);
    });

    it("should handle cookie store errors", () => {
      // Mock cookie store to throw an error
      mockCookieStore.delete.mockImplementation(() => {
        throw new Error("Cookie store error");
      });

      // Attempt to clear settings
      expect(() => {
        manager.clearSettings();
      }).toThrow("Cookie store error");

      // Should have logged the error
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe("resetSettings", () => {
    it("should save default settings", () => {
      // Reset settings
      manager.resetSettings();

      // Expected settings
      const expectedSettings: UserSettingsWithVersion = {
        ...COOKIE_USER_SETTINGS_DEFAULT_STATE,
        version: COOKIE_USER_SETTINGS_CURRENT_VERSION,
      };

      // Should have called set with the default settings
      expect(mockCookieStore.set).toHaveBeenCalledWith(
        COOKIE_USER_SETTINGS_NAME,
        expect.any(String),
        expect.any(Object)
      );

      // Verify the JSON content by parsing it back to an object
      const actualJSON = mockCookieStore.set.mock.calls[0][1];
      expect(JSON.parse(actualJSON)).toEqual(expectedSettings);
    });
  });
});
