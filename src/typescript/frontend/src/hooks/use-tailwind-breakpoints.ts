"use client";

import { useEffect, useState } from "react";

import { tailwindBreakpoints } from "../../tailwind.config";

type ScreenKey = keyof typeof tailwindBreakpoints;
export type Breakpoints = Record<keyof typeof tailwindBreakpoints, boolean>;

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
  // Initialize state based on current window size
  const [matches, setMatches] = useState<Breakpoints>(() => {
    return Object.fromEntries(
      (Object.entries(tailwindBreakpoints) as [ScreenKey, string][]).map(([key, size]) => {
        const mql = window.matchMedia(`(min-width: ${size})`);
        return [key, mql.matches];
      })
    ) as Breakpoints;
  });

  useEffect(() => {
    // Keep track of all listeners so we can clean up later
    const handlers: Array<{
      key: ScreenKey;
      mql: MediaQueryList;
      listener: (e: MediaQueryListEvent) => void;
    }> = [];

    // Set up a listener for each breakpoint
    (Object.entries(tailwindBreakpoints) as [ScreenKey, string][]).forEach(([key, size]) => {
      const mql = window.matchMedia(`(min-width: ${size})`);
      const listener = (e: MediaQueryListEvent) =>
        setMatches((prev) => ({ ...prev, [key]: e.matches }));

      mql.addEventListener("change", listener);

      handlers.push({ key, mql, listener });
    });

    // Cleanup on unmount
    return () => {
      handlers.forEach(({ mql, listener }) => {
        mql.removeEventListener("change", listener);
      });
    };
  }, []);

  return matches;
}
