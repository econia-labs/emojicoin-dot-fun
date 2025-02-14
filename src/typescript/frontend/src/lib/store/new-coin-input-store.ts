import { createStore } from "zustand";

export type NewCoinInputState = {
  name: string;
  description: string;
};

export type NewCoinInputActions = {
  setName: (value: string) => void;
  setDescription: (value: string) => void;
};

export type NewCoinInputStore = NewCoinInputState & NewCoinInputActions;

const defaultValues: NewCoinInputState = {
  name: "",
  description: "",
};

export const createNewCoinInputStore = (initial?: Partial<NewCoinInputState>) =>
  createStore<NewCoinInputStore>()((set, get) => ({
    ...defaultValues,
    ...initial,
    setName: (value) => set({ name: value }),
    setDescription: (value) => set({ description: value }),
    getName: () => get().name,
    getDescription: () => get().description,
  }));

export default createNewCoinInputStore;
