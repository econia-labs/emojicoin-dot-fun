import { readLocalStorageCache, writeLocalStorageCache } from "configs/local-storage-keys";
import { createStore } from "zustand";

export type UserSettingsState = {
  animate: boolean;
  showEmptyBars: boolean;
  devMode: boolean;
};

export type UserSettingsActions = {
  setAnimate: (value: boolean) => void;
  setShowEmptyBars: (fn: (prev: boolean) => boolean) => void;
  userAgent: string;
  toggleAnimate: () => void;
  getShowEmptyBars: () => boolean;
  toggleDevMode: () => void;
};

export type UserSettingsStore = UserSettingsState & UserSettingsActions;

const saveSettings = (state: UserSettingsState) => {
  writeLocalStorageCache("settings", state);
};

const defaultValues: UserSettingsState = {
  animate: true,
  showEmptyBars: true,
  devMode: false,
};

const readSettings = (): UserSettingsState => ({
  ...defaultValues,
  ...(readLocalStorageCache<UserSettingsState>("settings") ?? defaultValues),
});

export const createUserSettingsStore = (userAgent: string) =>
  createStore<UserSettingsStore>()((set, get) => ({
    ...readSettings(),
    userAgent,
    getShowEmptyBars: () => get().showEmptyBars,
    setShowEmptyBars: (fn: (prev: boolean) => boolean) =>
      set((state) => {
        const newState = { ...state, showEmptyBars: fn(state.showEmptyBars) };
        saveSettings(newState);
        return newState;
      }),
    setAnimate: (value) =>
      set((state) => {
        const newState = { ...state, animate: value };
        saveSettings(newState);
        return newState;
      }),
    toggleAnimate: () =>
      set((state) => {
        const newState = { ...state, animate: !state.animate };
        saveSettings(newState);
        return newState;
      }),
    toggleDevMode: () => {
      set((state) => {
        const newState = { ...state, devMode: !state.devMode };
        saveSettings(newState);
        return newState;
      })
    }
  }));

export default createUserSettingsStore;
