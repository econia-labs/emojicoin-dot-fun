import { LOCAL_STORAGE_KEYS } from "configs";
import { parseJSON, stringifyJSON } from "utils";
import { createStore } from "zustand";

export type FreeSwapData = {
  claimCode: string;
  feePayerKey: string;
};

export type UserSettingsState = {
  animate: boolean;
  freeSwapData: FreeSwapData | undefined;
};

export type UserSettingsActions = {
  setAnimate: (value: boolean) => void;
  toggleAnimate: () => void;
  setFreeSwapData: (freeSwapData: FreeSwapData | undefined) => void;
};

export type UserSettingsStore = UserSettingsState & UserSettingsActions;

const saveSettings = (state: UserSettingsStore) => {
  localStorage.setItem(LOCAL_STORAGE_KEYS.settings, stringifyJSON(state));
};

const defaultValues: UserSettingsState = {
  animate: true,
  freeSwapData: undefined,
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
    setFreeSwapData: (freeSwapData) =>
      set((state) => {
        state.freeSwapData = freeSwapData;
        saveSettings(state);
        return state;
      }),
  }));

export default createUserSettingsStore;
