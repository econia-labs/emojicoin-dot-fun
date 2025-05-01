"use client";

import Cookies from "js-cookie";
import type { ResponseCookie } from "next/dist/compiled/@edge-runtime/cookies";

import { CookieUserSettingsManager } from "./cookie-user-settings-common";

export const clientCookies = new CookieUserSettingsManager({
  get: (name: string) => {
    const value = Cookies.get(name);
    return value ? { value } : undefined;
  },
  set: (name: string, value: string, options: Partial<ResponseCookie>) =>
    Cookies.set(name, value, {
      domain: options.domain,
      expires: options.maxAge ? new Date(Date.now() + options.maxAge * 1000) : undefined,
      path: options.path,
      sameSite:
        typeof options.sameSite === "boolean"
          ? options.sameSite
            ? "Strict"
            : "Lax"
          : options.sameSite,
      secure: options.secure,
    }),
  delete: Cookies.remove,
});
