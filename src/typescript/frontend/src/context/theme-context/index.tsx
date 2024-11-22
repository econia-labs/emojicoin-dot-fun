"use client";

import React, { createContext, type PropsWithChildren, useContext, useState } from "react";
import { type DefaultTheme } from "styled-components";

import dark from "theme/dark";
import light from "theme/light";

import { readLocalStorageCache, writeLocalStorageCache } from "configs/local-storage-keys";

type ContextType = {
  theme: DefaultTheme;
  key: "light" | "dark";
  toggleTheme: () => void;
};

const themeValues = {
  light,
  dark,
};

const LIGHT = "light";
const DARK = "dark";

const ThemeContext = createContext<ContextType | null>(null);

const ThemeContextProvider: React.FC<PropsWithChildren<{}>> = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    const themeFromStorage = getThemeValueFromLS();

    writeLocalStorageCache("theme", themeFromStorage);
    return { theme: themeValues[themeFromStorage], key: themeFromStorage };
  });

  const context = {
    theme: theme.theme,
    key: theme.key,
    toggleTheme,
  };

  function toggleTheme() {
    const themeFromStorage = getThemeValueFromLS();
    const newValue = themeFromStorage === LIGHT ? DARK : LIGHT;

    writeLocalStorageCache("theme", newValue);
    setTheme({ theme: themeValues[newValue], key: newValue });
  }

  function getThemeValueFromLS() {
    let themeFromStorage = readLocalStorageCache<string>("theme") ?? LIGHT;

    if (!(themeFromStorage in themeValues)) {
      themeFromStorage = LIGHT;
    }

    return themeFromStorage as typeof LIGHT | typeof DARK;
  }

  return <ThemeContext.Provider value={context}>{children}</ThemeContext.Provider>;
};

export const useThemeContext = () => {
  const themeContext = useContext(ThemeContext);
  if (themeContext === null) {
    throw new Error("Theme context is not found");
  }
  return themeContext;
};

export default ThemeContextProvider;
