import { createStore } from "zustand";

export type UserSettingsState = {
  animate: boolean;
};

export type UserSettingsActions = {
  setAnimate: (value: boolean) => void;
  toggleAnimate: () => void;
};

export type UserSettingsStore = UserSettingsState & UserSettingsActions;

const defaultValues: UserSettingsState = {
  animate: true,
};

export const createUserSettingsStore = (initial?: Partial<UserSettingsState>) =>
  createStore<UserSettingsStore>()((set) => ({
    ...defaultValues,
    ...initial,
    setAnimate: (value) => set({ animate: value }),
    toggleAnimate: () => set((state) => ({ animate: !state.animate })),
  }));

export default createUserSettingsStore;
