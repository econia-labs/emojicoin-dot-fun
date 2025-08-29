import { readLocalStorageCache, writeLocalStorageCache } from "configs/local-storage-keys";
import { createStore } from "zustand";

type UserSettingsState = {
  animate: boolean;
  showEmptyBars: boolean;
  showUsd: boolean;
  favorites: boolean;
};

type UserSettingsActions = {
  setAnimate: (value: boolean) => void;
  setShowEmptyBars: (fn: (prev: boolean) => boolean) => void;
  setShowUsd: (value: boolean) => void;
  userAgent: string;
  toggleAnimate: () => void;
  setFavorites: (value: boolean) => void;
  getShowEmptyBars: () => boolean;
  getShowUsd: () => boolean;
};

export type UserSettingsStore = UserSettingsState & UserSettingsActions;

const saveSettings = (state: UserSettingsState) => {
  writeLocalStorageCache("settings", state);
};

const defaultValues: UserSettingsState = {
  animate: true,
  showEmptyBars: true,
  showUsd: false,
  favorites: false,
};

const readSettings = (): UserSettingsState => readLocalStorageCache("settings") ?? defaultValues;

const createUserSettingsStore = (userAgent: string) =>
  createStore<UserSettingsStore>()((set, get) => ({
    ...readSettings(),
    userAgent,
    getShowUsd: () => get().showUsd,
    setShowUsd: (value) =>
      set((state) => {
        const newState = { ...state, showUsd: value };
        saveSettings(newState);
        return newState;
      }),
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
    setFavorites: (favorites: boolean) =>
      set((state) => {
        const newState = { ...state, favorites };
        saveSettings(newState);
        return newState;
      }),
  }));

export default createUserSettingsStore;
