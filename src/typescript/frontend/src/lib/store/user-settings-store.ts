import { readLocalStorageCache, writeLocalStorageCache } from "configs/local-storage-keys";
import { createStore } from "zustand";

export type UserSettingsState = {
  animate: boolean;
};

export type UserSettingsActions = {
  setAnimate: (value: boolean) => void;
  userAgent: string;
  toggleAnimate: () => void;
};

export type UserSettingsStore = UserSettingsState & UserSettingsActions;

const saveSettings = (state: UserSettingsState) => {
  writeLocalStorageCache("settings", state);
};

const defaultValues: UserSettingsState = {
  animate: true,
};

const readSettings = (): UserSettingsState => readLocalStorageCache("settings") ?? defaultValues;

export const createUserSettingsStore = (userAgent: string) =>
  createStore<UserSettingsStore>()((set) => ({
    ...readSettings(),
    userAgent,
    setAnimate: (value) =>
      set(() => {
        const state = { animate: value };
        saveSettings(state);
        return state;
      }),
    toggleAnimate: () =>
      set((state) => {
        const newState = { animate: !state.animate };
        saveSettings(newState);
        return newState;
      }),
  }));

export default createUserSettingsStore;
