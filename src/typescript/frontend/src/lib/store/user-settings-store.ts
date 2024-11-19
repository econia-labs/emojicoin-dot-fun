import { LOCAL_STORAGE_KEYS } from "configs";
import { parseJSON, stringifyJSON } from "utils";
import { createStore } from "zustand";

export type UserSettingsState = {
  animate: boolean;
  claimKey: string | undefined;
};

export type UserSettingsActions = {
  setAnimate: (value: boolean) => void;
  toggleAnimate: () => void;
  setClaimKey: (claimKey: string | undefined) => void;
};

export type UserSettingsStore = UserSettingsState & UserSettingsActions;

const saveSettings = (state: UserSettingsStore) => {
  localStorage.setItem(LOCAL_STORAGE_KEYS.settings, stringifyJSON(state));
};

const defaultValues: UserSettingsState = {
  animate: true,
  claimKey: undefined,
};

const readSettings = (): UserSettingsState => {
  const s = localStorage.getItem(LOCAL_STORAGE_KEYS.settings);
  if (s !== null) {
    try {
      return parseJSON(s);
    } catch (e) {
      console.error(e, s);
      return defaultValues;
    }
  }
  return defaultValues;
};

export const createUserSettingsStore = () =>
  createStore<UserSettingsStore>()((set) => ({
    ...readSettings(),
    setAnimate: (value) =>
      set((state) => {
        state.animate = value;
        saveSettings(state);
        return state;
      }),
    toggleAnimate: () =>
      set((state) => {
        state.animate = !state.animate;
        saveSettings(state);
        return state;
      }),
    setClaimKey: (claimKey) =>
      set((state) => {
        state.claimKey = claimKey;
        saveSettings(state);
        return state;
      }),
  }));

export default createUserSettingsStore;
