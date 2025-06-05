"use client";

import { useEffect, useState } from "react";
import resolveConfig from "tailwindcss/resolveConfig";

import tailwindConfig from "../../tailwind.config";

// Get the full config
const fullConfig = resolveConfig(tailwindConfig);
const tailwindBreakpoints = fullConfig.theme.screens as Record<string, string>;

// The keys here should always match the breakpoint keys in tailwind.config.js
type ScreenKey = "sm" | "md" | "lg" | "xl";
export type Breakpoints = Record<ScreenKey, boolean>;

/**
 * A hook that tracks Tailwind's breakpoint states using window.matchMedia.
 *
 * While CSS media queries are sufficient
 * for styling, there are scenarios where you need breakpoint information in your
 * JavaScript code, such as:
 *
 * - Conditionally rendering components based on screen size
 * - Implementing different behaviors for different viewport sizes
 * - Managing complex responsive logic that can't be handled by CSS alone
 *
 * ⚠️ WARNING: This hook should only be used when JavaScript-based breakpoint detection
 * is strictly necessary. In 99% of cases, you should use CSS and Tailwind's
 * responsive utilities instead, as they:
 * - Have better performance
 * - Work during server-side rendering
 * - Don't cause layout shifts
 * - Follow progressive enhancement principles
 *
 * @returns {Breakpoints} An object containing boolean values for each Tailwind breakpoint,
 * indicating whether the current viewport width matches that breakpoint.
 *
 * @example
 * ```tsx
 * const {lg} = useTailwindBreakpoints();
 * if (lg) {
 *   // Viewport is at least 'lg' breakpoint
 * }
 * ```
 */
export function useTailwindBreakpoints(): Breakpoints {
  const [matches, setMatches] = useState<Breakpoints>(() => {
    if (typeof window === "undefined") {
      return Object.fromEntries(
        Object.keys(tailwindBreakpoints).map((key) => [key, false])
      ) as Breakpoints;
    }

    return Object.fromEntries(
      Object.entries(tailwindBreakpoints).map(([key, size]) => {
        const mql = window.matchMedia(`(min-width: ${size})`);
        return [key, mql.matches];
      })
    ) as Breakpoints;
  });

  useEffect(() => {
    const handlers: Array<{
      key: ScreenKey;
      mql: MediaQueryList;
      listener: (e: MediaQueryListEvent) => void;
    }> = [];

    Object.entries(tailwindBreakpoints).forEach(([key, size]) => {
      const mql = window.matchMedia(`(min-width: ${size})`);
      const listener = (e: MediaQueryListEvent) =>
        setMatches((prev) => ({ ...prev, [key]: e.matches }));

      mql.addEventListener("change", listener);
      handlers.push({ key: key as ScreenKey, mql, listener });
    });

    return () => {
      handlers.forEach(({ mql, listener }) => {
        mql.removeEventListener("change", listener);
      });
    };
  }, []);

  return matches;
}
