"use client";

import { useRouter, useSearchParams } from "next/navigation";

/**
 * Custom hook that provides a function to update URL search parameters.
 * Modifies the current URL's query string based on the provided parameters,
 * then navigates or updates browser history without removing other search params.
 *
 * @param {Options} [options] Optional configuration.
 * @param {boolean} [options.shallow=false] If true, use history.replaceState instead of router.push.
 *
 * @returns {(param: Record<string, string | null>) => void} A function taking an object with search param keys (string | null).
 *
 * @example
 * const updateSearchParam = useUpdateSearchParam();
 * updateSearchParam({ q: 'search', page: '1' });
 */
interface Options {
  shallow: boolean;
}

export function useUpdateSearchParam(options?: Options) {
  const router = useRouter();
  const searchParams = useSearchParams();

  return (param: Record<string, string | null>) => {
    const current = new URLSearchParams(searchParams.toString());

    for (const key in param) {
      const value = param[key];
      if (value === null) current.delete(key);
      else current.set(key, value);
    }

    const newSearch = current.toString();
    const newUrl = newSearch ? `?${newSearch}` : window.location.pathname;
    if (options?.shallow) window.history.replaceState(null, "", newUrl);
    else router.push(newUrl, { scroll: false });
  };
}
