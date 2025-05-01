"use client";

import { useRouter, useSearchParams } from "next/navigation";

/**
 * Custom hook that provides a function to update URL search parameters.
 * Modifies the current URL's query string based on the provided parameters and then navigates
 * to the updated URL using `router.push` without updating or removing other search params.
 *
 * @returns {(param: Record<string, string | null>) => void} A function that takes an object where keys
 *   represent the search parameter names and values represent their corresponding values.
 *   If a value is a string, the search parameter is set or updated to that string.
 *   If a value is `null`, the corresponding search parameter is removed from the URL.
 *
 * @example
 * const updateSearchParam = useUpdateSearchParam();
 *
 * // Set ?q=search&page=1
 * updateSearchParam({ q: 'search', page: '1' });
 *
 * // Update ?q=newSearch&page=1 (assuming previous state was ?q=search&page=1)
 * updateSearchParam({ q: 'newSearch' });
 *
 * // Remove 'page' parameter, resulting in ?q=newSearch
 * updateSearchParam({ page: null });
 *
 * // Remove 'q' parameter, resulting in the base path
 * updateSearchParam({ q: null });
 */
export function useUpdateSearchParam() {
  const router = useRouter();
  const searchParams = useSearchParams();

  return (param: Record<string, string | null>) => {
    const current = new URLSearchParams(searchParams.toString());

    for (const key in param) {
      const value = param[key];
      if (value === null) {
        current.delete(key);
      } else {
        current.set(key, value);
      }
    }

    const newSearch = current.toString();
    const newUrl = newSearch ? `?${newSearch}` : window.location.pathname;
    router.push(newUrl, { scroll: false });
  };
}
