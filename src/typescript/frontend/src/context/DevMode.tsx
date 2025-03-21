"use client";

import { createContext, type PropsWithChildren, useContext } from "react";
import { useUserSettings } from "./event-store-context";

export const DevModeContext = createContext<boolean>(false);

export function DevModeContextProvider({ children }: PropsWithChildren) {
  const devMode = useUserSettings((s) => s.devMode);
  return <DevModeContext.Provider value={devMode}>{children}</DevModeContext.Provider>;
}

export const useDevMode = (): boolean => {
  const context = useContext(DevModeContext);
  if (context === null) {
    throw new Error("useDevMode must be used within a DevModeContext.");
  }
  return context;
};
